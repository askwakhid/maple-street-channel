#!/usr/bin/env python3
"""PaperFold Studio CLI.

  python3 tools/pf.py doctor
  python3 tools/pf.py init    PROJECT [--script naskah.txt] [--voice voice.mp3] [--format shorts|long] [--theme NAME]
                               (the script lives in PROJECT/script.txt; --script copies a file there)
  python3 tools/pf.py check   PROJECT
  python3 tools/pf.py preview PROJECT
  python3 tools/pf.py render  PROJECT [--workers N]
  python3 tools/pf.py publish PROJECT   (publish/ folder: video, thumbnails, title, description, pinned comment, UPLOAD.md)
  python3 tools/pf.py make    PROJECT --script naskah.txt [--voice v.mp3] [--format shorts|long]   (all of the above in one go)
  python3 tools/pf.py calc    save --monthly 320 --rate 4 --years 5 | loan ... | percent 10 3200 | share 1600 3200
  python3 tools/pf.py catalog            (lists scene types + icon names)

Everything except storyboard.json is generated. The AI only edits storyboard.json.
"""
import argparse
import difflib
import json
import math
import os
import re
import shutil
import subprocess
import sys
import time
import unicodedata
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import speech  # noqa: E402
ENGINE = ROOT / "engine"
# the channel's brand folder; PF_BRAND_DIR lets logo.py / voicebox.py work on channels/<id>/brand
BRAND_DIR = Path(os.environ["PF_BRAND_DIR"]).resolve() if os.environ.get("PF_BRAND_DIR") else ROOT / "brand"
FPS = 30
SIZES = {"shorts": (1080, 1920), "long": (1920, 1080)}
CAP_CHARS = {"shorts": 22, "long": 44}
CAP_LINES = {"shorts": 2, "long": 1}
TAIL = 1.2  # seconds of music after the voice ends (Shorts)
TAIL_LONG = 8.0  # 16:9: room for YouTube end-screen elements on the outro

# ---------------------------------------------------------------- catalog
SCENES = {
    "hook":     {"need": [], "opt": ["icon", "at", "text"], "desc": "Opening question. Mascot thinks with ICON in a thought bubble; on the AT word it gets surprised and TEXT pops. Use for scene 1."},
    "title":    {"need": ["title"], "opt": ["subtitle", "icon", "mascot"], "desc": "Big paper title card (topic name / chapter name)."},
    "icons":    {"need": ["items"], "opt": ["title"], "max": 4, "desc": "1-4 icons with short labels, each pops on its AT word. Best all-rounder."},
    "list":     {"need": ["items"], "opt": ["title", "style"], "max": 5, "desc": "Checklist rows (icon + text). style: number. For tips / steps in words."},
    "versus":   {"need": ["left", "right"], "opt": ["at", "winner", "vs"], "desc": "Two cards A vs B. left/right = {icon,label,at}. winner: left|right."},
    "myth":     {"need": ["icon", "label"], "opt": ["at", "stamp", "mascot"], "desc": "Claim card, red MYTH stamp lands on AT word. stamp: custom word (e.g. MITOS)."},
    "fact":     {"need": ["icon", "label"], "opt": ["at", "stamp", "mascot"], "desc": "Claim card, green FACT stamp lands on AT word."},
    "number":   {"need": ["value"], "opt": ["prefix", "suffix", "label", "icon", "at", "thousands"], "desc": "Big counting number (statistic). value like \"2.5\" or \"1000\"."},
    "steps":    {"need": ["items"], "opt": [], "max": 4, "desc": "2-4 numbered steps joined by dashed arrows (process / how-to)."},
    "cycle":    {"need": ["items"], "opt": ["icon", "runner"], "max": 5, "desc": "3-5 items on a circle with a runner icon going round (cycles)."},
    "talk":     {"need": ["text"], "opt": ["icon", "pose", "mood"], "desc": "Mascot speaks a short line in a speech bubble. pose: point|wave|cheer|shrug|think|idle (ink also: phone|facepalm|thumbsup|present); mood: happy|shock|sad|think (ink also: smug|excited|worried)."},
    "warning":  {"need": ["label"], "opt": ["icon"], "desc": "Alert scene with hazard tape and shaking icon (danger, important)."},
    "zoom":     {"need": ["icon", "detail"], "opt": ["label", "at"], "desc": "Magnifier slides over ICON on AT word and reveals DETAIL icon (what's inside)."},
    "chart":    {"need": ["items"], "opt": ["title", "prefix", "suffix"], "max": 6, "desc": "Bar chart. items = {label, value, at}."},
    "timeline": {"need": ["items"], "opt": [], "max": 5, "desc": "Points on a line (history, then->now). items = {icon,label,at}."},
    "cause":    {"need": ["from", "to"], "opt": ["text"], "desc": "Cause -> effect arrow. from/to = {icon,label,at}."},
    "bigtext":  {"need": ["text"], "opt": ["highlight"], "desc": "Large words on torn paper; HIGHLIGHT word gets a marker. Max ~8 words."},
    "image":    {"need": ["image"], "opt": ["label"], "desc": "Your own picture in a polaroid. image = file name inside PROJECT/images/."},
    "outro":    {"need": [], "opt": ["text", "at"], "desc": "Logo, channel name, subscribe button click, mascot waves. Use for the last scene."},
    "meet":     {"need": [], "opt": ["title", "subtitle", "items", "pose", "mood", "note", "at"], "max": 3, "desc": "Introduce the main character: handwritten title (e.g. Meet Sam.), subtitle, up to 3 fact chips {icon,label,at}."},
    "budget":   {"need": ["items"], "opt": ["total", "period", "prefix", "left", "left_label", "left_color", "title", "note", "at"], "max": 5, "desc": "Money breakdown panel: rows {label,value,at} fill as spoken; AT = moment the red LEFT stamp appears. Character reacts."},
    "growth":   {"need": ["value"], "opt": ["start_value", "label", "years", "from_label", "prefix", "suffix", "note", "at"], "desc": "Compound-growth line chart counting from START_VALUE (default 0) to VALUE (numbers). AT = when the line starts."},
    "phone":    {"need": ["items"], "opt": ["time", "note", "mood"], "max": 4, "desc": "Big phone; notifications {icon,title,text,at} drop in (bank alerts, subscriptions)."},
    "dialogue": {"need": ["cast"], "opt": ["place", "poses", "moods", "bubble"], "cast": True, "desc": "Conversation: 1-3 cast members (brand voice.cast names, e.g. [\"MIA\",\"WALTER\"]) inside PLACE (brand places key). Whoever speaks the current line talks, gestures and gets the speech bubble. poses/moods = {NAME: pose/mood}. bubble: false hides the bubble. May run up to ~20 s."},
    "repeat":   {"need": ["cast"], "opt": ["place"], "cast": True, "desc": "Speaking practice for [REPEAT] lines: CAST[0] says each phrase (slowed by brand voice.slow_segments), then during the silent pause the phrase stays on a card with a mic countdown and a praise burst (Great job!). A narrator line right after a pause is shown as spoken praise. May run up to ~30 s."},
    "location": {"need": ["place"], "opt": ["title", "subtitle", "badge", "at"], "cast": True, "desc": "Street view of Maple Street; the camera zooms to PLACE (brand places key) on the AT word, its sign pops. title/subtitle = episode card, badge = level (e.g. A2)."},
}
ICONS = """heart lungs brain eye mask virus pill hospital doctor thermometer drop fire smoke cloud rain sun moon snow tree leaf
forest mountain wave house window factory car globe money coins chart chart_down clock hourglass calendar lightbulb book rocket
phone laptop star check cross warning question exclaim lock shield person child elder pregnant family apple food water battery
gear megaphone trophy target egg fish cat dog bird plant sleep run muscle soap idea search chat share bell play
wallet card piggy receipt bank cart percent calculator cash coffee paycheck key briefcase subscription gift tag""".split()
ALIAS = {
    "lung": "lungs", "paru": "lungs", "jantung": "heart", "mata": "eye", "masker": "mask", "obat": "pill", "api": "fire", "asap": "smoke",
    "awan": "cloud", "hujan": "rain", "matahari": "sun", "bulan": "moon", "pohon": "tree", "hutan": "forest", "rumah": "house",
    "jendela": "window", "uang": "money", "dollar": "money", "jam": "clock", "time": "clock", "waktu": "clock", "buku": "book",
    "bintang": "star", "yes": "check", "no": "cross", "x": "cross", "alert": "warning", "bahaya": "warning", "danger": "warning",
    "anak": "child", "kid": "child", "lansia": "elder", "old": "elder", "hamil": "pregnant", "orang": "person", "people": "person",
    "makanan": "food", "air": "water", "ide": "idea", "bulb": "lightbulb", "cari": "search", "rumah_sakit": "hospital", "dokter": "doctor",
    "germ": "virus", "bakteri": "virus", "telur": "egg", "ikan": "fish", "kucing": "cat", "anjing": "dog", "burung": "bird",
    "tanaman": "plant", "tidur": "sleep", "olahraga": "run", "exercise": "run", "otak": "brain", "kalender": "calendar", "grafik": "chart",
    "growth": "chart", "decline": "chart_down", "hp": "phone", "komputer": "laptop", "computer": "laptop",
    "dompet": "wallet", "kartu": "card", "credit": "card", "celengan": "piggy", "savings": "piggy", "tabungan": "piggy", "struk": "receipt",
    "bill": "receipt", "bills": "receipt", "tagihan": "receipt", "belanja": "cart", "shopping": "cart", "persen": "percent", "interest": "percent",
    "bunga": "percent", "kalkulator": "calculator", "tunai": "cash", "kopi": "coffee", "gaji": "paycheck", "salary": "paycheck", "kunci": "key",
    "rent": "key", "sewa": "key", "kerja": "briefcase", "job": "briefcase", "langganan": "subscription", "subscriptions": "subscription",
    "hadiah": "gift", "diskon": "tag", "sale": "tag",
}
# keyword -> icon, used only for the automatic first draft
KEYWORDS = {
    "lungs": "paru lung lungs asma asthma napas pernapasan breath breathing respiratory",
    "heart": "jantung heart kardiovaskular cardiovascular cinta love",
    "eye": "mata eye eyes",
    "smoke": "asap smoke kabut haze polusi pollution",
    "fire": "api fire kebakaran karhutla wildfire burn bakar panas",
    "forest": "hutan forest lahan",
    "mask": "masker mask n95 respirator",
    "window": "jendela window",
    "house": "rumah house home ruangan indoor",
    "child": "anak child children kids kid",
    "elder": "lansia elderly senior",
    "pregnant": "hamil pregnant",
    "hospital": "medis medical hospital pertolongan klinik clinic",
    "doctor": "dokter doctor",
    "virus": "virus kuman germ bakteri bacteria partikel particle particles infeksi",
    "brain": "otak brain pikiran mind memory",
    "water": "minum drink hydrate",
    "drop": "tetes drop hujan rain",
    "sun": "matahari sun sunlight",
    "money": "uang money dollar rupiah gaji salary income",
    "chart": "naik grow growth meningkat increase statistik data",
    "clock": "waktu jam time hour hours menit minute",
    "share": "bagikan share",
    "sleep": "tidur sleep",
    "run": "olahraga exercise lari run",
    "food": "makan makanan food eat",
    "idea": "tahukah ide idea tip tips",
    "warning": "bahaya danger berbahaya risiko risk waspada",
    "shield": "lindungi melindungi protect protection aman safe",
    "cloud": "udara air awan cloud",
    "egg": "telur egg",
    "globe": "dunia world global bumi earth",
    "wallet": "wallet dompet broke",
    "piggy": "save saving savings tabung tabungan menabung",
    "key": "rent sewa kos",
    "subscription": "subscription subscriptions langganan netflix streaming",
    "card": "credit card kartu debt utang hutang",
    "paycheck": "paycheck payday gaji salary",
    "percent": "percent persen interest bunga",
    "cart": "shopping belanja buy beli",
    "coffee": "coffee kopi latte",
}
CAUSE = re.compile(r"\b(menyebabkan|memicu|meningkatkan|mengakibatkan|bisa|causes?|leads?|triggers?|raises?|makes?)\b", re.I)
NEG = re.compile(r"\b(myth|myths|mitos|salah kaprah|not true|isn't true|is false|wrong)\b", re.I)
# a number worth a big counter: money ($3,200 / Rp 50.000), a percentage (10%), or a plain number >= 100.
# Ordinals (25th) and small plain numbers (ages, counts) are skipped.
NUM = re.compile(r"(?P<pre>\$|Rp\.?\s?|€|£)?(?P<num>\d{1,3}(?:[.,]\d{3})+|\d+(?:\.\d+)?)(?P<suf>%|k\b|K\b)?(?!\d|st\b|nd\b|rd\b|th\b)")


def big_number(text):
    for m in NUM.finditer(text):
        raw = m.group("num")
        val = float(re.sub(r"[.,](?=\d{3}\b)", "", raw)) if re.search(r"[.,]\d{3}\b", raw) else float(raw)
        if m.group("pre") or m.group("suf") == "%" or val >= 100:
            after = re.sub(r"[^\w\s'-]", "", " ".join(text[m.end():].split()[:3])).strip()
            pre = (m.group("pre") or "").strip()
            return {"value": f"{val:g}" if val != int(val) else str(int(val)), "prefix": pre + (" " if pre.startswith("Rp") else ""),
                    "suffix": m.group("suf") or "", "label": after, "at": m.group(0).strip()}
    return None


def die(msg):
    print("ERROR: " + msg)
    sys.exit(1)


def run(cmd, **kw):
    return subprocess.run(cmd, check=True, **kw)


def norm(w):
    w = unicodedata.normalize("NFKD", w.lower())
    return "".join(ch for ch in w if ch.isalnum())


def load_json(p):
    try:
        return json.loads(Path(p).read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        die(f"{p} is not valid JSON: line {e.lineno} col {e.colno}: {e.msg}. Fix the comma/quote/bracket there.")


# ---------------------------------------------------------------- audio analysis
def need_numpy():
    try:
        import numpy  # noqa: F401
        return numpy
    except ImportError:
        die("numpy is missing. Run:  python3 -m pip install numpy")


def decode(path, sr, af=None):
    np = need_numpy()
    cmd = ["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(sr)] + (["-af", af] if af else []) + ["-f", "f32le", "-"]
    out = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(out, dtype=np.float32)


# TTS voices sound thin and a bit harsh: remove rumble, add warmth and presence, tame "s" sounds, even out the level
VOICE_CHAIN = ("highpass=f=80,equalizer=f=180:t=q:w=1.0:g=1.5,equalizer=f=450:t=q:w=1.2:g=-1.5,"
               "equalizer=f=3200:t=q:w=1.0:g=2.5,deesser=i=0.35,"
               "acompressor=threshold=0.125:ratio=2.5:attack=8:release=120:makeup=1.4")


def voice_amp(proj):
    """Loudness of the voice per video frame (0..1), used for the character's mouth. Cached in build/amp.json."""
    np = need_numpy()
    voice = next((proj / "input").glob("voice.*"), None)
    if not voice:
        return []
    cp = proj / "build" / "amp.json"
    if cp.exists():
        c = json.loads(cp.read_text())
        if c.get("size") == voice.stat().st_size:
            return c["amp"]
    sr = 16000
    x = decode(voice, sr)
    hop = sr // FPS
    n = len(x) // hop
    rms = np.sqrt((x[: n * hop].reshape(n, hop) ** 2).mean(axis=1))
    ref = np.percentile(rms, 95) + 1e-9
    amp = np.clip(rms / ref, 0, 1)
    amp = [round(float(a), 2) for a in amp]
    cp.write_text(json.dumps({"size": voice.stat().st_size, "amp": amp}))
    return amp


def reverb(x, sr, seconds=1.2, seed=1):
    """Simple stereo-friendly reverb: convolution with decaying noise (FFT, fast)."""
    np = need_numpy()
    rng = np.random.default_rng(seed)
    L = int(seconds * sr)
    ir = rng.normal(0, 1, L) * np.exp(-np.arange(L) / sr * 4.0)
    ir[: int(0.012 * sr)] = 0  # pre-delay
    ir /= np.abs(ir).sum() ** 0.5 * 4
    nfft = 1 << int(np.ceil(np.log2(len(x) + L)))
    y = np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]
    return y


def loop_music(m, n, sr, xfade=2.0):
    """Repeat a track to length n with crossfades instead of hard cuts."""
    np = need_numpy()
    if len(m) >= n:
        return m[:n]
    f = int(xfade * sr)
    out = m.copy()
    ramp = np.linspace(0, 1, f)
    while len(out) < n:
        tail = out[-f:] * (1 - ramp) + m[:f] * ramp
        out = np.concatenate([out[:-f], tail, m[f:]])
    return out[:n]


SEGMENT_RE = re.compile(r"^\[\s*([A-Z][A-Z0-9 _-]*?)\s*\]$")
SPEAKER_RE = re.compile(r"^([A-Z][A-Z0-9_'-]{0,19}):\s*(.*)$")


def brand_cast():
    """brand.json voice.cast ({"MIA": {...}, ...}). Empty for single-narrator channels."""
    bp = BRAND_DIR / "brand.json"
    V = (load_json(bp).get("voice") or {}) if bp.exists() else {}
    return {k.upper(): v for k, v in (V.get("cast") or {}).items()}


def brand_places():
    """brand.json places ({"bakery": {"no": 1, "name": "Brooks Bakery", "kind": "bakery", ...}})."""
    bp = BRAND_DIR / "brand.json"
    return (load_json(bp).get("places") or {}) if bp.exists() else {}


def parse_script(text, cast=None):
    """Script -> one dict per sentence: {"text", "speaker", "segment"}.

    Speaker tags (`MIA: Hi!`) and segment markers (`[STORY]`) are read only when the brand has a
    voice.cast; otherwise every line is plain narration, exactly as before.
    """
    cast = brand_cast() if cast is None else cast
    text = text.replace("\r", "")
    parts, segment = [], None
    for para in re.split(r"\n\s*\n|\n", text):
        para = para.strip()
        if not para:
            continue
        speaker = None
        if cast:
            m = SEGMENT_RE.match(para)
            if m:
                segment = m.group(1).strip()
                continue
            m = SPEAKER_RE.match(para)
            if m and m.group(1) in cast:
                speaker, para = m.group(1), m.group(2).strip()
            elif m:
                die(f'unknown speaker "{m.group(1)}" in: {para[:60]!r}. Cast in brand.json voice.cast: ' + ", ".join(cast))
            else:
                speaker = next((k for k, v in cast.items() if v.get("default")), None)
                if not speaker:
                    die(f"line has no speaker tag (e.g. MIA: ...): {para[:60]!r}")
            # one speaker turn = one line (one voice take, one numbered line in lines.md)
            if para:
                parts.append({"text": para, "speaker": speaker, "segment": segment})
            continue
        for s in re.split(r"(?<=[.!?…])[\"”’)]*\s+", para):
            s = s.strip()
            if s:
                parts.append({"text": s, "speaker": speaker, "segment": segment})
    return parts


def split_sentences(text):
    return [p["text"] for p in parse_script(text)]


def voiced_mask(x, sr):
    np = need_numpy()
    hop = int(sr * 0.01)
    n = len(x) // hop
    fr = x[: n * hop].reshape(n, hop)
    db = 20 * np.log10(np.sqrt((fr ** 2).mean(axis=1)) + 1e-9)
    thr = max(np.percentile(db, 95) - 32, np.percentile(db, 10) + 6)
    v = db > thr
    # close tiny gaps (<60 ms) and drop tiny blips (<40 ms)
    def runs(arr, val):
        out, i = [], 0
        while i < len(arr):
            if arr[i] == val:
                j = i
                while j < len(arr) and arr[j] == val:
                    j += 1
                out.append((i, j))
                i = j
            else:
                i += 1
        return out
    for a, b in runs(v, False):
        if b - a < 6 and a > 0 and b < len(v):
            v[a:b] = True
    for a, b in runs(v, True):
        if b - a < 4:
            v[a:b] = False
    return v, 0.01


def align(script_text, voice_path):
    np = need_numpy()
    sents = split_sentences(script_text)
    if not sents:
        die("script is empty")
    x = decode(voice_path, 16000)
    dur = len(x) / 16000.0
    v, hop = voiced_mask(x, 16000)
    idx = np.nonzero(v)[0]
    if len(idx) == 0:
        die("voice file seems silent")
    first, last = idx[0], idx[-1] + 1
    # pauses inside speech
    pauses = []
    i = first
    while i < last:
        if not v[i]:
            j = i
            while j < last and not v[j]:
                j += 1
            if (j - i) * hop >= 0.15:
                pauses.append((i, j))
            i = j
        else:
            i += 1
    cumv = np.cumsum(v.astype(np.int32))
    total_v = cumv[last - 1]

    def vfrac(fi):
        return cumv[min(fi, len(cumv) - 1)] / total_v

    weights = [sum(speech.spoken_weight(w) for w in s.split()) + 2 for s in sents]
    cw = np.cumsum(weights) / sum(weights)
    N = len(sents)
    need = N - 1
    P = len(pauses)
    bounds = []
    if need > 0 and P >= need:
        # DP over pauses: each sentence's voiced duration should match its share of the text.
        # Scoring per sentence (not cumulative position) keeps one early mistake from shifting everything after it.
        pv = [cumv[(a + b) // 2] for a, b in pauses]
        pl = [(b - a) * hop for a, b in pauses]
        exp_ = [w / sum(weights) * total_v for w in weights]
        INF = 1e18

        def seg_cost(vdur, k):
            r = max(vdur, 1) / exp_[k]
            return (math.log(r)) ** 2 * 4

        dp = [[INF] * P for _ in range(need)]
        bk = [[-1] * P for _ in range(need)]
        for j in range(P):
            dp[0][j] = seg_cost(pv[j] - cumv[first], 0) - min(pl[j], 1.2)
        for k in range(1, need):
            for j in range(k, P):
                best, arg = INF, -1
                for jj in range(k - 1, j):
                    if dp[k - 1][jj] >= INF:
                        continue
                    c = dp[k - 1][jj] + seg_cost(pv[j] - pv[jj], k)
                    if c < best:
                        best, arg = c, jj
                if arg >= 0:
                    dp[k][j] = best - min(pl[j], 1.2)
                    bk[k][j] = arg
        j = min(range(P), key=lambda jj: dp[need - 1][jj] + seg_cost(total_v - pv[jj], need) if dp[need - 1][jj] < INF else INF)
        chosen = []
        for k in range(need - 1, -1, -1):
            chosen.append(j)
            j = bk[k][j]
        chosen.reverse()
        bounds = [pauses[j] for j in chosen]
    elif need > 0:
        print(f"WARNING: found only {P} pauses for {N} sentences; timing is estimated proportionally.")
        for k in range(need):
            target = cw[k] * total_v
            fi = int(np.searchsorted(cumv, target))
            bounds.append((fi, fi))
    # sentence spans in frames
    spans = []
    s0 = first
    for a, b in bounds:
        spans.append((s0, a))
        s0 = b
    spans.append((s0, last))
    out = []
    for si, (sent, (a, b)) in enumerate(zip(sents, spans)):
        words = sent.split()
        # weight = spoken syllables ("$3,200" = "three thousand two hundred dollars") + a short pause after , ; :
        ww = [speech.spoken_weight(w) + (1.2 if re.search(r"[,;:]$", w) else 0) for w in words]
        tot = sum(ww)
        vi = np.nonzero(v[a:b])[0] + a
        if len(vi) == 0:
            vi = np.arange(a, max(b, a + 1))
        def at(frac):
            k = min(len(vi) - 1, int(frac * len(vi)))
            return float(vi[k] * hop)
        acc = 0.0
        wl = []
        for w, wt in zip(words, ww):
            s = at(acc / tot)
            acc += wt
            e = at(min(acc / tot, 0.9999)) + hop
            wl.append({"w": w, "s": round(s, 3), "e": round(max(e, s + 0.08), 3)})
        out.append({"i": si + 1, "text": sent, "s": round(a * hop, 3), "e": round(b * hop, 3), "words": wl})
    return {"duration": round(dur, 3), "sentences": out}


# ---------------------------------------------------------------- auto storyboard
def kw_index():
    idx = {}
    for icon, words in KEYWORDS.items():
        for w in words.split():
            idx[norm(w)] = icon
    return idx


def find_keywords(sentence, idx):
    found = []
    for w in sentence.split():
        n = norm(w)
        for k, icon in idx.items():
            if len(k) >= 3 and (n == k or (n.startswith(k) and len(n) - len(k) <= 3)):
                if icon not in [f[1] for f in found]:
                    found.append((w.strip(".,!?;:\"'()"), icon))
                break
    return found


def short_text(s, n):
    w = s.split()
    return " ".join(w[:n]) + ("..." if len(w) > n else "")


def auto_storyboard(timing, fmt, theme):
    idx = kw_index()
    S = timing["sentences"]
    groups, cur = [], []
    for s in S:
        cur.append(s)
        if (cur[-1]["e"] - cur[0]["s"]) >= 2.2 or s is S[-1]:
            groups.append(cur)
            cur = []
    if cur:
        groups.append(cur)
    scenes = []
    for gi, g in enumerate(groups):
        text = " ".join(s["text"] for s in g)
        lines = [s["i"] for s in g]
        kws = find_keywords(text, idx)
        num = big_number(text)
        sc = {"lines": lines}
        if gi == 0:
            sc.update(type="hook", icon=kws[0][1] if kws else "question")
            if kws:
                sc["at"] = kws[0][0]
        elif gi == len(groups) - 1:
            sc.update(type="outro")
        elif num:
            sc.update(type="number", **{k: v for k, v in num.items() if v})
        elif "?" in text:
            q = next((x["text"] for x in g if "?" in x["text"]), text)
            sc.update(type="talk", text=short_text(q, 9), icon=kws[0][1] if kws else "question", pose="shrug", mood="think")
        elif NEG.search(text) and kws:
            sc.update(type="myth", icon=kws[0][1], label=" ".join(text.split()[:5]).strip(".,"), at=kws[0][0])
        elif len(kws) >= 3 and text.count(",") >= 2:
            sc.update(type="list", items=[{"icon": ic, "text": w.capitalize(), "at": w} for w, ic in kws[:4]])
        elif len(kws) == 2 and CAUSE.search(text):
            sc.update(type="cause", **{"from": {"icon": kws[0][1], "label": kws[0][0].capitalize(), "at": kws[0][0]},
                                        "to": {"icon": kws[1][1], "label": kws[1][0].capitalize(), "at": kws[1][0]}})
        elif len(kws) >= 2:
            sc.update(type="icons", items=[{"icon": ic, "label": w.capitalize(), "at": w} for w, ic in kws[:4]])
        elif kws and gi % 2:
            sc.update(type="talk", text=short_text(g[0]["text"], 9), icon=kws[0][1], pose="point")
        elif kws:
            sc.update(type="icons", items=[{"icon": kws[0][1], "label": kws[0][0].capitalize(), "at": kws[0][0]}])
        else:
            longest = max(text.split(), key=lambda w: len(norm(w)))
            short = short_text(g[0]["text"], 7)
            sc.update(type="bigtext", text=short, highlight=longest.strip(".,!?"))
        scenes.append(sc)
    return {"format": fmt, "theme": theme, "scenes": scenes}


# ---------------------------------------------------------------- validation + resolve
def closest(name, choices):
    m = difflib.get_close_matches(str(name).lower(), choices, n=3, cutoff=0.5)
    return ", ".join(m) if m else f"see `python3 {Path(__file__).resolve()} catalog`"


def find_word(words, target):
    """Return the first word (dict) matching target (first word of target if a phrase)."""
    tw = [norm(x) for x in str(target).split() if norm(x)]
    if not tw:
        return None
    for i, w in enumerate(words):
        if norm(w["w"]) == tw[0] and all(i + k < len(words) and norm(words[i + k]["w"]).startswith(tw[k][:4]) for k in range(1, len(tw))):
            return w
    for w in words:
        n = norm(w["w"])
        if n.startswith(tw[0]) or (len(tw[0]) >= 4 and tw[0] in n):
            return w
    return None


# ---------------------------------------------------------------- quality warnings (things cheap models get wrong)
WORD_NUM = {w: i for i, w in enumerate("zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen "
                                       "fifteen sixteen seventeen eighteen nineteen twenty".split())}
WORD_NUM.update({"thirty": 30, "forty": 40, "fifty": 50, "sixty": 60, "seventy": 70, "eighty": 80, "ninety": 90,
                 "hundred": 100, "thousand": 1000, "half": 50})
NUM_IN_TEXT = re.compile(r"\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?")
# scene types whose main visual waits for an "at" word
WAITS_FOR_AT = {"phone", "icons", "list", "steps", "cycle", "timeline", "chart", "cause", "versus"}
TEXT_KEYS = ("title", "subtitle", "text", "label", "total", "left", "note", "stamp", "value")


def numbers_in(text, words=True):
    out = [float(m.replace(",", "")) for m in NUM_IN_TEXT.findall(text)]
    if words:
        out += [float(v) for w, v in WORD_NUM.items() if re.search(rf"\b{w}\b", text, re.I)]
    return out


def luminance(hexcol):
    h = str(hexcol).lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    if not re.fullmatch(r"[0-9a-fA-F]{6}", h):
        return None
    ch = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    ch = [c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4 for c in ch]
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]


BLOCK = "MUST FIX: "


def quality_warnings(scenes, S, total):
    """Warnings for things cheap models get wrong. Those starting with BLOCK stop render/publish."""
    w = []

    def must(msg):
        w.append(BLOCK + msg)
    script = " ".join(s["text"] for s in S)
    # 1. the first second of the video must show something
    if scenes:
        sc = scenes[0]
        if sc["type"] in WAITS_FOR_AT:
            ts = [it.get("t", 0) for it in sc.get("items") or []] + [sc[k].get("t", 9) for k in ("left", "right", "from", "to") if isinstance(sc.get(k), dict)]
            if ts and min(ts) > 1.0:
                must(f"scene 1: nothing appears until {min(ts):.1f}s. Viewers swipe in the first second: give the first item an \"at\" "
                         "word from the first 3 words of line 1, or open with hook/meet/bigtext")
    # 2. long static scenes
    for k, sc in enumerate(scenes, 1):
        d = sc["end"] - sc["start"]
        if d > {"dialogue": 20, "repeat": 30}.get(sc.get("type"), 12):
            must(f"scene {k} lasts {d:.0f}s (lines {sc['lines'][0]}-{sc['lines'][-1]}). Keep scenes under ~9s: split it into 2-3 scenes")
    if scenes and total / len(scenes) > 9:
        w.append(f"only {len(scenes)} scenes for {total:.0f}s (average {total / len(scenes):.0f}s). Aim for one scene every 3-9 seconds")
    # 3. cents read aloud
    cents = sorted(set(re.findall(r"\$\d[\d,]*\.\d{2}\b", script)))
    if cents:
        must("the narration reads cents aloud (" + ", ".join(cents[:4]) + "). Round in script.txt (\"about $92 a month\") "
                 "and keep exact numbers in publish.json -> description")
    # 4. numbers on screen that the script never mentions (invented facts)
    known_digits = numbers_in(script, words=False)
    known_words = {float(v) for w, v in WORD_NUM.items() if re.search(rf"\b{w}\b", script, re.I)}

    def said(n):
        # digits may be rounded on screen ($516 for $515.52); spelled-out numbers must match exactly
        return any(abs(n - x) <= max(0.5, 0.02 * x) for x in known_digits) or n in known_words
    def walk(obj, where):
        if isinstance(obj, dict):
            for key, v in obj.items():
                if key in TEXT_KEYS and isinstance(v, str):
                    for n in numbers_in(v, words=False):
                        if n >= 2 and not said(n):
                            must(f'{where}: "{v}" shows {n:g}, which is not in the script. Use only numbers the narrator says')
                            break
                elif isinstance(v, (dict, list)):
                    walk(v, f"{where}.{key}")
        elif isinstance(obj, list):
            for j, v in enumerate(obj):
                walk(v, f"{where}[{j}]")
    for k, sc in enumerate(scenes, 1):
        walk({kk: vv for kk, vv in sc.items() if kk not in ("lines", "start", "end", "_seed", "turns")}, f"scene {k}")
    # 5. text colours that are hard to read on white cards
    def colours(obj, where):
        if isinstance(obj, dict):
            for key, v in obj.items():
                if key == "color" and isinstance(v, str):
                    L = luminance(v)
                    if L is not None and (1.05 / (L + 0.05)) < 3:
                        must(f'{where}: color {v} is too light to read on white. Use a dark colour (e.g. "#FF4D4D", "#0E8F57", "#141414")')
                elif key == "left_color" and isinstance(v, str):
                    L = luminance(v)
                    if L is not None and (1.05 / (L + 0.05)) < 2.5:
                        must(f'{where}: left_color {v} is too light for white text. Use a darker colour')
                elif isinstance(v, (dict, list)):
                    colours(v, f"{where}.{key}")
        elif isinstance(obj, list):
            for j, v in enumerate(obj):
                colours(v, f"{where}[{j}]")
    for k, sc in enumerate(scenes, 1):
        colours(sc, f"scene {k}")
    return w


def check(project, quiet=False):
    proj = Path(project)
    timing = load_json(proj / "build" / "timing.json")
    sb = load_json(proj / "storyboard.json")
    brand = load_json(BRAND_DIR / "brand.json")
    errors, warns = [], []
    fmt = sb.get("format", "shorts")
    if fmt not in SIZES:
        errors.append(f'format "{fmt}" must be "shorts" or "long"')
        fmt = "shorts"
    theme_name = sb.get("theme") or brand.get("theme", "meadow")
    if not (ROOT / "themes" / f"{theme_name}.json").exists():
        errors.append(f'theme "{theme_name}" not found. Use one of: ' + ", ".join(p.stem for p in (ROOT / "themes").glob("*.json")))
        theme_name = "meadow"
    S = timing["sentences"]
    nL = len(S)
    scenes = sb.get("scenes")
    if not isinstance(scenes, list) or not scenes:
        die('storyboard.json needs "scenes": [ ... ]')
    expected = 1
    for k, sc in enumerate(scenes):
        tag = f"scene {k + 1}"
        if not isinstance(sc, dict):
            errors.append(f"{tag}: must be an object {{...}}")
            continue
        lines = sc.get("lines")
        if not isinstance(lines, list) or not lines or not all(isinstance(x, int) for x in lines):
            errors.append(f'{tag}: "lines" must be a list of line numbers, e.g. [{expected}]')
            continue
        if lines != list(range(lines[0], lines[0] + len(lines))):
            errors.append(f"{tag}: lines {lines} must be consecutive")
        if lines[0] != expected:
            errors.append(f"{tag}: lines should start at {expected} (got {lines[0]}). Every line 1..{nL} must be used once, in order.")
        expected = lines[-1] + 1
        ty = sc.get("type")
        if ty not in SCENES:
            errors.append(f'{tag}: type "{ty}" unknown. Closest: {closest(ty, list(SCENES))}')
            continue
        for bad in ("start", "end", "t", "_seed"):
            if bad in sc:
                errors.append(f'{tag}: "{bad}" is filled in automatically - remove it (timing comes from "at")')
        spec = SCENES[ty]
        for f in spec["need"]:
            if f not in sc or sc[f] in (None, "", []):
                errors.append(f'{tag} ({ty}): missing "{f}"')
        if "max" in spec and isinstance(sc.get("items"), list) and len(sc["items"]) > spec["max"]:
            errors.append(f'{tag} ({ty}): max {spec["max"]} items (got {len(sc["items"])}). Split into two scenes.')
        # icons anywhere
        def chk_icon(v, where):
            if v is None:
                return
            if isinstance(v, str) and v.startswith("img:"):
                if not (proj / "images" / v[4:]).exists():
                    errors.append(f"{tag}: {where} image {v[4:]} not found in {proj / 'images'}")
                return
            if str(v).lower() not in ICONS and str(v).lower() not in ALIAS:
                errors.append(f'{tag}: {where} "{v}" unknown. Closest: {closest(v, ICONS)}')
        for key in ("icon", "detail", "runner"):
            chk_icon(sc.get(key), key)
        for key in ("left", "right", "from", "to"):
            if isinstance(sc.get(key), dict):
                chk_icon(sc[key].get("icon"), key + ".icon")
        for j, it in enumerate(sc.get("items") or []):
            if not isinstance(it, dict):
                errors.append(f"{tag}: items[{j}] must be an object like {{\"icon\":\"heart\",\"label\":\"Heart\"}}")
                continue
            chk_icon(it.get("icon"), f"items[{j}]")
            lab = it.get("label") or it.get("text") or ""
            if ty in ("icons", "steps", "cycle", "timeline") and len(lab) > 24:
                warns.append(f'{tag}: items[{j}] label "{lab}" is long; keep labels to 1-3 words')
        if ty == "bigtext" and len(str(sc.get("text", "")).split()) > 10:
            warns.append(f"{tag}: bigtext has more than 10 words; shorten it")
        if ty == "talk" and len(str(sc.get("text", ""))) > 80:
            warns.append(f"{tag}: talk text over 80 characters; shorten it")
        if spec.get("cast"):
            cast, places = brand_cast(), brand_places()
            if not cast:
                errors.append(f'{tag} ({ty}): needs brand.json voice.cast (a multi-character channel)')
            for who in sc.get("cast") or []:
                if str(who).upper() not in cast:
                    errors.append(f'{tag}: cast "{who}" unknown. Cast: ' + ", ".join(cast))
            if ty in ("dialogue", "repeat") and not 1 <= len(sc.get("cast") or []) <= 3:
                errors.append(f"{tag} (dialogue): cast must list 1-3 characters")
            if sc.get("place") and sc["place"] not in places:
                errors.append(f'{tag}: place "{sc["place"]}" unknown. Places in brand.json: ' + ", ".join(places))
        if ty == "image" and sc.get("image") and not (proj / "images" / sc["image"]).exists():
            errors.append(f"{tag}: image {sc['image']} not found in {proj / 'images'}")
    if expected != nL + 1 and not errors:
        errors.append(f"scenes cover lines 1..{expected - 1} but the script has {nL} lines. Add scenes for lines {expected}..{nL}.")
    if errors:
        if not quiet:
            print("STORYBOARD HAS ERRORS - fix these in storyboard.json, then run check again:")
            for e in errors:
                print("  - " + e)
        return None, errors
    # ---- resolve timing
    dur = timing["duration"]
    total = round(min(dur, S[-1]["e"] + 0.6) + (TAIL_LONG if fmt == "long" else TAIL), 3)
    starts = []
    for k, sc in enumerate(scenes):
        a = S[sc["lines"][0] - 1]
        if k == 0:
            starts.append(0.0)
        else:
            prev_end = S[sc["lines"][0] - 2]["e"]
            # after a repeat scene the pause belongs to the viewer: keep that scene on screen until the next line
            starts.append(round(max(prev_end, a["s"] - 0.3) if scenes[k - 1].get("type") == "repeat" else (prev_end + a["s"]) / 2, 3))
    resolved = []
    for k, sc in enumerate(scenes):
        st = starts[k]
        en = starts[k + 1] if k + 1 < len(scenes) else total
        words = [w for li in sc["lines"] for w in S[li - 1]["words"]]
        r = json.loads(json.dumps(sc))
        r.update(start=st, end=en, _seed=k + 1)
        if any(S[li - 1].get("speaker") for li in sc["lines"]):
            r["turns"] = [{"who": S[li - 1].get("speaker"), "text": S[li - 1]["text"],
                           "s": round(S[li - 1]["s"] - st, 3), "e": round(S[li - 1]["e"] - st, 3)} for li in sc["lines"]]
        if en - st < 1.6:
            warns.append(f"scene {k + 1} is only {en - st:.1f}s long; consider merging it with a neighbour")

        def res_at(obj, where):
            if isinstance(obj, dict) and obj.get("at") not in (None, ""):
                w = find_word(words, obj["at"])
                if w is None:
                    sample = " ".join(x["w"] for x in words[:12])
                    warns.append(f'scene {k + 1}: {where} at="{obj["at"]}" not found in its lines ("{sample}..."); using automatic timing')
                else:
                    obj["t"] = round(max(0.15, w["s"] - st - 0.05), 3)
        res_at(r, "scene")
        for key in ("left", "right", "from", "to"):
            res_at(r.get(key), key)
        its = r.get("items") or []
        n = len(its)
        for j, it in enumerate(its):
            res_at(it, f"items[{j}]")
            if "t" not in it:
                span = max(0.6, (en - st) - 1.0)
                it["t"] = round(0.3 + j * min(0.9, span / max(1, n)), 3)
        resolved.append(r)
    warns += quality_warnings(resolved, S, total)
    sc_p = proj / "build" / "speech_check.json"
    voice = next((proj / "input").glob("voice.*"), None)
    if sc_p.exists() and voice:
        SC = json.loads(sc_p.read_text(encoding="utf-8"))
        if SC.get("voice_size") == voice.stat().st_size:
            for pr in SC.get("problems", []):
                fix = ("write the number differently in script.txt or use another voice" if pr.get("numbers") else
                       'add how to say it to brand.json voice.pronounce (e.g. {"Haddad": "ha-dad"}) and make the voice again'
                       if pr.get("names") else "reword that line in script.txt or use another voice")
                msg = (f'line {pr["line"]}: the voice-over did not clearly say "{" ".join(pr["missing"][:8])}" '
                       f'(heard by {SC.get("engine")}). Listen to it; if it is wrong, {fix}')
                warns.append((BLOCK + msg) if pr.get("numbers") else msg)
    # ---- captions
    chunks = []
    maxc, maxl = CAP_CHARS[fmt], CAP_LINES[fmt]
    cast = brand_cast()
    for s in S:
        lines, line = [], []
        who = cast.get(s.get("speaker")) or {}
        tag = {"speaker": who.get("label", s["speaker"].title()), "color": who.get("color", "#141414"), "who": s["speaker"]} \
            if s.get("speaker") in cast and who.get("label", True) else {}
        def flush_chunk():
            nonlocal lines, line
            if line:
                lines.append(line)
            if lines:
                chunks.append({"s": lines[0][0]["s"], "e": lines[-1][-1]["e"], "lines": lines, **tag})
            lines, line = [], []
        for w in s["words"]:
            cand = " ".join(x["w"] for x in line + [w])
            if line and len(cand) > maxc:
                lines.append(line)
                line = []
                if len(lines) >= maxl:
                    chunks.append({"s": lines[0][0]["s"], "e": lines[-1][-1]["e"], "lines": lines, **tag})
                    lines = []
            line.append(w)
            if re.search(r"[,;:]$", w["w"]) and len(" ".join(x["w"] for x in line)) > maxc * 0.6 and len(lines) + 1 >= maxl:
                flush_chunk()
        flush_chunk()
    for a, b in zip(chunks, chunks[1:]):
        if b["s"] - a["e"] < 0.7:
            a["e"] = round(b["s"] - 0.02, 3)
    words_all = [{"s": w["s"], "e": w["e"]} for s in S for w in s["words"]]
    out = {"format": fmt, "theme": theme_name, "duration": total, "voice_duration": dur, "scenes": resolved,
           "transition": sb.get("transition"), "chunks": chunks, "words": words_all, "warnings": warns,
           "blocking": [x[len(BLOCK):] for x in warns if x.startswith(BLOCK)]}
    (proj / "build").mkdir(exist_ok=True)
    (proj / "build" / "resolved.json").write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
    write_data_js(proj, out, brand)
    if not quiet:
        for w in warns:
            print(("  MUST FIX: " + w[len(BLOCK):]) if w.startswith(BLOCK) else ("  warning: " + w))
        nb = sum(1 for x in warns if x.startswith(BLOCK))
        if nb:
            print(f"NOT READY - {nb} MUST FIX item(s) above ({len(resolved)} scenes, {total:.1f}s). Fix them and run check again.")
        else:
            print(f"OK - {len(resolved)} scenes, {total:.1f}s, format {fmt}, theme {theme_name}.")
    return out, []


def file_url(p):
    return Path(p).resolve().as_uri()


def write_data_js(proj, R, brand):
    theme = load_json(ROOT / "themes" / f"{R['theme']}.json")
    W, H = SIZES[R["format"]]
    logo = None
    for name in ("logo.png", "logo.svg", "logo.webp", "logo.jpg"):
        if (BRAND_DIR / name).exists():
            logo = file_url(BRAND_DIR / name)
            break
    images = {}
    for d in (BRAND_DIR / "icons", proj / "images"):
        if d.exists():
            for f in d.iterdir():
                if f.suffix.lower() in (".png", ".svg", ".jpg", ".jpeg", ".webp"):
                    images[f.name] = file_url(f)
    fonts = [{"family": "Fredoka", "url": file_url(ROOT / "assets/fonts/Fredoka.ttf")},
             {"family": "Nunito", "url": file_url(ROOT / "assets/fonts/Nunito.ttf")},
             {"family": "Space Grotesk", "url": file_url(ROOT / "assets/fonts/SpaceGrotesk.ttf")},
             {"family": "Caveat", "url": file_url(ROOT / "assets/fonts/Caveat.ttf")}]
    data = {"W": W, "H": H, "fps": FPS, "format": R["format"], "theme": theme, "brand": brand, "logo": logo, "images": images, "fonts": fonts,
            "story": {"scenes": R["scenes"], "transition": R.get("transition")},
            "cues": {"duration": R["duration"], "chunks": R["chunks"], "words": R["words"], "amp": voice_amp(proj)},
            "grain": {"url": file_url(make_overlay(proj, W, H)),
                      "opacity": float(theme.get("grain", 0.35))}}
    (proj / "build" / "data.js").write_text("window.PF_DATA = " + json.dumps(data, ensure_ascii=False) + ";\n", encoding="utf-8")


# ---------------------------------------------------------------- audio synthesis
def synth_music(dur, style, seed, sr=44100):
    np = need_numpy()
    rng = np.random.default_rng(seed)
    styles = {
        "playful": dict(bpm=112, prog=[[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]], root=53, lead="glock", swing=0.0),
        "calm":    dict(bpm=82,  prog=[[0, 4, 7, 11], [5, 9, 12, 16], [9, 12, 16, 19], [7, 11, 14, 17]], root=50, lead="keys", swing=0.0),
        "curious": dict(bpm=96,  prog=[[0, 3, 7], [8, 12, 15], [3, 7, 10], [10, 14, 17]], root=52, lead="pizz", swing=0.08),
        "lofi":    dict(bpm=84,  prog=[[0, 4, 7, 11], [9, 12, 16, 19], [2, 5, 9, 12], [7, 11, 14, 17]], root=50, lead="keys", swing=0.12, snare=True),
    }
    st = styles.get(style, styles["playful"])
    n = int((dur + 1) * sr)
    out = np.zeros(n, dtype=np.float64)
    beat = 60 / st["bpm"]
    hz = lambda m: 440 * 2 ** ((m - 69) / 12)

    def note(t0, midi, length, kind, amp):
        i0 = int(t0 * sr)
        if i0 >= n:
            return
        L = min(int(length * sr), n - i0)
        tt = np.arange(L) / sr
        f = hz(midi)
        if kind == "glock":
            w = np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt * 9)
            env = np.exp(-tt * 3.2)
        elif kind == "keys":
            w = np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 2 * tt) + 0.1 * np.sin(2 * np.pi * f * 3 * tt)
            env = np.exp(-tt * 1.6) * np.minimum(1, tt / 0.01)
        elif kind == "pizz":
            w = np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(2 * np.pi * f * 2 * tt) * np.exp(-tt * 12)
            env = np.exp(-tt * 7)
        elif kind == "bass":
            w = np.sin(2 * np.pi * f * tt) + 0.2 * np.sin(2 * np.pi * f * 2 * tt)
            env = np.exp(-tt * 2.5) * np.minimum(1, tt / 0.005)
        else:  # pad
            w = np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(2 * np.pi * f * 1.003 * tt)
            env = np.minimum(1, tt / 0.4) * np.minimum(1, (length - tt) / 0.5).clip(0, 1)
        out[i0:i0 + L] += amp * w * env

    bars = int(dur / (beat * 4)) + 2
    pattern = rng.permutation([0, 1, 2, 1, 2, 0, 1, 2])
    for b in range(bars):
        ch = st["prog"][b % len(st["prog"])]
        t_bar = b * beat * 4
        root = st["root"] + ch[0]
        note(t_bar, root - 12, beat * 1.8, "bass", 0.32)
        note(t_bar + beat * 2, root - 12 + (7 if b % 2 else 0), beat * 1.8, "bass", 0.26)
        for v in ch[:3]:
            note(t_bar, st["root"] + v, beat * 4, "pad", 0.035)
        for k in range(8):
            sw = st["swing"] * beat if k % 2 else 0
            idx = pattern[(k + b) % len(pattern)]
            note(t_bar + k * beat / 2 + sw, st["root"] + 12 + ch[idx % len(ch)], beat * 1.2, st["lead"], 0.10 if k % 2 else 0.14)
        if b % 4 == 3:
            for k, d in enumerate([0, 2, 4, 7]):
                note(t_bar + beat * 3 + k * beat / 4, st["root"] + 24 + ch[0] + d, beat, "glock", 0.07)
    # soft percussion: shaker + light kick
    for k in range(int(dur / (beat / 2)) + 2):
        i0 = int(k * beat / 2 * sr)
        if i0 >= n:
            break
        L = min(int(0.06 * sr), n - i0)
        out[i0:i0 + L] += rng.normal(0, 1, L) * np.exp(-np.arange(L) / sr * 60) * (0.035 if k % 2 else 0.02)
        if st.get("snare") and k % 4 == 2:
            L3 = min(int(0.16 * sr), n - i0)
            tt = np.arange(L3) / sr
            out[i0:i0 + L3] += (rng.normal(0, 1, L3) * 0.12 + 0.1 * np.sin(2 * np.pi * 190 * tt)) * np.exp(-tt * 26)
        if k % 4 == 0:
            L2 = min(int(0.18 * sr), n - i0)
            tt = np.arange(L2) / sr
            out[i0:i0 + L2] += 0.25 * np.sin(2 * np.pi * (50 + 60 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 18)
    out = out[: int(dur * sr)]
    fade_in, fade_out = int(0.5 * sr), int(1.6 * sr)
    out[:fade_in] *= np.linspace(0, 1, fade_in)
    out[-fade_out:] *= np.linspace(1, 0, fade_out)
    return out / (np.abs(out).max() + 1e-9)


def synth_sfx(kind, sr=44100):
    np = need_numpy()
    rng = np.random.default_rng(len(kind))
    if kind == "whoosh":
        L = int(0.45 * sr); tt = np.arange(L) / sr
        noise = rng.normal(0, 1, L)
        # crude band sweep: mix of lowpassed noise with moving cutoff via cumulative smoothing
        k = (0.02 + 0.25 * np.sin(np.pi * tt / tt[-1]))
        y = np.zeros(L); acc = 0
        for i in range(L):
            acc += k[i] * (noise[i] - acc)
            y[i] = acc
        return y * np.sin(np.pi * tt / tt[-1]) ** 2 * 2.2
    if kind == "pop":
        L = int(0.12 * sr); tt = np.arange(L) / sr
        return np.sin(2 * np.pi * (300 + 900 * np.exp(-tt * 40)) * tt) * np.exp(-tt * 35)
    if kind == "stamp":
        L = int(0.3 * sr); tt = np.arange(L) / sr
        return (np.sin(2 * np.pi * (70 + 80 * np.exp(-tt * 25)) * tt) * 1.2 + rng.normal(0, 0.5, L) * np.exp(-tt * 40)) * np.exp(-tt * 14)
    if kind == "ding":
        L = int(0.9 * sr); tt = np.arange(L) / sr
        return (np.sin(2 * np.pi * 1318 * tt) + 0.5 * np.sin(2 * np.pi * 1975 * tt)) * np.exp(-tt * 5) * 0.6
    if kind == "click":
        L = int(0.05 * sr); tt = np.arange(L) / sr
        return rng.normal(0, 1, L) * np.exp(-tt * 120)
    if kind == "sparkle":
        L = int(0.7 * sr); tt = np.arange(L) / sr; y = np.zeros(L)
        for j, f in enumerate([1568, 2093, 2637, 3136]):
            i0 = int(j * 0.06 * sr)
            y[i0:] += np.sin(2 * np.pi * f * tt[: L - i0]) * np.exp(-tt[: L - i0] * 9) * 0.35
        return y
    return np.zeros(10)


def sfx_events(R):
    ev = []
    for k, sc in enumerate(R["scenes"]):
        st = sc["start"]
        if k > 0:
            ev.append((st - 0.22, "whoosh", 0.55))
        ty = sc["type"]
        if ty == "hook":
            ev.append((st + sc.get("t", 0.6), "sparkle", 0.5))
        if ty in ("myth", "fact"):
            ev.append((st + sc.get("t", (sc["end"] - st) * 0.6), "stamp", 0.8))
        if ty == "number":
            ev.append((st + sc.get("t", 0.3) + 1.2, "ding", 0.5))
        if ty == "outro":
            ev.append((st + sc.get("t", 0.9) + 0.5, "click", 0.7))
            ev.append((st + sc.get("t", 0.9) + 0.6, "ding", 0.4))
        if ty == "budget":
            ev.append((st + sc.get("t", (sc["end"] - st) * 0.7), "stamp", 0.7))
        if ty == "growth":
            ev.append((st + sc.get("t", 0.5) + 2.6, "ding", 0.5))
        for it in sc.get("items") or []:
            ev.append((st + it.get("t", 0.3), "pop", 0.45))
        for key in ("left", "right", "from", "to"):
            if isinstance(sc.get(key), dict) and "t" in sc[key]:
                ev.append((st + sc[key]["t"], "pop", 0.45))
    return ev


def smooth(x, n):
    """Centred moving average in O(len(x)) (np.convolve with a long window took seconds)."""
    np = need_numpy()
    c = np.cumsum(np.concatenate([[0.0], x]))
    y = (c[n:] - c[:-n]) / n
    left = (len(x) - len(y)) // 2
    return np.pad(y, (left, len(x) - len(y) - left), mode="edge")


def make_audio(proj, R, brand, theme):
    np = need_numpy()
    sr = 44100
    voice_file = next((proj / "input").glob("voice.*"))
    v = decode(voice_file, sr, VOICE_CHAIN if brand.get("voice_polish", True) else None)
    dur = R["duration"]
    n = int(dur * sr)
    voice = np.zeros(n); voice[: min(n, len(v))] = v[:n]
    # music: the video's own file, else one of assets/music (chosen by the brand seed + topic), else synthesized
    library = sorted(p for ext in ("mp3", "wav", "m4a", "ogg") for p in (ROOT / "assets" / "music").glob(f"*.{ext}"))
    user_music = next(iter(sorted((proj / "input").glob("music.*"))), None)
    if not user_music and library:
        user_music = library[(int(brand.get("seed", 7)) + sum(map(ord, proj.name))) % len(library)]
    if user_music:
        m = loop_music(decode(user_music, sr), n, sr)
        m = m / (np.abs(m).max() + 1e-9)
        wet = 0.0
    else:
        style = brand.get("music", "auto")
        if style in (None, "auto"):
            style = theme.get("music", "playful")
        m = synth_music(dur, style, int(brand.get("seed", 7)))
        if len(m) < n:
            m = np.pad(m, (0, n - len(m)))
        m = m[:n]
        wet = 0.35
    fo = int(1.6 * sr); m[-fo:] *= np.linspace(1, 0, fo)
    # stereo music: a little reverb with different tails left/right gives width
    d = int(0.008 * sr)  # 8 ms on one side = wider image, still fine in mono
    mL = m + (wet * reverb(m, sr, seed=1) if wet else 0)
    mR = np.concatenate([np.zeros(d), m[:-d]]) + (wet * reverb(m, sr, seed=2) if wet else 0)
    sfx = np.zeros(n)
    cache = {}
    for t, kind, g in sfx_events(R):
        if kind not in cache:
            cache[kind] = synth_sfx(kind, sr)
        s_ = cache[kind]
        i0 = int(max(0, t) * sr)
        L = min(len(s_), n - i0)
        if L > 0:
            sfx[i0:i0 + L] += s_[:L] * g
    sfx_wet = sfx + 0.25 * reverb(sfx, sr, seconds=0.6, seed=3)
    # ducking: music dips under the voice, with a slow release so it does not pump between words
    env = np.sqrt(smooth(voice ** 2, 441 * 8))
    act = np.clip(env / (np.percentile(env, 95) * 0.25 + 1e-9), 0, 1)
    act = np.maximum(act, smooth(act, sr // 2))
    act = smooth(act, sr // 8)
    duck = 1 - 0.6 * act
    L = voice + mL * 0.16 * duck + sfx_wet * 0.22 * (1 - 0.3 * act)
    Rr = voice + mR * 0.16 * duck + sfx_wet * 0.22 * (1 - 0.3 * act)
    st = np.stack([L, Rr], axis=1)
    st = np.tanh(st * 1.1) / np.tanh(1.1)
    st = st / (np.abs(st).max() + 1e-9) * 0.89
    pcm = (st * 32767).astype("<i2")
    out = proj / "build" / "mix.wav"
    import wave
    with wave.open(str(out), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes(pcm.tobytes())
    return out


def make_overlay(proj, W, H):
    out = proj / "build" / f"paper_{W}x{H}.png"
    if out.exists():
        return out
    run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"color=c=0xF4F0E8:s={W}x{H}",
         "-vf", "noise=alls=22:allf=u,gblur=sigma=0.6,vignette=angle=PI/5", "-frames:v", "1", str(out)])
    return out


# ---------------------------------------------------------------- commands
def cmd_doctor(_):
    ok = True
    for tool in ("ffmpeg", "ffprobe", "node"):
        p = shutil.which(tool)
        print(f"{'OK ' if p else 'MISSING'} {tool} {p or ''}")
        ok &= bool(p)
    if shutil.which("node"):
        v = subprocess.run(["node", "-v"], capture_output=True, text=True).stdout.strip()
        major = int(re.sub(r"\D", "", v.split(".")[0]) or 0)
        print(f"{'OK ' if major >= 22 else 'OLD'} node {v} (need 22+)")
        ok &= major >= 22
    try:
        import numpy  # noqa
        print("OK  numpy")
    except ImportError:
        print("MISSING numpy  ->  python3 -m pip install numpy"); ok = False
    if shutil.which("node"):
        r = subprocess.run(["node", str(ENGINE / "renderer.mjs"), "which"], capture_output=True, text=True)
        found = r.returncode == 0 and r.stdout.strip()
        print(f"OK  browser {r.stdout.strip()}" if found else "MISSING browser -> install Google Chrome / Edge / Chromium, or set PF_CHROME=/path/to/chrome")
        ok &= bool(found)
    V = load_json(BRAND_DIR / "brand.json").get("voice") or {}
    if V.get("provider") == "voicebox":
        url = os.environ.get("VOICEBOX_URL", "http://127.0.0.1:17493").rstrip("/")
        try:
            import urllib.request
            urllib.request.urlopen(url + "/health", timeout=3)
            print(f"OK  Voicebox {url} (optional)")
        except OSError:
            print(f"--  Voicebox not running at {url} (optional: open it, or pass --voice to init)")
    print("All good." if ok else "Fix the MISSING items above first.")


def cmd_catalog(_):
    print("SCENE TYPES (field names in quotes are what you write in storyboard.json):")
    for k, v in SCENES.items():
        print(f"  {k:9s} needs {v['need'] or '-'} optional {v['opt']}  -- {v['desc']}")
    print("\nICONS:\n  " + " ".join(ICONS))
    print("\nYour own icon: put a PNG in brand/icons/ or PROJECT/images/ and use \"icon\": \"img:file.png\"")


GENERIC_NAME = re.compile(r"^(v\d+|ver\d*|version\d*|video\d*|vid\d*|test\d*|tes\d*|new\d*|tmp|temp|untitled\d*|project\d*|draft\d*|"
                          r"final\d*|output|out|shorts?\d*|long\d*|baru|coba\d*|\d+)$", re.I)


def check_project_name(proj):
    """Every video folder is named after its topic, so dozens of videos stay findable."""
    name = proj.name
    if GENERIC_NAME.match(name) or len(re.sub(r"[^a-z]", "", name.lower())) < 4:
        die(f'folder name "{name}" does not say what the video is about. Use the topic, e.g. '
            f'{proj.parent / "subscription-creep"}; for a new version add -v2, -v3: {proj.parent / "subscription-creep-v3"}')


def project_script(proj, given=None):
    """Return proj/script.txt, copying `given` there first when it is a different file.

    Scripts saved next to the topic folder (videos/NAME-script.txt) are refused: everything for a video
    lives inside videos/NAME/."""
    check_project_name(proj)
    dest = proj / "script.txt"
    stray = proj.parent / f"{proj.name}-script.txt"
    if given:
        src = Path(given)
        if not src.exists():
            die(f"script not found: {src}")
        if src.resolve().parent == proj.resolve().parent and src.resolve() != dest.resolve():
            die(f"the script {src} is saved outside its topic folder. Move it inside and run again without --script:\n"
                f"  mv \"{src}\" \"{dest}\"")
        if src.resolve() != dest.resolve():
            proj.mkdir(parents=True, exist_ok=True)
            shutil.copy(src, dest)
    if not dest.exists() and (proj / "input" / "script.txt").exists():
        # projects made before script.txt lived in the topic folder
        shutil.copy(proj / "input" / "script.txt", dest)
        print(f"(moved the script to {dest}; edit that file from now on)")
    if not dest.exists():
        die(f"no script: write it to {dest} or pass --script naskah.txt")
    if stray.exists():
        die(f"found {stray} outside the topic folder. Everything for this video lives in {proj}/: "
            f"delete it (the script is {dest})" + ("" if stray.read_bytes() == dest.read_bytes() else " or move its text into script.txt"))
    return dest


def cmd_init(a):
    proj = Path(a.project)
    (proj / "input").mkdir(parents=True, exist_ok=True)
    (proj / "build").mkdir(exist_ok=True)
    (proj / "out").mkdir(exist_ok=True)
    (proj / "images").mkdir(exist_ok=True)
    # the editable script lives in the topic folder: videos/NAME/script.txt
    src_script = project_script(proj, a.script)
    # input/script.txt = the exact text the voice-over was made from
    shutil.copy(src_script, proj / "input" / "script.txt")
    if a.voice:
        src_voice = Path(a.voice)
        if not src_voice.exists():
            die(f"voice not found: {src_voice}")
        dest = proj / "input" / f"voice{src_voice.suffix.lower()}"
        if src_voice.resolve() != dest.resolve():
            for old in (proj / "input").glob("voice.*"):
                old.unlink()
            shutil.copy(src_voice, dest)
    else:
        V = load_json(BRAND_DIR / "brand.json").get("voice") or {}
        if V.get("provider") != "voicebox":
            die("no --voice given and brand.json has no voice.provider = voicebox. Pass --voice voice.mp3")
        import voicebox
        print(f'Generating the voice-over with Voicebox ("{V.get("profile")}")...')
        tmp = proj / "input" / "voice.new.mp3"
        voicebox.make_voice(proj / "input" / "script.txt", tmp)
        for old in (proj / "input").glob("voice.*"):
            if old != tmp:
                old.unlink()
        tmp.rename(proj / "input" / "voice.mp3")
    if a.music:
        shutil.copy(a.music, proj / "input" / f"music{Path(a.music).suffix.lower()}")
    text = (proj / "input" / "script.txt").read_text(encoding="utf-8")
    print("Aligning narration to the voice-over...")
    voice = next((proj / "input").glob("voice.*"))
    timing = align(text, voice)
    eng = speech.available()
    if eng:
        print(f"Checking pronunciation with {eng}...")
        heard, ws, eng = speech.transcribe(voice)
        fixed = speech.refine_word_times(timing["sentences"], ws)
        probs = speech.compare([s["text"] for s in timing["sentences"]], heard or "", speech.channel_names(), speech.pronounce())
        (proj / "build" / "speech_check.json").write_text(json.dumps(
            {"engine": eng, "voice": voice.name, "voice_size": voice.stat().st_size, "transcript": heard, "problems": probs,
             "word_times_from_whisper": fixed}, indent=1, ensure_ascii=False), encoding="utf-8")
        print(f"  {len(probs)} line(s) to listen to" + (f"; {fixed} word times from Whisper" if fixed else ""))
    else:
        (proj / "build" / "speech_check.json").unlink(missing_ok=True)
        print("  (pronunciation not checked: no Whisper model - see README 'Pronunciation check')")
    for s, p in zip(timing["sentences"], parse_script(text)):
        if p["speaker"]:
            s["speaker"], s["segment"] = p["speaker"], p["segment"]
    (proj / "build" / "timing.json").write_text(json.dumps(timing, indent=1, ensure_ascii=False), encoding="utf-8")
    lines = [f"# Lines of {proj.name}  (voice {timing['duration']:.1f}s)\n", "Use these line numbers in storyboard.json -> \"lines\".\n"]
    seg = None
    for s in timing["sentences"]:
        if s.get("segment") != seg:
            seg = s.get("segment")
            if seg:
                lines.append(f"\n## [{seg}]")
        who = f"{s['speaker']}: " if s.get("speaker") else ""
        lines.append(f"L{s['i']}  [{s['s']:6.2f} - {s['e']:6.2f}]  {who}{s['text']}")
    (proj / "lines.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    brand = load_json(BRAND_DIR / "brand.json")
    theme = a.theme or brand.get("theme", "meadow")
    sbp = proj / "storyboard.json"
    kept = sbp.exists() and not a.force
    if kept:
        print("storyboard.json already exists - kept (use --force to regenerate the draft).")
    else:
        sb = auto_storyboard(timing, a.format, theme)
        sbp.write_text(json.dumps(sb, indent=2, ensure_ascii=False), encoding="utf-8")
    print("\n".join(lines[2:]))
    print(f"\nWrote {proj / 'lines.md'}" + ("" if kept else f" and a draft {sbp}") + ".")
    print(f"Next: improve storyboard.json, then  python3 {Path(__file__).resolve()} check {proj}")


def cmd_check(a):
    R, errs = check(a.project)
    sys.exit(1 if errs else (2 if R.get("blocking") else 0))


CPU_MODES = {"eco": 0.25, "balanced": 0.5, "max": 1.0}
# Chrome spreads one render over many cores by itself, so fewer workers alone do not lower CPU use.
# eco therefore also pauses/resumes the render processes (like the cpulimit tool): "duty" = share of time running.
CPU_DUTY = {"eco": 0.4, "balanced": 0.55}


def cpu_plan(spec=None):
    """How much of the computer a render may use: eco (~1/4), balanced (~1/2, default), max, or a percentage."""
    spec = str(spec or os.environ.get("PF_CPU") or "balanced").lower().rstrip("%")
    cores = os.cpu_count() or 2
    if spec in CPU_MODES:
        frac = CPU_MODES[spec]
    else:
        try:
            frac = min(1.0, max(0.05, float(spec) / 100))
        except ValueError:
            die(f'--cpu "{spec}" must be eco, balanced, max or a percentage like 50')
    budget = max(1, round(cores * frac))
    duty = CPU_DUTY.get(spec, 1.0 if spec in CPU_MODES else min(1.0, frac * 1.6))
    return {
        "duty": duty if os.name != "nt" else 1.0,
        "mode": spec,
        "cores": cores,
        "workers": max(1, min(6, cores - 1 if frac >= 1 else budget)),
        "ff_threads": "0" if frac >= 1 else ("1" if frac <= 0.3 else "2"),
        "nice": 0 if frac >= 1 else (15 if frac <= 0.3 else 10),
    }


class DutyCycle:
    """Pause/resume whole process groups so the render uses about `duty` of the time it would otherwise use."""

    def __init__(self, duty, period=0.2):
        import signal
        import threading
        self.signal, self.duty, self.period = signal, duty, period
        self.groups, self.lock, self.stop = set(), threading.Lock(), threading.Event()
        self.thread = threading.Thread(target=self.loop, daemon=True)

    def add(self, pgid):
        with self.lock:
            self.groups.add(pgid)

    def remove(self, pgid):
        with self.lock:
            self.groups.discard(pgid)
        self.send(pgid, self.signal.SIGCONT)

    def send(self, pgid, sig):
        try:
            os.killpg(pgid, sig)
        except OSError:
            pass

    def loop(self):
        on, off = self.period * self.duty, self.period * (1 - self.duty)
        while not self.stop.is_set():
            time.sleep(on)
            with self.lock:
                gs = list(self.groups)
            for g in gs:
                self.send(g, self.signal.SIGSTOP)
            time.sleep(off)
            for g in gs:
                self.send(g, self.signal.SIGCONT)

    def __enter__(self):
        if self.duty < 1:
            self.thread.start()
        return self

    def __exit__(self, *exc):
        self.stop.set()
        with self.lock:
            gs = list(self.groups)
        for g in gs:
            self.send(g, self.signal.SIGCONT)


def node_render(args, plan=None, duty=None):
    env, kw = None, {}
    if plan:
        env = dict(os.environ, **plan.get("env", {}))
        if plan["nice"]:
            if os.name == "nt":
                kw["creationflags"] = 0x40 if plan["nice"] >= 15 else 0x4000  # IDLE / BELOW_NORMAL priority class
            else:
                kw["preexec_fn"] = lambda: os.nice(plan["nice"])  # Chrome and ffmpeg inherit the lower priority
    cmd = ["node", str(ENGINE / "renderer.mjs")] + [str(x) for x in args]
    if duty is None or duty.duty >= 1:
        return subprocess.run(cmd, env=env, **kw)
    proc = subprocess.Popen(cmd, env=env, start_new_session=True, **kw)  # own group: node + Chrome + ffmpeg
    duty.add(proc.pid)
    try:
        proc.wait()
    finally:
        duty.remove(proc.pid)
    return proc


def cmd_preview(a):
    proj = Path(a.project)
    R, errs = check(proj)
    if errs:
        sys.exit(1)
    times = []
    for sc in R["scenes"]:
        d = sc["end"] - sc["start"]
        last_t = max([it.get("t", 0) for it in sc.get("items") or []] + [sc.get("t", 0)])
        times.append(round(sc["start"] + min(d - 0.35, max(d * 0.55, last_t + 0.7)), 2))
    sd = proj / "build" / "stills"
    shutil.rmtree(sd, ignore_errors=True)
    r = node_render(["stills", proj / "build" / "data.js", sd, ",".join(f"{t:.2f}" for t in times)])
    if r.returncode:
        die("still render failed (see message above)")
    W, H = SIZES[R["format"]]
    cols = 5 if R["format"] == "shorts" else 3
    tw = 324 if R["format"] == "shorts" else 480
    th = int(tw * H / W)
    rows = math.ceil(len(times) / cols)
    out = proj / "build" / "preview.jpg"
    run(["ffmpeg", "-v", "error", "-y", "-framerate", "1", "-i", str(sd / "s_%03d.jpg"),
         "-vf", f"scale={tw}:{th},tile={cols}x{rows}:padding=6:color=white", "-frames:v", "1", str(out)])
    print(f"Preview sheet: {out}  (one picture per scene, left-to-right, top-to-bottom; single stills in {sd})")


def require_clean(R, a):
    """Stop before render/publish while quality problems remain, unless the user chose to skip the gate."""
    if R.get("blocking") and not getattr(a, "accept_warnings", False):
        print("STOPPED before rendering - fix these MUST FIX items in script.txt / storyboard.json, then run again:")
        for m in R["blocking"]:
            print("  - " + m)
        print("(Only if the user explicitly asks to publish anyway: add --accept-warnings.)")
        sys.exit(2)


def qa_video(path, R):
    """Automatic checks on the finished MP4: frozen picture, black frames, loudness, peaks, frame count."""
    issues = []
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path),
                        "-vf", "freezedetect=n=0.0008:d=3,blackdetect=d=0.4:pix_th=0.05",
                        "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True)
    log = r.stderr
    freezes = [float(x) for x in re.findall(r"freeze_duration: ([\d.]+)", log)]
    starts = re.findall(r"freeze_start: ([\d.]+)", log)
    if len(starts) > len(freezes):  # a freeze that lasts until the end has no end/duration line
        freezes.append(R["duration"] - float(starts[-1]))
    blacks = re.findall(r"black_start:([\d.]+)", log)
    I = re.findall(r"I:\s+(-?[\d.]+) LUFS", log)
    peak = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", log)
    loud = float(I[-1]) if I else None
    tp = float(peak[-1]) if peak else None
    if freezes:
        issues.append(f"picture frozen for {max(freezes):.1f}s ({len(freezes)}x): add movement or split that scene")
    if blacks:
        issues.append(f"black frames at {', '.join(b + 's' for b in blacks[:3])}")
    if loud is not None and not -15.5 <= loud <= -12.5:
        issues.append(f"loudness {loud} LUFS (target -14)")
    if tp is not None and tp > -0.5:
        issues.append(f"audio peak {tp} dBFS (may clip)")
    nb = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v", "-count_packets", "-show_entries", "stream=nb_read_packets",
                         "-of", "csv=p=0", str(path)], capture_output=True, text=True).stdout.strip()
    want = int(round(R["duration"] * FPS))
    if nb.isdigit() and abs(int(nb) - want) > 1:
        issues.append(f"{nb} frames, expected {want}")
    return {"loudness_lufs": loud, "true_peak_dbfs": tp, "frozen_sections": freezes, "black_frames": blacks, "issues": issues}


def cmd_render(a):
    proj = Path(a.project)
    R, errs = check(proj)
    if errs:
        sys.exit(1)
    require_clean(R, a)
    brand = load_json(BRAND_DIR / "brand.json")
    theme = load_json(ROOT / "themes" / f"{R['theme']}.json")
    W, H = SIZES[R["format"]]
    t0 = time.time()
    print("Mixing audio (voice + music + sfx)...")
    mix = make_audio(proj, R, brand, theme)
    res = (getattr(a, "resolution", None) or (brand.get("render") or {}).get("resolution") or "1080p").lower()
    scale = {"1080p": 1.0, "1440p": 4 / 3, "2160p": 2.0}.get(res)
    if not scale:
        die(f'resolution "{res}" must be 1080p, 1440p or 2160p')
    OW, OH = round(W * scale), round(H * scale)
    total = int(round(R["duration"] * FPS))
    plan = cpu_plan(getattr(a, "cpu", None))
    plan["env"] = {"PF_X264_PRESET": "veryfast", "PF_CRF": "17", "PF_FF_THREADS": plan["ff_threads"], "PF_SCALE": f"{scale:.6f}"}
    workers = a.workers or plan["workers"]
    step = math.ceil(total / workers)
    parts = []
    jobs = []
    for i in range(workers):
        f0, f1 = i * step, min(total, (i + 1) * step)
        if f0 >= f1:
            break
        p = proj / "build" / f"part_{i:02d}.mp4"
        parts.append(p)
        jobs.append(["video", proj / "build" / "data.js", p, f0, f1])
    print(f"Rendering {total} frames at {OW}x{OH} with {len(jobs)} workers (cpu: {plan['mode']}, {plan['cores']} cores, "
          f"priority {'normal' if not plan['nice'] else 'low'})...")
    with DutyCycle(plan["duty"]) as duty, ThreadPoolExecutor(len(jobs)) as ex:
        res = list(ex.map(lambda j: node_render(j, plan, duty), jobs))
    if any(r.returncode for r in res):
        die("frame rendering failed (see messages above)")
    lst = proj / "build" / "parts.txt"
    lst.write_text("".join(f"file '{p.name}'\n" for p in parts))
    raw = proj / "build" / "video_raw.mp4"
    run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(raw)])
    slug = re.sub(r"[^a-z0-9]+", "-", proj.name.lower()).strip("-") or "video"
    (proj / "out").mkdir(exist_ok=True)
    out = proj / "out" / f"{slug}_{R['format']}.mp4"
    dur = f"{R['duration']:.3f}"
    # video is already final (texture applied per part): only add the loudness-normalised audio, no re-encode
    fc = f"[1:a]loudnorm=I=-14:TP=-1.5:LRA=9,atrim=0:{dur},asetpts=N/SR/TB[aa]"
    run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-i", str(mix), "-filter_complex", fc,
         "-map", "0:v", "-map", "[aa]", "-c:v", "copy",
         "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-movflags", "+faststart", "-t", dur, str(out)])
    for p in parts:
        p.unlink(missing_ok=True)
    raw.unlink(missing_ok=True)
    probe = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_name,width,height,nb_frames:format=duration",
                            "-of", "compact", str(out)], capture_output=True, text=True).stdout.strip()
    print(probe)
    qa = qa_video(out, R)
    (proj / "build" / "qa.json").write_text(json.dumps(qa, indent=1), encoding="utf-8")
    print("QA: " + ("all checks passed" if not qa["issues"] else "; ".join(qa["issues"])))
    print(f"DONE in {time.time() - t0:.0f}s -> {out}")


# ---------------------------------------------------------------- publish kit
PUBLISH_HELP = {
    "id": {
        "title": "Siap publish", "files": "File di folder ini", "check": "1. Cek sebelum upload",
        "check_body": "Tonton `{video}` sekali sampai habis **dengan suara**. Pastikan angka dan nama channel diucapkan benar.",
        "titles": "2. Judul (pilih satu)", "desc": "3. Deskripsi (salin semua)", "thumb": "4. Thumbnail",
        "thumb_short": "Shorts: saat upload lewat aplikasi YouTube di HP, ketuk thumbnail/cover lalu pilih frame di detik **{t}** (adegan yang sama dengan `{cover}`). Jika aplikasi menawarkan unggah gambar, pakai `{cover}`. File ini juga cocok sebagai cover TikTok/Reels.",
        "thumb_long": "Upload `{thumb}` di bagian Thumbnail (perlu nomor HP channel sudah diverifikasi).",
        "alts": "Alternatif untuk uji A/B (YouTube Studio → Test & compare):",
        "alts_short": "Cover alternatif (untuk TikTok/Reels, atau ganti cover jika views rendah):",
        "settings": "5. Pengaturan di halaman upload", "schedule": "6. Jadwal tayang",
        "schedule_body": "Target jam {aud} untuk penonton di {aud_tz}. Dalam zona waktu Anda ({my_tz}):",
        "after": "7. Setelah tayang", "pin": "Komentar pertama dari channel, lalu **Pin** (salin):",
        "rules": "Aturan posting channel", "metric": "Setelah 48 jam cek Analytics: *viewed vs swiped away* > 70% (Shorts) / CTR 4-10% dan retensi 30 detik > 60% (video panjang).",
        "k": {"Playlist": "Playlist", "Audience": "Audience", "Altered content": "Altered content", "Category": "Category",
              "Language": "Video language", "Tags": "Tags", "Remix": "Shorts remixing", "Comments": "Comments"},
    },
    "en": {
        "title": "Ready to publish", "files": "Files in this folder", "check": "1. Check before uploading",
        "check_body": "Watch `{video}` once all the way through **with sound**. Make sure numbers and the channel name are spoken correctly.",
        "titles": "2. Title (pick one)", "desc": "3. Description (copy all)", "thumb": "4. Thumbnail",
        "thumb_short": "Shorts: when uploading from the YouTube phone app, tap the thumbnail/cover and pick the frame at **{t}** (same scene as `{cover}`). If the app offers an image upload, use `{cover}`. The file also works as a TikTok/Reels cover.",
        "thumb_long": "Upload `{thumb}` in the Thumbnail section (needs a phone-verified channel).",
        "alts": "Alternatives for A/B testing (YouTube Studio → Test & compare):",
        "alts_short": "Alternative covers (for TikTok/Reels, or swap the cover if views are low):",
        "settings": "5. Settings on the upload page", "schedule": "6. Schedule",
        "schedule_body": "Target {aud} for viewers in {aud_tz}. In your time zone ({my_tz}):",
        "after": "7. After it goes live", "pin": "First comment from the channel, then **Pin** it (copy):",
        "rules": "Channel posting rules", "metric": "After 48 hours check Analytics: *viewed vs swiped away* > 70% (Shorts) / CTR 4-10% and 30-second retention > 60% (long videos).",
        "k": {"Playlist": "Playlist", "Audience": "Audience", "Altered content": "Altered content", "Category": "Category",
              "Language": "Video language", "Tags": "Tags", "Remix": "Shorts remixing", "Comments": "Comments"},
    },
}


def draft_publish(proj, R):
    """publish.json draft: from brief.json (written by the scriptwriter skill) when present, else from the script."""
    brief_p = proj / "brief.json"
    if brief_p.exists():
        B = load_json(brief_p)
        strong = ["phone", "budget", "number", "growth", "versus", "chart", "meet", "hook"]

        def scene_for(hint):
            for k, sc in enumerate(R["scenes"], 1):
                if hint and sc["type"] == hint:
                    return k
            for t in strong:
                for k, sc in enumerate(R["scenes"], 1):
                    if sc["type"] == t:
                        return k
            return 1
        P = {k: B[k] for k in ("titles", "description", "pinned_comment", "hashtags", "tags", "recommended_title", "title_reason") if B.get(k)}
        P["thumbnails"] = [{"scene": scene_for(t.get("scene_hint")), "text": t.get("text", ""), "highlight": t.get("highlight", "")}
                           for t in (B.get("thumbnails") or [])[:3]]
        if P.get("titles") and P.get("description") and P.get("pinned_comment") and P["thumbnails"]:
            return P
    timing = load_json(proj / "build" / "timing.json")
    S = timing["sentences"]
    first = S[0]["text"]
    return {
        "titles": [first[:95]],
        "description": " ".join(s["text"] for s in S[:2]),
        "pinned_comment": "What would you do in this situation? Tell me below.",
        "thumbnails": [{"scene": 1, "text": short_text(first, 5).rstrip("."), "highlight": ""}],
    }


def check_publish(P, R):
    errs, warns = [], []
    t = P.get("titles")
    if not isinstance(t, list) or not t or not all(isinstance(x, str) and x.strip() for x in t):
        errs.append('"titles" must be a list of 1-3 title strings')
    else:
        for x in t:
            if len(x) > 100:
                errs.append(f'title is {len(x)} characters (max 100): "{x}"')
            elif len(x) > 70:
                warns.append(f'title over 70 characters gets cut off on phones: "{x}"')
    if not str(P.get("description", "")).strip():
        errs.append('"description" is empty')
    if not str(P.get("pinned_comment", "")).strip():
        errs.append('"pinned_comment" is empty')
    th = P.get("thumbnails")
    if not isinstance(th, list) or not th:
        errs.append('"thumbnails" must be a list like [{"scene": 1, "text": "Broke by the 25th?", "highlight": "25th"}]')
    else:
        for j, x in enumerate(th[:3]):
            n = x.get("scene") if isinstance(x, dict) else None
            if not isinstance(n, int) or not 1 <= n <= len(R["scenes"]):
                errs.append(f'thumbnails[{j}].scene must be a scene number 1..{len(R["scenes"])}')
            if isinstance(x, dict) and (len(str(x.get("text", "")).split()) > 6 or len(str(x.get("text", ""))) > 32):
                warns.append(f'thumbnails[{j}].text "{x.get("text")}" is long for a phone screen; use 2-5 big words (max ~30 characters)')
    return errs, warns


def schedule_slots(Y, n=3):
    try:
        from datetime import datetime, timedelta
        from zoneinfo import ZoneInfo
        aud, me = ZoneInfo(Y.get("audience_timezone", "America/New_York")), ZoneInfo(Y.get("my_timezone", "UTC"))
        now = datetime.now(me)
        out = []
        day = now.astimezone(aud).date()
        while len(out) < n:
            a, b = [datetime.combine(day, datetime.strptime(x, "%H:%M").time(), aud) for x in Y.get("schedule_local_times", ["11:00", "13:00"])]
            if a > now:
                la, lb = a.astimezone(me), b.astimezone(me)
                out.append(f"{a:%a %d %b} {a:%H:%M}-{b:%H:%M} {a.tzname()}  =  {la:%a %d %b %H:%M}-{lb:%H:%M} {la.tzname() or ''}".rstrip())
            day += timedelta(days=1)
        return out
    except Exception:
        return [f"{'-'.join(Y.get('schedule_local_times', ['11:00', '13:00']))} {Y.get('audience_timezone', 'America/New_York')}"]


def chapter_list(R):
    """YouTube chapters from scenes that have "chapter": "Title". Needs 3+ chapters of 10 s+, first at 0:00."""
    marks = [(sc["start"], sc["chapter"]) for sc in R["scenes"] if sc.get("chapter")]
    if not marks:
        return []
    if marks[0][0] > 0.5:
        marks.insert(0, (0.0, "Intro"))
    marks[0] = (0.0, marks[0][1])
    keep = [marks[0]]
    for t, title in marks[1:]:
        if t - keep[-1][0] >= 10:  # every chapter must last 10 s or more
            keep.append((t, title))
    if len(keep) > 1 and R["duration"] - keep[-1][0] < 10:
        keep.pop()
    if len(keep) < 3:
        return []
    return [f"{int(t // 60)}:{int(t % 60):02d} {title}" for t, title in keep]


CURIOUS = re.compile(r"\?|\b(why|how|what|secret|mistake|forgot|hidden|hiding|actually|really|still|never|stop|trap)\b", re.I)


CHECK_ID = {"short": "pendek", "talks to the viewer": "bicara ke penonton", "concrete": "ada angka",
            "curiosity": "rasa ingin tahu", "adds to the thumbnail": "melengkapi thumbnail"}


def title_block(P, scored, order, rec_i, G):
    idn = G is PUBLISH_HELP["id"]
    L = []
    for rank, i in enumerate(order):
        (score, checks), t = scored[i]
        star = "⭐ " if i == rec_i else ""
        miss = [CHECK_ID.get(name, name) if idn else name for name, ok, _ in checks if not ok]
        L.append(f"{rank + 1}. {star}`{t}`: {score}/5" + (f" (" + ("kurang: " if idn else "missing: ") + ", ".join(miss) + ")" if miss else ""))
    reason = P.get("title_reason")
    top = max(range(len(scored)), key=lambda i: scored[i][0][0])
    if rec_i is not None and scored[top][0][0] > scored[rec_i][0][0]:
        n = order.index(top) + 1
        L += ["", (f"Catatan: skor checklist tertinggi ada di #{n}. ⭐ tetap pilihan penulis naskah; checklist hanya bantu cek, bukan penentu."
                   if idn else f"Note: the highest checklist score is #{n}. ⭐ is still the scriptwriter's pick; the checklist is a check, not the decider.")]
    if reason:
        L += ["", ("**Kenapa ⭐:** " if idn else "**Why ⭐:** ") + reason]
    L += ["", ("Skor = checklist (pendek, bicara ke penonton, ada angka, memancing rasa ingin tahu, melengkapi thumbnail), "
               "bukan ramalan views. Bukti nyata: YouTube Studio → Test & compare (thumbnail, dan judul jika tersedia di akun Anda), "
               "lalu cek CTR setelah 48 jam." if idn else
               "Score = checklist (short, talks to the viewer, has a number, curiosity, adds to the thumbnail), not a view prediction. "
               "Real proof: YouTube Studio → Test & compare (thumbnails, and titles if available on your account), then check CTR after 48 hours.")]
    return L


def title_score(title, thumb_text=""):
    """Transparent checklist for a title (not a prediction of views)."""
    t = title.strip()
    checks = [
        ("short", len(t) <= 50, f"{len(t)} characters (50 or less shows fully on phones)"),
        ("talks to the viewer", bool(re.search(r"\b(you|your|you're)\b", t, re.I)), "uses you / your"),
        ("concrete", bool(re.search(r"\d", t)), "has a number"),
        ("curiosity", bool(CURIOUS.search(t)), "a question, a twist or an open loop"),
        ("adds to the thumbnail", not thumb_text or len(set(words_of(t)) & set(words_of(thumb_text))) < 3,
         "does not just repeat the thumbnail text"),
    ]
    return sum(ok for _, ok, _ in checks), checks


def words_of(x):
    return [w for w in re.findall(r"[a-z0-9$]+", x.lower()) if len(w) > 2]


def cmd_publish(a):
    proj = Path(a.project)
    R, errs = check(proj, quiet=True)
    if errs:
        die("storyboard has errors; run check first")
    require_clean(R, a)
    slug = re.sub(r"[^a-z0-9]+", "-", proj.name.lower()).strip("-") or "video"
    video = proj / "out" / f"{slug}_{R['format']}.mp4"
    if not video.exists():
        die(f"{video} not found. Run render first.")
    brand = load_json(BRAND_DIR / "brand.json")
    Y = brand.get("youtube") or {}
    pp = proj / "publish.json"
    if not pp.exists():
        pp.write_text(json.dumps(draft_publish(proj, R), indent=2, ensure_ascii=False), encoding="utf-8")
        src = "brief.json" if (proj / "brief.json").exists() else "the script"
        print(f"Wrote {pp} from {src} (check the thumbnail scene numbers; improve the texts if needed, then run publish again).")
    P = load_json(pp)
    perrs, pwarns = check_publish(P, R)
    if perrs:
        print("publish.json HAS ERRORS - fix these, then run publish again:")
        for e in perrs:
            print("  - " + e)
        sys.exit(1)
    for w in pwarns:
        print("  warning: " + w)
    out = proj / "publish"
    shutil.rmtree(out, ignore_errors=True)
    out.mkdir()
    # video
    final = out / f"{slug}.mp4"
    shutil.copy(video, final)
    # thumbnails: one still per requested scene, rendered with a headline card
    src = (proj / "build" / "data.js").read_text(encoding="utf-8")
    D = json.loads(src[src.index("=") + 1:].strip().rstrip(";"))
    thumbs = []
    for j, th in enumerate(P["thumbnails"][:3]):
        sc = R["scenes"][th["scene"] - 1]
        tt = round(max(sc["start"] + 0.2, sc["end"] - 0.45), 2)
        D["thumb"] = {"text": th.get("text", ""), "highlight": th.get("highlight", "")}
        dj = proj / "build" / f"thumb_{j}.js"
        dj.write_text("window.PF_DATA = " + json.dumps(D, ensure_ascii=False) + ";\n", encoding="utf-8")
        sd = proj / "build" / f"thumb_{j}"
        shutil.rmtree(sd, ignore_errors=True)
        if node_render(["stills", dj, sd, f"{tt:.2f}"]).returncode:
            die("thumbnail render failed")
        name = ("cover-9x16" if R["format"] == "shorts" else "thumbnail") + ("" if j == 0 else f"-{j + 1}") + ".jpg"
        vf = ["-vf", "scale=1280:720"] if R["format"] == "long" else []
        run(["ffmpeg", "-v", "error", "-y", "-i", str(sd / "s_000.jpg")] + vf + ["-q:v", "2", str(out / name)])
        shutil.rmtree(sd, ignore_errors=True)
        dj.unlink()
        thumbs.append((name, tt))
        # how it looks in a phone feed (YouTube shows ~ 168x94 thumbnails in lists; Shorts covers ~ 150x266)
        small = out / ("phone-preview-" + name.replace(".jpg", ".png"))
        run(["ffmpeg", "-v", "error", "-y", "-i", str(out / name), "-vf", "scale=168:-1" if R["format"] == "long" else "scale=150:-1", str(small)])
    # texts
    tags_line = " ".join(dict.fromkeys(list(P.get("hashtags", [])) + list(Y.get("hashtags", []))))
    desc = P["description"].strip()
    tail = "\n\n".join(x for x in (Y.get("footer", ""), Y.get("disclaimer", ""), tags_line) if x)
    chapters = chapter_list(R) if R["format"] == "long" else []
    if chapters:
        desc += "\n\nChapters:\n" + "\n".join(chapters)
    description = desc + ("\n\n" + tail if tail else "")
    if len(description) > 5000:
        die(f"description is {len(description)} characters (YouTube max 5000)")
    thumb_text = (P.get("thumbnails") or [{}])[0].get("text", "")
    scored = [(title_score(t, thumb_text), t) for t in P["titles"]]
    rec = P.get("recommended_title")
    rec_i = rec - 1 if isinstance(rec, int) and 1 <= rec <= len(P["titles"]) else max(range(len(scored)), key=lambda i: (scored[i][0][0], -i))
    order = [rec_i] + [i for i in range(len(scored)) if i != rec_i]
    (out / "title.txt").write_text("\n".join(P["titles"][i] for i in order) + "\n", encoding="utf-8")
    (out / "description.txt").write_text(description + "\n", encoding="utf-8")
    (out / "pinned-comment.txt").write_text(P["pinned_comment"].strip() + "\n", encoding="utf-8")
    tags = ", ".join(dict.fromkeys(list(P.get("tags", [])) + list(Y.get("tags", []))))
    # guide
    G = PUBLISH_HELP.get(Y.get("guide_language", "en"), PUBLISH_HELP["en"])
    k = G["k"]
    short = R["format"] == "shorts"
    first_thumb, first_t = thumbs[0]
    settings = [
        (k["Playlist"], Y.get("playlist_shorts" if short else "playlist_long", "")),
        (k["Audience"], Y.get("audience", "")),
        (k["Altered content"], Y.get("altered_content", "")),
        (k["Category"], Y.get("category", "")),
        (k["Language"], Y.get("language", "")),
        (k["Tags"], tags),
        (k["Comments"], "On"),
    ]
    if short:
        settings.append((k["Remix"], Y.get("remix", "")))
    L = [f"# {G['title']}: {P['titles'][0]}", "",
         f"**{G['files']}:** `{final.name}` ({R['duration']:.0f}s, {'9:16 Shorts' if short else '16:9'}) · " + " · ".join(f"`{n}`" for n, _ in thumbs) + " · `title.txt` · `description.txt` · `pinned-comment.txt`", "",
         f"## {G['check']}", G["check_body"].format(video=final.name), "",
         f"## {G['titles']}"] + title_block(P, scored, order, rec_i, G) + ["",
         f"## {G['desc']}", "```", description, "```", "",
         f"## {G['thumb']}",
         G["thumb_short"].format(t=f"{int(first_t // 60)}:{first_t % 60:05.2f}", cover=first_thumb) if short else G["thumb_long"].format(thumb=first_thumb)]
    if len(thumbs) > 1:
        L += ["", G["alts_short" if short else "alts"] + " " + ", ".join(f"`{n}`" for n, _ in thumbs[1:])]
    L += ["", f"## {G['settings']}", "| | |", "|---|---|"] + [f"| {a_} | {b_} |" for a_, b_ in settings if b_] + ["",
          f"## {G['schedule']}",
          G["schedule_body"].format(aud="-".join(Y.get("schedule_local_times", ["11:00", "13:00"])), aud_tz=Y.get("audience_timezone", ""), my_tz=Y.get("my_timezone", "")),
          ] + [f"- {x}" for x in schedule_slots(Y)] + ["",
          f"## {G['after']}", G["pin"], "```", P["pinned_comment"].strip(), "```", "", G["metric"]]
    if Y.get("rules"):
        L += ["", f"## {G['rules']}"] + [f"- {r}" for r in Y["rules"]]
    qa_p = proj / "build" / "qa.json"
    sc_p = proj / "build" / "speech_check.json"
    L += ["", "## QA"]
    if qa_p.exists():
        Q = json.loads(qa_p.read_text())
        L += [f"- Loudness {Q.get('loudness_lufs')} LUFS, true peak {Q.get('true_peak_dbfs')} dBFS"]
        L += [f"- ⚠️ {x}" for x in Q.get("issues", [])] or ["- picture, black frames, loudness, frame count: OK"]
    if sc_p.exists():
        SC = json.loads(sc_p.read_text())
        L += [f"- Pronunciation ({SC.get('engine')}): " + ("every line heard as written" if not SC.get("problems") else
              f"{len(SC['problems'])} line(s) to listen to: " + ", ".join(str(p['line']) for p in SC['problems']))]
    else:
        L += ["- Pronunciation: not checked automatically (no Whisper model). Listen to every number."]
    L += [f"- Phone-size preview of the thumbnail: `phone-preview-{thumbs[0][0].replace('.jpg', '.png')}` (is the text still readable?)"]
    if R["format"] == "long":
        L += ["- End screen: the last 8 seconds are free for YouTube end-screen elements (Subscribe + a video/playlist)."]
    (out / "UPLOAD.md").write_text("\n".join(L) + "\n", encoding="utf-8")
    print(f"Publish kit ready: {out}")
    for f in sorted(out.iterdir()):
        print(f"  {f.name}")


# ---------------------------------------------------------------- all-in-one
def cmd_make(a):
    """script -> voice -> timing -> storyboard -> check -> preview -> render -> publish kit."""
    proj = Path(a.project)
    script = project_script(proj, a.script)
    script_now = script.read_text(encoding="utf-8")
    old = proj / "input" / "script.txt"
    need_init = (not (proj / "build" / "timing.json").exists() or a.voice or a.force
                 or not old.exists() or old.read_text(encoding="utf-8") != script_now)
    if need_init:
        print("== 1/5 init (voice + timing + draft storyboard)")
        cmd_init(argparse.Namespace(project=a.project, script=None, voice=a.voice, format=a.format, theme=a.theme,
                                    music=a.music, force=a.force))
    else:
        print("== 1/5 init: script unchanged, keeping the voice and timing")
    print("== 2/5 check")
    R, errs = check(proj)
    if errs:
        die("fix storyboard.json (see above), then run make again")
    if not a.no_preview:
        print("== 3/5 preview")
        cmd_preview(argparse.Namespace(project=a.project))
    require_clean(R, a)
    print("== 4/5 render")
    cmd_render(argparse.Namespace(project=a.project, workers=a.workers, cpu=a.cpu, resolution=a.resolution,
                                  accept_warnings=a.accept_warnings))
    print("== 5/5 publish kit")
    cmd_publish(argparse.Namespace(project=a.project, accept_warnings=a.accept_warnings))


# ---------------------------------------------------------------- money math (so nobody has to compute by hand)
def cmd_calc(a):
    if a.kind == "save":
        r = a.rate / 100 / 12
        n = int(round(a.years * 12))
        fv_start = a.start * (1 + r) ** n
        fv_monthly = a.monthly * (((1 + r) ** n - 1) / r if r else n)
        total = fv_start + fv_monthly
        paid = a.start + a.monthly * n
        print(f"Saving {a.monthly:,.2f}/month for {a.years:g} years at {a.rate:g}% a year (compounded monthly), start {a.start:,.2f}:")
        print(f"  final balance   {total:,.2f}")
        print(f"  you put in      {paid:,.2f}")
        print(f"  growth/interest {total - paid:,.2f}")
        print(f"  say it as: about {round(total, -3 if total >= 10000 else -2):,.0f}")
    elif a.kind == "loan":
        r = a.rate / 100 / 12
        n = a.months
        pay = a.amount * r / (1 - (1 + r) ** -n) if r else a.amount / n
        print(f"Borrowing {a.amount:,.2f} at {a.rate:g}% a year over {n} months:")
        print(f"  monthly payment {pay:,.2f}")
        print(f"  total paid      {pay * n:,.2f}")
        print(f"  total interest  {pay * n - a.amount:,.2f}")
    elif a.kind == "percent":
        print(f"{a.pct:g}% of {a.of:,.2f} = {a.of * a.pct / 100:,.2f}")
    elif a.kind == "share":
        print(f"{a.part:,.2f} is {a.part / a.whole * 100:.1f}% of {a.whole:,.2f}")


def main():
    ap = argparse.ArgumentParser(description="PaperFold Studio")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("doctor").set_defaults(fn=cmd_doctor)
    sub.add_parser("catalog").set_defaults(fn=cmd_catalog)
    p = sub.add_parser("init")
    p.add_argument("project"); p.add_argument("--script", help="script file (default: PROJECT/script.txt; a given file is copied there)")
    p.add_argument("--voice", help="voice-over file; leave out to generate it with Voicebox (brand.json voice)")
    p.add_argument("--format", default="shorts", choices=list(SIZES)); p.add_argument("--theme"); p.add_argument("--music")
    p.add_argument("--force", action="store_true")
    p.set_defaults(fn=cmd_init)
    for name, fn in (("check", cmd_check), ("preview", cmd_preview)):
        p = sub.add_parser(name); p.add_argument("project"); p.set_defaults(fn=fn)
    ACC = "render even with MUST FIX quality problems (only when the user explicitly asks)"
    CPU = "how much CPU to use: eco (~25%%), balanced (~50%%, default), max, or a percentage (also env PF_CPU)"
    RES = "output size: 1080p, 1440p (sharper after YouTube compression) or 2160p; default from brand.json render.resolution"
    p = sub.add_parser("render"); p.add_argument("project"); p.add_argument("--workers", type=int); p.add_argument("--cpu", help=CPU)
    p.add_argument("--resolution", help=RES)
    p.add_argument("--accept-warnings", action="store_true", help=ACC); p.set_defaults(fn=cmd_render)
    p = sub.add_parser("publish"); p.add_argument("project"); p.add_argument("--accept-warnings", action="store_true", help=ACC)
    p.set_defaults(fn=cmd_publish)
    p = sub.add_parser("make", help="all-in-one: script -> ready-to-upload publish/ folder")
    p.add_argument("project"); p.add_argument("--script", help="script file (default: PROJECT/script.txt; a given file is copied there)")
    p.add_argument("--voice", help="voice-over file; leave out to generate it with Voicebox")
    p.add_argument("--format", default="shorts", choices=list(SIZES)); p.add_argument("--theme"); p.add_argument("--music")
    p.add_argument("--workers", type=int); p.add_argument("--cpu", help=CPU); p.add_argument("--resolution", help=RES)
    p.add_argument("--no-preview", action="store_true")
    p.add_argument("--force", action="store_true", help="also regenerate the draft storyboard")
    p.add_argument("--accept-warnings", action="store_true", help=ACC)
    p.set_defaults(fn=cmd_make)
    c = sub.add_parser("calc", help="money math: save, loan, percent, share")
    cs = c.add_subparsers(dest="kind", required=True)
    x = cs.add_parser("save"); x.add_argument("--monthly", type=float, required=True); x.add_argument("--rate", type=float, required=True)
    x.add_argument("--years", type=float, required=True); x.add_argument("--start", type=float, default=0)
    x = cs.add_parser("loan"); x.add_argument("--amount", type=float, required=True); x.add_argument("--rate", type=float, required=True)
    x.add_argument("--months", type=int, required=True)
    x = cs.add_parser("percent"); x.add_argument("pct", type=float); x.add_argument("of", type=float)
    x = cs.add_parser("share"); x.add_argument("part", type=float); x.add_argument("whole", type=float)
    c.set_defaults(fn=cmd_calc)
    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
