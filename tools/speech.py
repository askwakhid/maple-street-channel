#!/usr/bin/env python3
"""Speech helpers: spoken length of words, and checking the voice-over against the script.

  python3 tools/speech.py check videos/<topic>     transcribe the voice-over and compare it with script.txt

Transcription uses (first one available):
  1. the Voicebox app (needs a Whisper model downloaded in Voicebox > Models)
  2. whisper-cli (whisper.cpp) with a model file in PF_WHISPER_MODEL or ~/.cache/whisper/ggml-*.bin
     - this one also gives word timestamps, used for exact caption timing
"""
import difflib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request
import uuid
from pathlib import Path

ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()
ORD = {"one": "first", "two": "second", "three": "third", "five": "fifth", "eight": "eighth", "nine": "ninth", "twelve": "twelfth"}


def int_words(n):
    n = int(n)
    if n < 20:
        return ONES[n]
    if n < 100:
        return TENS[n // 10] + ("" if n % 10 == 0 else " " + ONES[n % 10])
    if n < 1000:
        return ONES[n // 100] + " hundred" + ("" if n % 100 == 0 else " " + int_words(n % 100))
    for div, name in ((10 ** 9, "billion"), (10 ** 6, "million"), (1000, "thousand")):
        if n >= div:
            return int_words(n // div) + " " + name + ("" if n % div == 0 else " " + int_words(n % div))
    return str(n)


def ordinal_words(n):
    w = int_words(n).split()
    last = w[-1]
    w[-1] = ORD.get(last, (last[:-1] + "ieth") if last.endswith("y") else last + "th")
    return " ".join(w)


TOKEN = re.compile(r"(\$|€|£)?(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?(%|st|nd|rd|th)?", re.I)


def spoken(text):
    """Text as it is spoken: '$3,200' -> 'three thousand two hundred dollars', '25th' -> 'twenty fifth'."""
    def rep(m):
        cur, num, dec, suf = m.group(1), m.group(2).replace(",", ""), m.group(3), (m.group(4) or "").lower()
        if suf in ("st", "nd", "rd", "th"):
            return ordinal_words(num)
        w = int_words(num)
        if dec:
            w += " point " + " ".join(ONES[int(d)] for d in dec) if not cur else f" dollars and {int_words(dec)} cents"
        if cur == "$":
            w += "" if dec else (" dollar" if num == "1" else " dollars")
        elif cur in ("€", "£"):
            w += " euros" if cur == "€" else " pounds"
        if suf == "%":
            w += " percent"
        return " " + w + " "
    return TOKEN.sub(rep, text)


def words(text):
    return [w for w in re.sub(r"[^a-z0-9' ]", " ", spoken(text).lower().replace("-", " ")).split() if w]


def syllables(word):
    w = re.sub(r"[^a-z]", "", word.lower())
    if not w:
        return 1
    groups = re.findall(r"[aeiouy]+", w)
    n = len(groups)
    if w.endswith("e") and not w.endswith(("le", "ee")) and n > 1:
        n -= 1
    return max(1, n)


def spoken_weight(token):
    """How long a script token takes to say (in syllables, plus a little per word)."""
    ws = words(token) or [token]
    return sum(syllables(w) for w in ws) + 0.6 * len(ws)


# ---------------------------------------------------------------- transcription
def voicebox_url():
    return os.environ.get("VOICEBOX_URL", "http://127.0.0.1:17493").rstrip("/")


def _voicebox_whisper():
    try:
        st = json.loads(urllib.request.urlopen(voicebox_url() + "/models/status", timeout=3).read())
    except OSError:
        return None
    ready = [m["model_name"].replace("whisper-", "") for m in st.get("models", []) if m["model_name"].startswith("whisper-") and m.get("downloaded")]
    for pref in ("small", "base", "turbo", "medium", "large"):
        if pref in ready:
            return pref
    return None


def _whisper_cli_model():
    p = os.environ.get("PF_WHISPER_MODEL")
    if p and Path(p).exists():
        return Path(p)
    for d in (Path.home() / ".cache" / "whisper", Path.home() / ".cache" / "whisper.cpp", Path("/opt/homebrew/share/whisper-cpp")):
        if d.exists():
            for f in sorted(d.glob("ggml-*.bin")):
                return f
    return None


def available():
    if shutil.which("whisper-cli") and _whisper_cli_model():
        return "whisper-cli"
    if _voicebox_whisper():
        return "voicebox"
    return None


def transcribe(audio, language="en"):
    """Return (text, words_with_times or None, engine) or (None, None, None) when no engine is available."""
    audio = Path(audio)
    model = _whisper_cli_model()
    if shutil.which("whisper-cli") and model:
        with tempfile.TemporaryDirectory() as td:
            wav = Path(td) / "a.wav"
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(audio), "-ar", "16000", "-ac", "1", str(wav)], check=True)
            base = Path(td) / "out"
            subprocess.run(["whisper-cli", "-m", str(model), "-f", str(wav), "-l", language, "-ml", "1", "-oj", "-of", str(base), "-np"],
                           check=True, capture_output=True)
            data = json.loads((base.with_suffix(".json")).read_text(encoding="utf-8"))
        ws = []
        for seg in data.get("transcription", []):
            t = seg.get("text", "").strip()
            if not t:
                continue
            off = seg.get("offsets", {})
            ws.append({"w": t, "s": off.get("from", 0) / 1000, "e": off.get("to", 0) / 1000})
        return " ".join(w["w"] for w in ws), ws, "whisper-cli"
    vb = _voicebox_whisper()
    if vb:
        # the Voicebox server cannot decode every format (mp3 fails): send 16 kHz mono WAV
        wav = subprocess.run(["ffmpeg", "-v", "error", "-i", str(audio), "-ar", "16000", "-ac", "1", "-f", "wav", "-"],
                             capture_output=True, check=True).stdout
        boundary = uuid.uuid4().hex
        body = b"".join([
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"voice.wav\"\r\nContent-Type: audio/wav\r\n\r\n".encode(),
            wav, b"\r\n",
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"language\"\r\n\r\n{language}\r\n".encode(),
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"model\"\r\n\r\n{vb}\r\n".encode(),
            f"--{boundary}--\r\n".encode()])
        req = urllib.request.Request(voicebox_url() + "/transcribe", data=body, method="POST",
                                     headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
        out = json.loads(urllib.request.urlopen(req, timeout=600).read())
        return out.get("text", ""), None, f"voicebox whisper-{vb}"
    return None, None, None


# ---------------------------------------------------------------- comparison
NUMBER_WORDS = set(ONES + TENS[2:] + ["hundred", "thousand", "million", "billion", "percent", "dollars", "dollar", "point", "cents"])


def compare(sentences, transcript, names=(), pronounce=None):
    """Compare script sentences with the transcript. Returns a list of problems per sentence.

    names: words that must be heard clearly (e.g. the channel name); missing ones are reported even alone."""
    heard = words(transcript)
    for word, sound in (pronounce or {}).items():  # compare with what the voice was asked to say
        sentences = [re.sub(rf"\b{re.escape(word)}\b", sound, s, flags=re.I) for s in sentences]
        names = [n for n in names if n.lower() != word.lower()] + words(sound)
    script_words, owner = [], []
    for i, s in enumerate(sentences):
        for w in words(s):
            script_words.append(w)
            owner.append(i)
    sm = difflib.SequenceMatcher(a=script_words, b=heard, autojunk=False)
    matched = [False] * len(script_words)
    for a, b, n in sm.get_matching_blocks():
        for k in range(n):
            matched[a + k] = True
    problems = []
    for i, s in enumerate(sentences):
        idx = [k for k, o in enumerate(owner) if o == i]
        if not idx:
            continue
        missing = [script_words[k] for k in idx if not matched[k]]
        miss_num = [w for w in missing if (w in NUMBER_WORDS or w.isdigit()) and w not in ("dollars", "dollar", "percent", "cents", "point")]
        ratio = 1 - len(missing) / len(idx)
        miss_name = [w for w in missing if w in {n.lower() for n in names}]
        if miss_num or ratio < 0.8 or miss_name:
            problems.append({"line": i + 1, "text": s, "missing": missing, "numbers": bool(miss_num), "match": round(ratio, 2),
                             "names": miss_name})
    return problems


def refine_word_times(sentences_timing, whisper_words):
    """Replace estimated word times with Whisper's where the words match (in place)."""
    if not whisper_words:
        return 0
    heard = []
    for hw in whisper_words:
        for w in words(hw["w"]):
            heard.append((w, hw["s"], hw["e"]))
    script = []
    for si, s in enumerate(sentences_timing):
        for wi, w in enumerate(s["words"]):
            ws = words(w["w"])
            script.append((ws[0] if ws else w["w"].lower(), si, wi))
    sm = difflib.SequenceMatcher(a=[x[0] for x in script], b=[h[0] for h in heard], autojunk=False)
    n_fixed = 0
    for a, b, n in sm.get_matching_blocks():
        for k in range(n):
            _, si, wi = script[a + k]
            _, s, e = heard[b + k]
            w = sentences_timing[si]["words"][wi]
            if sentences_timing[si]["s"] - 0.3 <= s <= sentences_timing[si]["e"] + 0.3:
                w["s"], w["e"] = round(s, 3), round(max(e, s + 0.08), 3)
                n_fixed += 1
    return n_fixed


def channel_names():
    """The channel name (and character name) must be pronounced clearly."""
    try:
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        import pf
        b = json.loads((pf.BRAND_DIR / "brand.json").read_text(encoding="utf-8"))
        return [w for w in re.findall(r"[a-z0-9]+", (b.get("channel", "") + " " + (b.get("mascot") or {}).get("name", "")).lower()) if len(w) > 2]
    except Exception:
        return []


def pronounce():
    try:
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        import pf
        return (json.loads((pf.BRAND_DIR / "brand.json").read_text(encoding="utf-8")).get("voice") or {}).get("pronounce") or {}
    except Exception:
        return {}


def check_project(proj):
    proj = Path(proj)
    voice = next((proj / "input").glob("voice.*"), None)
    script = proj / "input" / "script.txt"
    if not voice or not script.exists():
        print("no voice-over yet: run init first")
        return None
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    import pf
    sents = pf.split_sentences(script.read_text(encoding="utf-8"))
    text, ws, engine = transcribe(voice)
    names = channel_names()
    if not engine:
        print("no transcription engine: download a Whisper model in Voicebox (Models) or set PF_WHISPER_MODEL for whisper-cli")
        return None
    probs = compare(sents, text, names, pronounce())
    out = {"engine": engine, "voice": voice.name, "voice_size": voice.stat().st_size, "transcript": text, "problems": probs}
    (proj / "build").mkdir(exist_ok=True)
    (proj / "build" / "speech_check.json").write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
    return out


if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] == "check":
        r = check_project(sys.argv[2])
        if r:
            print(f"engine: {r['engine']}")
            for p in r["problems"]:
                tag = ("NUMBERS " if p["numbers"] else "") + ("NAME " if p.get("names") else "")
                print(f"  line {p['line']} ({tag}match {p['match']}): missing {p['missing']}\n    {p['text']}")
            if not r["problems"]:
                print("  every line was heard as written")
    else:
        print(__doc__)
