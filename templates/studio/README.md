# {{studio_skill}}

**Video production for the YouTube channel {{name}} ({{handle}}): from a finished script to a ready-to-upload folder.**

[Bahasa Indonesia → README.id.md](README.id.md)

This skill is one half of a pair:

| Skill | Job | Best model |
|---|---|---|
| **{{script_skill}}** | writes the script + a publish brief (titles, thumbnail text, description, pinned comment, scene plan) | a strong model (Claude, Gemini Pro, ...) |
| **{{studio_skill}}** (this one) | voice-over, storyboard, render, thumbnail and the upload folder | a cheap model is fine (Flash, Lite, Haiku, ...) |

Everything that makes {{name}} look and sound like {{name}} is already inside this skill: the chibi cast on Maple Street ({{theme}} theme), the logo and watermark, the voice, music, outro, YouTube settings and the channel bible (`CHANNEL.md`).

---

## 1. The workflow

```
/{{script_skill}} write an episode at <place> (A2)
        │  (you approve the script)
        ▼
videos/<topic>/script.txt + videos/<topic>/brief.json
        │
/{{studio_skill}} make a 16:9 video from videos/<topic>/script.txt
        ▼
videos/<topic>/publish/   ← video, cover/thumbnail, titles, description, pinned comment, UPLOAD.md
```

Start a **new conversation for each video**: it keeps the cost per video low and stops the agent from copying old work.

## 2. Requirements (one time)

Python 3.9+ with numpy, Node.js 22+, ffmpeg, Google Chrome (or Edge/Chromium), and the Voicebox app with the Kokoro model for the free voice-over. Full installation steps for macOS, Windows and Linux: [`docs/ENGINE.md`](docs/ENGINE.md) sections 4-6.

Check from the skill folder:
```bash
python3 tools/pf.py doctor
python3 tools/voicebox.py setup     # downloads Kokoro once and creates the channel voice
```

## 3. Install or update

The skill is **built** from the PaperFold Studio source folder (do not edit the installed copy). This builds and installs both {{studio_skill}} and {{script_skill}}.

Skills follow the open **Agent Skills** format (a folder with `SKILL.md` + files), so the same build works in many AI tools. Run from the PaperFold Studio source folder:

```bash
python3 tools/package.py channel {{id}} --install all           # Antigravity, Claude Code, CodeBuddy, WorkBuddy, ~/.agents
```

| AI tool | `--install` target | Installed to |
|---|---|---|
| Google Antigravity | `antigravity` | `~/.gemini/config/skills/` |
| Claude Code (CLI, desktop, VS Code/JetBrains) | `claude` | `~/.claude/skills/` |
| Tencent CodeBuddy (IDE, plugin, CLI) | `codebuddy` | `~/.codebuddy/skills/` |
| Tencent WorkBuddy AI (desktop app) | `workbuddy` | `~/.workbuddy-ai/skills/` |
| Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode, Cline, Amp and other tools that read the shared Agent Skills folder | `agents` | `~/.agents/skills/` |
| All of the above | `all` | |
| One project only | `workspace`, `workspace-codebuddy`, `workspace-claude` + `--workspace PATH` | `PATH/.agents/skills/`, `PATH/.codebuddy/skills/`, `PATH/.claude/skills/` |
| Claude.ai (web/desktop chat) | `--zip`, then upload `dist/<skill>.skill` | Settings → Capabilities → Skills |

Targets can be combined: `--install antigravity,codebuddy`. Start a new conversation (or restart the IDE) after installing so the tool sees the skills. Updating = run the same command again (every target is a copy, so update all the ones you use).

**Any other AI tool (universal fallback).** If a tool has no skill support but can read files and run commands, point it at the skill directly:

```
Read ~/.agents/skills/{{studio_skill}}/SKILL.md and follow it: make a 16:9 video from videos/<topic>/script.txt
```

Or put this in an `AGENTS.md` file at the root of your workspace (read automatically by many agents, e.g. Codex, Cursor, Copilot, Jules, Aider):

```markdown
## Skills for this project
- {{name}} scripts: read ~/.agents/skills/{{script_skill}}/SKILL.md and follow it.
- {{name}} videos: read ~/.agents/skills/{{studio_skill}}/SKILL.md and follow it.
```
(Install with `--install agents` first, or use the path of any other installed copy.)

## 4. Your workspace

Open your channel folder (for example `.../youtube/{{id}}/`) as the workspace. Every video lives in **one folder named after its topic**:

```
videos/
  first-breakfast/
    script.txt        from {{script_skill}} (edit this to change the words)
    brief.json        from {{script_skill}} (titles, description, pinned comment, thumbnail text, scene plan)
    input/            voice-over and the exact script it was made from
    lines.md          numbered lines with times
    storyboard.json   scenes (written by the studio agent)
    publish.json      upload texts (made from brief.json)
    build/  out/      working files and the rendered MP4
    publish/          ← upload this: open UPLOAD.md
```
Folder names are the topic (`first-breakfast`, a new version `first-breakfast-v2`). Generic names (`v3`, `test`) and scripts saved next to the folder are refused.

## 5. Example requests

```
/{{studio_skill}} make a 16:9 video from videos/first-breakfast/script.txt
/{{studio_skill}} make a 16:9 video from videos/at-the-pharmacy/script.txt
/{{studio_skill}} make a 16:9 video from videos/where-is-the-post-office/script.txt with voice.mp3
/{{studio_skill}} scene 3 should be a dialogue with Mia and Walter, then make it again
/{{studio_skill}} use scene 5 for the thumbnail with the text "Order Like a Local"
/{{studio_skill}} the script changed, make the video again
```
Format: 16:9 episodes by default; Shorts when you say Shorts / vertical / 9:16, or `brief.json` says `"format": "shorts"`.

## 6. Quality gate

Before rendering, `check` looks for problems that make a weak video: an empty first second, a scene longer than 12 seconds, cents read aloud, numbers on screen that the narrator never says, unreadable text colours. They are listed as **MUST FIX** and `make` stops until they are fixed. If you really want to publish anyway, say so; the agent may then add `--accept-warnings`. Narration problems (cents, hook) are fixed in the script with {{script_skill}}.

## 7. Commands (for you or the agent)

| Command | What it does |
|---|---|
| `python3 tools/pf.py doctor` | checks the tools |
| `python3 tools/pf.py init videos/<topic> [--format long] [--voice FILE] [--script FILE]` | voice (Voicebox) + timing + draft storyboard |
| `python3 tools/pf.py check videos/<topic>` | validates the storyboard and the quality gate |
| `python3 tools/pf.py make videos/<topic>` | check → preview → render → publish folder |
| `... make videos/<topic> --cpu eco` | same, but gentle on the computer (slower). Default `balanced`; `max` = fastest. Or set `PF_CPU=eco` once |
| `python3 tools/pf.py catalog` | scene types and icons |
| `python3 tools/voicebox.py voices / audition / use` | try or change the channel voice |
| `python3 tools/logo.py` | logo, banner, profile picture from brand.json |

Full reference: [`docs/ENGINE.md`](docs/ENGINE.md) section 15.

## 8. Where the channel settings live

| What | File (in the source: `channels/{{id}}/`) |
|---|---|
| Name, skill names, descriptions | `channel.json` |
| Colours, theme, character colours, watermark, voice, music, YouTube settings, posting rules | `brand/brand.json` |
| Logo and YouTube images | `brand/*.png` (`python3 tools/logo.py`) |
| Audience, tone, {{character}}'s canon, series, numbers, never-list | `CHANNEL.md` |
| Example script, brief and storyboard | `examples/` |

Edit them in the source folder, then build and install again (section 3). Changes made only in the installed copy are lost on the next install (the installer saves a different installed `brand.json` next to the source one so nothing is lost silently).

## 9. Making a skill pair for another channel

See `channels/README.md` in the PaperFold Studio source folder: copy `channels/_template`, fill in a few files, build.
