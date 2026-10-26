#!/usr/bin/env python3
"""Build, package or install the skills.

Channel skills (recommended: one pair per YouTube channel, built from channels/<name>/):
  python3 tools/package.py channel maplestreet                         -> dist/maplestreet-studio/ + dist/maplestreet-scriptwriter/
  python3 tools/package.py channel maplestreet --install TARGET[,TARGET] -> also install both skills
  python3 tools/package.py channel maplestreet --zip                    -> also dist/<skill>.skill (upload to Claude.ai)
  python3 tools/package.py channel --all [--install ...]              -> every folder in channels/ except _template

  TARGET            installs into                      read by
  antigravity       ~/.gemini/config/skills/           Google Antigravity
  claude            ~/.claude/skills/                  Claude Code (CLI, desktop, IDE extensions)
  codebuddy         ~/.codebuddy/skills/               Tencent CodeBuddy (IDE, plugin, CLI)
  workbuddy         ~/.workbuddy-ai/skills/            Tencent WorkBuddy AI (desktop app)
  agents            ~/.agents/skills/                  the shared "Agent Skills" folder: Codex, Cursor, Gemini CLI,
                                                       GitHub Copilot, OpenCode, Cline, Amp and other compatible agents
  all               all of the above
  workspace         PATH/.agents/skills/               one project only (Antigravity and .agents-compatible agents)
  workspace-codebuddy  PATH/.codebuddy/skills/         one project only (CodeBuddy)
  workspace-claude     PATH/.claude/skills/            one project only (Claude Code)
  (workspace targets need --workspace PATH)

Without arguments: builds the maplestreet pair (same as "channel maplestreet").
"""
import argparse
import datetime
import json
import re
import shutil
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"




def zip_dir(src, out, top):
    out.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for p in sorted(src.rglob("*")):
            if p.is_file() and p.name != ".DS_Store":
                z.write(p, f"{top}/{p.relative_to(src).as_posix()}")
    print("wrote", out)


# ---------------------------------------------------------------- channel skills
def fail(msg):
    print("ERROR: " + msg)
    sys.exit(1)


def load_channel(name):
    cdir = ROOT / "channels" / name
    if not (cdir / "channel.json").exists():
        fail(f"{cdir / 'channel.json'} not found. Copy channels/_template to channels/{name} first (see channels/README.md).")
    C = json.loads((cdir / "channel.json").read_text(encoding="utf-8"))
    need = ["id", "name", "handle", "language", "niche", "character", "theme", "default_format",
            "studio_skill", "script_skill", "studio_description", "script_description"]
    missing = [k for k in need if not str(C.get(k, "")).strip()]
    if missing:
        fail(f"channel.json is missing: {', '.join(missing)}")
    bad = [k for k, v in C.items() if not k.startswith("_") and isinstance(v, str) and "CHANGE-ME" in v]
    if bad:
        fail(f"channel.json still has CHANGE-ME in: {', '.join(bad)}")
    for k in ("studio_skill", "script_skill"):
        if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", C[k]):
            fail(f'{k} "{C[k]}" must be lowercase letters, numbers and dashes')
    for f in ("CHANNEL.md", "brand/brand.json"):
        if not (cdir / f).exists():
            fail(f"{cdir / f} is missing")
    for f in ("CHANNEL.md", "brand/brand.json"):
        if "CHANGE-ME" in (cdir / f).read_text(encoding="utf-8"):
            fail(f"{cdir / f} still contains CHANGE-ME")
    return C, cdir


def render(text, C, where):
    # <key>_yaml = the value as a quoted YAML string (safe in SKILL.md frontmatter even with ":" or "#")
    C = dict(C, **{f"{k}_yaml": json.dumps(v, ensure_ascii=False) for k, v in C.items() if isinstance(v, str)})
    out = re.sub(r"\{\{(\w+)\}\}", lambda m: str(C.get(m.group(1), m.group(0))), text)
    left = re.findall(r"\{\{\w+\}\}", out)
    if left:
        fail(f"{where}: unknown placeholder(s) {', '.join(sorted(set(left)))} (add them to channel.json)")
    return out


def put(dest, text):
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(text, encoding="utf-8")


def build_studio(C, cdir):
    out = DIST / C["studio_skill"]
    shutil.rmtree(out, ignore_errors=True)
    for d in ("engine", "themes", "assets"):
        shutil.copytree(ROOT / d, out / d, ignore=shutil.ignore_patterns(".DS_Store", "__pycache__"))
    (out / "tools").mkdir(parents=True)
    for f in ("pf.py", "voicebox.py", "logo.py", "speech.py", "channel_art.py"):
        shutil.copy2(ROOT / "tools" / f, out / "tools" / f)
    (out / "reference").mkdir()
    for f in ("STORYBOARD.md", "PUBLISH.md", "example-storyboard.json"):
        shutil.copy2(ROOT / "reference" / f, out / "reference" / f)
    shutil.copytree(cdir / "brand", out / "brand", ignore=shutil.ignore_patterns(".DS_Store", "brand.installed-*"))
    shutil.copy2(ROOT / "brand" / "README.md", out / "brand" / "README.md")
    shutil.copy2(cdir / "CHANNEL.md", out / "CHANNEL.md")
    if (cdir / "examples").exists():
        shutil.copytree(cdir / "examples", out / "examples", ignore=shutil.ignore_patterns(".DS_Store"))
    (out / "docs").mkdir()
    shutil.copy2(ROOT / "docs" / "ENGINE.md", out / "docs" / "ENGINE.md")
    shutil.copy2(ROOT / "docs" / "ENGINE.id.md", out / "docs" / "ENGINE.id.md")
    if (ROOT / "MONETISASI.md").exists():
        shutil.copy2(ROOT / "MONETISASI.md", out / "docs" / "MONETISASI.md")
    if (cdir / "YOUTUBE-SETUP.md").exists():
        shutil.copy2(cdir / "YOUTUBE-SETUP.md", out / "docs" / "YOUTUBE-SETUP.md")
    for f in ("SKILL.md", "README.md", "README.id.md"):
        put(out / f, render((ROOT / "templates" / "studio" / f).read_text(encoding="utf-8"), C, f"templates/studio/{f}"))
    print("built", out)
    return out


def build_scriptwriter(C, cdir):
    out = DIST / C["script_skill"]
    shutil.rmtree(out, ignore_errors=True)
    out.mkdir(parents=True)
    for f in ("SKILL.md", "SCRIPT-GUIDE.md", "BRIEF.md", "README.md", "README.id.md"):
        put(out / f, render((ROOT / "templates" / "scriptwriter" / f).read_text(encoding="utf-8"), C, f"templates/scriptwriter/{f}"))
    shutil.copy2(cdir / "CHANNEL.md", out / "CHANNEL.md")
    ex = cdir / "examples"
    if ex.exists():
        for f in ex.rglob("*"):
            if f.is_file() and f.name in ("script.txt", "brief.json"):
                dest = out / "examples" / f.relative_to(ex)
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(f, dest)
    print("built", out)
    return out


def install(src, dest, cdir):
    dest = Path(dest).expanduser()
    old_brand = dest / "brand" / "brand.json"
    new_brand = src / "brand" / "brand.json"
    if old_brand.exists() and new_brand.exists() and old_brand.read_bytes() != new_brand.read_bytes():
        stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
        keep = cdir / "brand" / f"brand.installed-{stamp}.json"
        shutil.copy2(old_brand, keep)
        print(f"NOTE: the installed brand.json was different from channels/{cdir.name}/brand/brand.json.")
        print(f"      It was saved as {keep} - merge anything you need into the channel source and build again.")
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(src, dest)
    print("installed ->", dest)


HOME_TARGETS = {
    "antigravity": Path.home() / ".gemini" / "config" / "skills",
    "claude": Path.home() / ".claude" / "skills",
    "codebuddy": Path.home() / ".codebuddy" / "skills",
    "workbuddy": Path.home() / ".workbuddy-ai" / "skills",
    "agents": Path.home() / ".agents" / "skills",
}
WORKSPACE_TARGETS = {"workspace": ".agents/skills", "workspace-codebuddy": ".codebuddy/skills", "workspace-claude": ".claude/skills"}


def parse_targets(spec):
    if not spec:
        return []
    out = []
    for t in [x.strip() for x in spec.split(",") if x.strip()]:
        if t == "all":
            out += list(HOME_TARGETS)
        elif t in HOME_TARGETS or t in WORKSPACE_TARGETS:
            out.append(t)
        else:
            fail(f'unknown install target "{t}". Use: {", ".join(list(HOME_TARGETS) + ["all"] + list(WORKSPACE_TARGETS))}')
    return list(dict.fromkeys(out))


def target_dir(t, workspace):
    if t in HOME_TARGETS:
        return HOME_TARGETS[t]
    if not workspace:
        fail(f"--install {t} needs --workspace PATH")
    return Path(workspace).expanduser() / WORKSPACE_TARGETS[t]


def cmd_channel(a):
    targets = parse_targets(a.install)
    names = sorted(p.name for p in (ROOT / "channels").iterdir() if p.is_dir() and not p.name.startswith("_")) if a.all else [a.name]
    if not names or names == [None]:
        fail("give a channel name (folder in channels/) or --all")
    for name in names:
        C, cdir = load_channel(name)
        built = [build_studio(C, cdir), build_scriptwriter(C, cdir)]
        for b in built:
            if a.zip:
                zip_dir(b, DIST / f"{b.name}.skill", b.name)
            for target in targets:
                install(b, target_dir(target, a.workspace) / b.name, cdir)


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "channel":
        ap = argparse.ArgumentParser(prog="package.py channel")
        ap.add_argument("name", nargs="?")
        ap.add_argument("--all", action="store_true")
        ap.add_argument("--install", help="antigravity, claude, codebuddy, workbuddy, agents, all, workspace, workspace-codebuddy, workspace-claude (comma separated)")
        ap.add_argument("--workspace")
        ap.add_argument("--zip", action="store_true")
        cmd_channel(ap.parse_args(sys.argv[2:]))
        return
    if len(sys.argv) > 1:
        print(__doc__)
        return
    cmd_channel(argparse.Namespace(name="maplestreet", all=False, install=None, workspace=None, zip=False))

if __name__ == "__main__":
    main()
