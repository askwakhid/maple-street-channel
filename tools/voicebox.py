#!/usr/bin/env python3
"""Make the voice-over with a local Voicebox app (free, offline TTS) - one sentence at a time.

  Add --brand channels/<id>/brand to work on a channel's brand.json instead of brand/.

  python3 tools/voicebox.py voices [--engine kokoro]     list the preset voices you can choose from
  python3 tools/voicebox.py audition --voices am_puck,af_heart [--script naskah.txt] [--out samples/]
                                                        make a short sample with each voice to compare
  python3 tools/voicebox.py use am_puck                 make that voice the channel voice (updates brand.json)
  python3 tools/voicebox.py setup                       download the model and create the channel voice if missing
  python3 tools/voicebox.py profiles                    list voice profiles in Voicebox
  python3 tools/voicebox.py make --script naskah.txt --out voice.mp3 [--profile NAME] [--gap 0.35] [--seed 7]

Without --profile/--gap/--seed the values come from brand/brand.json -> voice.

Generating per sentence and joining with a fixed gap gives clean pauses, so caption timing
in pf.py is exact. Set VOICEBOX_URL if the app is not on http://127.0.0.1:17493.
"""
import argparse
import io
import json
import re
import os
import subprocess
import sys
import time
import urllib.request
import wave
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
if "--brand" in sys.argv:  # must be known before pf is imported
    i = sys.argv.index("--brand")
    os.environ["PF_BRAND_DIR"] = str(Path(sys.argv[i + 1]).resolve())
    del sys.argv[i:i + 2]
import pf  # noqa: E402

B = os.environ.get("VOICEBOX_URL", "http://127.0.0.1:17493").rstrip("/")


def req(method, path, body=None, timeout=600):
    r = urllib.request.Request(B + path, method=method, data=json.dumps(body).encode() if body else None,
                               headers={"Content-Type": "application/json"})
    try:
        return urllib.request.urlopen(r, timeout=timeout).read()
    except OSError as e:
        pf.die(f"cannot reach Voicebox at {B} ({e}). Is the Voicebox app running?")


def profiles():
    return json.loads(req("GET", "/profiles"))


def brand_voice():
    return pf.load_json(pf.BRAND_DIR / "brand.json").get("voice") or {}


def ensure_model(engine):
    """Download a Voicebox model (e.g. kokoro, about 300 MB) if it is not on this computer yet."""
    st = {m["model_name"]: m for m in json.loads(req("GET", "/models/status"))["models"]}
    if engine not in st or st[engine]["downloaded"]:
        return
    print(f'Downloading the Voicebox model "{engine}" (one time only)...')
    if not st[engine].get("downloading"):
        req("POST", "/models/download", {"model_name": engine})
    t0 = time.time()
    while True:
        time.sleep(3)
        m = {m["model_name"]: m for m in json.loads(req("GET", "/models/status"))["models"]}[engine]
        if m["downloaded"]:
            print(f'  done ({m.get("size_mb") or 0:.0f} MB, {time.time() - t0:.0f}s)')
            return
        if not m.get("downloading") and time.time() - t0 > 30:
            pf.die(f'download of "{engine}" stopped. Open the Voicebox app > Models and download it there.')
        print(f"  ...{time.time() - t0:.0f}s")


def create_preset(name, engine, voice_id, language="en", description=""):
    ensure_model(engine)
    return json.loads(req("POST", "/profiles", {"name": name, "language": language, "voice_type": "preset",
                                                "preset_engine": engine, "preset_voice_id": voice_id, "default_engine": engine,
                                                "description": description}))


def ensure_profile(V):
    """Create the brand's preset profile in Voicebox if it is not there yet."""
    for p in profiles():
        if V.get("profile") in (p["id"], p["name"]):
            return p
    if not V.get("preset_voice_id"):
        pf.die(f'Voicebox profile "{V.get("profile")}" not found and brand.json voice has no preset_voice_id to create it.')
    p = create_preset(V["profile"], V.get("engine", "kokoro"), V["preset_voice_id"], V.get("language", "en"),
                      "Channel narrator created by PaperFold tools/voicebox.py")
    print(f'created Voicebox profile "{p["name"]}"')
    return p


def find_profile(name):
    ps = profiles()
    for p in ps:
        if name in (p["id"], p["name"]):
            return p
    pf.die(f'profile "{name}" not found. Available: ' + ", ".join(p["name"] for p in ps))


def generate(p, text, seed, instruct):
    body = {"profile_id": p["id"], "text": text, "language": p.get("language", "en"), "normalize": True}
    if p.get("default_engine"):
        body["engine"] = p["default_engine"]
    if seed is not None:
        body["seed"] = seed
    if instruct:
        body["instruct"] = instruct
    g = json.loads(req("POST", "/generate", body))
    gid = g["id"]
    while True:
        h = json.loads(req("GET", f"/history/{gid}"))
        if h["status"] == "completed":
            break
        if h["status"] == "failed":
            pf.die(f"Voicebox failed on: {text!r}: {h.get('error')}")
        time.sleep(1)
    return req("GET", f"/audio/{gid}")


def cmd_profiles(_):
    for p in profiles():
        print(f'{p["name"]:40s} {p.get("voice_type", ""):8s} {p.get("default_engine") or ""}  id={p["id"]}')


def make_voice(script, out, profile=None, gap=None, seed=None, instruct=None):
    np = pf.need_numpy()
    V = brand_voice()
    p = find_profile(profile) if profile else ensure_profile(V)
    gap = V.get("gap", 0.35) if gap is None else gap
    seed = V.get("seed") if seed is None else seed
    instruct = instruct or V.get("instruct")
    parsed = pf.parse_script(Path(script).read_text(encoding="utf-8"), cast={} if profile else None)
    lines = [x["text"] for x in parsed]
    say_as = V.get("pronounce") or {}  # e.g. {"Haddad": "ha-dad"}: captions keep the spelling, the voice says it right
    sr = 24000
    # multi-voice scripts: one Voicebox profile per speaker (brand.json voice.cast), longer gaps on a new
    # speaker or segment, and a silent pause after lines in pause segments (e.g. REPEAT) for the viewer to speak
    cast = pf.brand_cast() if not profile else {}
    voices = {}
    for spk in dict.fromkeys(x["speaker"] for x in parsed if x["speaker"] in cast):
        c = cast[spk]
        voices[spk] = ensure_profile({"engine": V.get("engine", "kokoro"), "language": V.get("language", "en"),
                                      "profile": c.get("profile") or f'{pf.load_json(pf.BRAND_DIR / "brand.json").get("channel", "channel")} - {spk.title()}',
                                      **c})
    pause_after = {k.upper(): v for k, v in (V.get("pause_segments") or {}).items()}
    narrator = next((k for k, v in cast.items() if v.get("default")), None)
    slow = {k.upper(): v for k, v in (V.get("slow_segments") or {}).items()} if cast else {}
    parts = []
    for i, item in enumerate(parsed, 1):
        line = item["text"]
        if i > 1:
            prev = parsed[i - 2]
            g = gap
            if cast and prev["segment"] != item["segment"]:
                g = V.get("segment_gap", 1.0)
            elif cast and prev["speaker"] != item["speaker"]:
                g = V.get("turn_gap", gap + 0.15)
            if prev["segment"] and prev["segment"].upper() in pause_after and prev["speaker"] != narrator:
                g = max(g, pause_after[prev["segment"].upper()])
            parts.append(np.zeros(int(g * sr), dtype=np.float32))
        t0 = time.time()
        spoken_line = line
        for word, sound in say_as.items():
            spoken_line = re.sub(rf"\b{re.escape(word)}\b", sound, spoken_line, flags=re.I)
        vp = voices.get(item["speaker"], p) if voices else p
        wav = generate(vp, spoken_line, seed, instruct)
        with wave.open(io.BytesIO(wav)) as w:
            if w.getframerate() != sr or w.getnchannels() != 1 or w.getsampwidth() != 2:
                # let ffmpeg normalise unusual formats
                raw = subprocess.run(["ffmpeg", "-v", "error", "-i", "-", "-ac", "1", "-ar", str(sr), "-f", "s16le", "-"],
                                     input=wav, capture_output=True, check=True).stdout
            else:
                raw = w.readframes(w.getnframes())
        x = np.frombuffer(raw, dtype="<i2").astype(np.float32) / 32768
        # trim leading/trailing silence so every gap is exactly a.gap
        nz = np.nonzero(np.abs(x) > 0.01)[0]
        if len(nz):
            x = x[max(0, nz[0] - int(0.03 * sr)): nz[-1] + int(0.06 * sr)]
        speed = slow.get((item["segment"] or "").upper()) if item["speaker"] != narrator else None
        if speed and speed != 1:
            # slower and clearer for learners (pitch kept): brand.json voice.slow_segments
            pcm = subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(sr), "-ac", "1", "-i", "-",
                                  "-af", f"atempo={speed}", "-f", "f32le", "-"], input=x.astype("<f4").tobytes(),
                                 capture_output=True, check=True).stdout
            x = np.frombuffer(pcm, dtype="<f4")
        parts.append(x)
        who = f"{item['speaker']}: " if item["speaker"] else ""
        print(f"L{i:<3d} {len(x) / sr:5.2f}s ({time.time() - t0:.1f}s)  {who}{line[:60]}")
    y = np.concatenate(parts)
    y = y / (np.abs(y).max() + 1e-9) * 0.9
    out = Path(out)
    pcm = (y * 32767).astype("<i2").tobytes()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(sr), "-ac", "1", "-i", "-", "-b:a", "192k", str(out)],
                   input=pcm, check=True)
    print(f"wrote {out} ({len(y) / sr:.1f}s, {len(lines)} lines, voice \"{p['name']}\")")
    return out


def cmd_make(a):
    make_voice(a.script, a.out, a.profile, a.gap, a.seed, a.instruct)


def cmd_voices(a):
    d = json.loads(req("GET", f"/profiles/presets/{a.engine}"))
    vs = d.get("voices", [])
    if not vs:
        pf.die(f'no preset voices for engine "{a.engine}"')
    print(f"{'voice id':16s} {'name':12s} gender  language")
    for v in vs:
        print(f"{v['voice_id']:16s} {v.get('name', ''):12s} {v.get('gender', ''):7s} {v.get('language', '')}")
    print("\nKokoro ids: a = American, b = British; f = female, m = male (af_heart = American female 'Heart').")


def cmd_audition(a):
    """Same text, several voices: temporary profiles are created and removed again."""
    text = Path(a.script).read_text(encoding="utf-8") if a.script else \
        "You make three thousand dollars a month. So why is your bank account at zero by the twenty-fifth? Here's the fix."
    lines = pf.split_sentences(text)[:4]
    sample = Path(a.out or "voice-samples")
    sample.mkdir(parents=True, exist_ok=True)
    tmp = sample / "_sample.txt"
    tmp.write_text("\n".join(lines), encoding="utf-8")
    for vid in [v.strip() for v in a.voices.split(",") if v.strip()]:
        p = create_preset(f"audition - {vid}", a.engine, vid)
        try:
            make_voice(tmp, sample / f"{vid}.mp3", profile=p["id"], gap=0.35, seed=7)
        finally:
            req("DELETE", f"/profiles/{p['id']}")
    tmp.unlink()
    print(f"Listen to the files in {sample}/ and pick one:  python3 tools/voicebox.py use VOICE_ID")


def cmd_use(a):
    bp = pf.BRAND_DIR / "brand.json"
    b = pf.load_json(bp)
    V = b.get("voice") or {}
    pretty = a.voice_id.split("_", 1)[-1].capitalize()
    V.update({"provider": "voicebox", "engine": a.engine, "preset_voice_id": a.voice_id,
              "profile": a.name or f'{b.get("channel", "channel")} - {pretty}'})
    V.setdefault("language", "en")
    V.setdefault("gap", 0.35)
    V.setdefault("seed", 7)
    b["voice"] = V
    bp.write_text(json.dumps(b, indent=2, ensure_ascii=False), encoding="utf-8")
    p = ensure_profile(V)
    print(f'channel voice is now "{p["name"]}" ({a.engine} {a.voice_id}); saved in {bp}')


def cmd_setup(_):
    p = ensure_profile(brand_voice())
    print(f'ready: "{p["name"]}" ({p.get("default_engine")})')


def main():
    ap = argparse.ArgumentParser(description="Voice-over via local Voicebox")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("profiles").set_defaults(fn=cmd_profiles)
    sub.add_parser("setup").set_defaults(fn=cmd_setup)
    v = sub.add_parser("voices")
    v.add_argument("--engine", default="kokoro")
    v.set_defaults(fn=cmd_voices)
    au = sub.add_parser("audition")
    au.add_argument("--voices", required=True, help="comma separated voice ids, e.g. am_puck,af_heart")
    au.add_argument("--script", help="text file to read (first 4 sentences); default: a short sample")
    au.add_argument("--out", help="folder for the samples (default: voice-samples/)")
    au.add_argument("--engine", default="kokoro")
    au.set_defaults(fn=cmd_audition)
    u = sub.add_parser("use")
    u.add_argument("voice_id")
    u.add_argument("--engine", default="kokoro")
    u.add_argument("--name", help="profile name (default: '<channel> - <Voice>')")
    u.set_defaults(fn=cmd_use)
    m = sub.add_parser("make")
    m.add_argument("--script", required=True)
    m.add_argument("--profile", help="profile name or id (default: brand.json voice.profile)")
    m.add_argument("--out", required=True)
    m.add_argument("--gap", type=float, help="silence between sentences in seconds (default from brand.json)")
    m.add_argument("--seed", type=int)
    m.add_argument("--instruct", help="style instruction (engines that support it)")
    m.set_defaults(fn=cmd_make)
    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
