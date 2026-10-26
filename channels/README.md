# Channels: one skill pair per YouTube channel

[Bahasa Indonesia → README.id.md](README.id.md)

Each folder in `channels/` describes **one YouTube channel**. From it, `tools/package.py` builds two skills that know that channel by heart:

| Skill | Built from | Job |
|---|---|---|
| `<channel>-scriptwriter` | `templates/scriptwriter/` + this channel's `CHANNEL.md`, `examples/` | script + publish brief (use a strong model) |
| `<channel>-studio` | the PaperFold engine + `templates/studio/` + this channel's `brand/`, `CHANNEL.md`, `examples/` | voice, storyboard, render, upload folder (a cheap model is fine) |

Current channels: **maplestreet** (`channels/maplestreet/`). Starting point for a new one: `channels/_template/`.

---

## 1. Folder layout

```
paperfold-studio/                 ← the source folder (edit here, never in installed skills)
  engine/ tools/ themes/ assets/  ← shared engine for all channels (do not edit per channel)
  reference/                      ← shared storyboard/publish references
  templates/
    studio/        SKILL.md README.md README.id.md          ← text of the studio skill, with {{placeholders}}
    scriptwriter/  SKILL.md SCRIPT-GUIDE.md BRIEF.md calc.py README.md README.id.md
  channels/
    _template/     ← copy this for a new channel
    maplestreet/
      channel.json   ← identity + skill names (fills the {{placeholders}})
      CHANNEL.md     ← channel bible: audience, tone, character canon, series, numbers, never-list
      brand/         ← brand.json (look, voice, watermark, YouTube settings) + logo files
      examples/      ← one finished script.txt + brief.json (+ storyboard.json) the AI imitates
  dist/            ← build output (do not edit)
```

## 2. Build and install

```bash
python3 tools/package.py channel maplestreet                       # build into dist/
python3 tools/package.py channel maplestreet --install antigravity # + install to ~/.gemini/config/skills/
python3 tools/package.py channel maplestreet --install claude      # + install to ~/.claude/skills/
python3 tools/package.py channel maplestreet --zip                 # + dist/<skill>.skill for Claude.ai
python3 tools/package.py channel --all --install antigravity     # every channel (after an engine update)
```
The builder refuses to build while `channel.json`, `CHANNEL.md` or `brand/brand.json` still contain `CHANGE-ME`, or a template uses a `{{placeholder}}` that `channel.json` does not define.

Installing overwrites the installed copy. If the installed `brand/brand.json` differs from the source one, it is saved as `channels/<name>/brand/brand.installed-<date>.json` first, so manual edits are never lost silently.

### Install in any AI tool

Skills follow the open **Agent Skills** format (a folder with `SKILL.md` + files), so the same build works in many AI tools. Run from the PaperFold Studio source folder:

```bash
python3 tools/package.py channel <id> --install all           # Antigravity, Claude Code, CodeBuddy, WorkBuddy, ~/.agents
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
Read ~/.agents/skills/<id>-studio/SKILL.md and follow it: make a Shorts video from videos/<topic>/script.txt
```

Or put this in an `AGENTS.md` file at the root of your workspace (read automatically by many agents, e.g. Codex, Cursor, Copilot, Jules, Aider):

```markdown
## Skills for this project
- <channel> scripts: read ~/.agents/skills/<id>-scriptwriter/SKILL.md and follow it.
- <channel> videos: read ~/.agents/skills/<id>-studio/SKILL.md and follow it.
```
(Install with `--install agents` first, or use the path of any other installed copy.)

## 3. Clone a channel: step by step

Example: a new channel **"Body Facts"** (science of the human body, character "Mia", paper style).

### Step 1: copy the template
```bash
cp -R channels/_template channels/bodyfacts
```
Folder name = channel id: lowercase letters, numbers, dashes.

### Step 2: what to change (checklist)

| # | File | What to set | Required |
|---|---|---|---|
| 1 | `channel.json` | `id` (= folder name), `name`, `handle`, `language`, `niche`, `tagline`, `audience`, `style`, `theme`, `character`, `default_format` | yes |
| 2 | `channel.json` | `studio_skill` = `<id>-studio`, `script_skill` = `<id>-scriptwriter` (unique names) | yes |
| 3 | `channel.json` | `studio_description`, `script_description`: one sentence each saying **what** the skill does and **when** to use it, mentioning the channel name and niche (agents use these to pick the skill) | yes |
| 4 | `CHANNEL.md` | every section: identity, audience, voice and tone, **character canon**, series and episodes (can start empty), content pillars, default numbers/facts, never-list, title/thumbnail/pinned-comment style | yes |
| 5 | `brand/brand.json` | `channel`, `handle`, `initials`, `color`, `color2`, `tagline`, `seed` (your own random number) | yes |
| 6 | `brand/brand.json` | `theme`: `ink` (stick-figure story with Sam-style character) or a paper theme `meadow`, `kraft`, `midnight`, `notebook`, `candy` (mascot Foldy) | yes |
| 7 | `brand/brand.json` | `mascot`: `hoodie` colour for ink; `body`, `scarf`... for paper | recommended |
| 8 | `brand/brand.json` | `outro` (CTA text), `music` (`auto`, `lofi`, `playful`, `calm`, `curious`) | recommended |
| 9 | `brand/brand.json` | `voice`: `profile` (a new name, e.g. `bodyfacts - Heart`), `preset_voice_id` (Kokoro id) | yes if you use Voicebox |
| 10 | `brand/brand.json` | `youtube`: `category`, `language`, `playlist_shorts`, `playlist_long`, `hashtags`, `tags`, `footer`, `disclaimer` (fit the niche: health → "not medical advice"), `audience_timezone`, `schedule_local_times`, `my_timezone`, `rules`, `guide_language` | yes |
| 11 | `brand/brand.json` | `watermark` (moves per scene by default), `logo` colours | optional |
| 12 | `brand/*.png` | logo, banner, profile picture: generate them (step 4) or add your own `logo.png` | yes |
| 13 | `examples/` | at least one example: `<topic>/script.txt` (one sentence per line) and `<topic>/brief.json`; a `storyboard.json` helps the studio | recommended |

**Do not change** (shared by all channels): `engine/`, `tools/`, `themes/`, `assets/`, `reference/`, `templates/`. Change those only to improve every channel at once, then rebuild with `--all`.

### Step 3: the character
- **ink theme:** the character is drawn as a stick figure in a hoodie (`mascot.hoodie` colour). Its name, age and life live only in `CHANNEL.md` (canon) and `channel.json` (`character`).
- **paper theme:** the mascot is the folded-paper figure; set `mascot.body`, `scarf`, `cheek` colours. Give it a name and personality in `CHANNEL.md`.
- Keep numbers about the character (income, age, city) in the canon table so every script agrees.

### Step 4: voice and logo
```bash
python3 tools/voicebox.py voices                                        # pick a voice id
python3 tools/voicebox.py audition --voices af_heart,am_puck            # listen in voice-samples/
python3 tools/voicebox.py --brand channels/<id>/brand use af_heart      # saves it in the channel's brand.json
python3 tools/logo.py --brand channels/<id>/brand                       # logo, banner, profile picture
```
`use` names the voice profile `<channel> - <Voice>` and creates it in Voicebox. `logo.py` writes the PNG files into `channels/<id>/brand/`.
(Or put your own square, transparent `logo.png` into `channels/<id>/brand/`.)

### Step 5: build, install, test
```bash
python3 tools/package.py channel <id> --install antigravity
```
Then, in a new conversation in the new channel's workspace:
1. `python3 ~/.gemini/config/skills/<id>-studio/tools/voicebox.py setup` (creates the voice profile)
2. `/<id>-scriptwriter write a Shorts script about <a topic>`: approve it
3. `/<id>-studio make a Shorts video from videos/<topic>/script.txt`
4. Check `videos/<topic>/publish/`: cover, colours, voice, watermark, outro text.

### Step 6: keep it alive
- Add every published episode to the series table in `CHANNEL.md`, then rebuild.
- Never edit the installed skills directly; edit `channels/<id>/` and rebuild.

## 4. Prompt for an AI to do the clone

Give this to Claude, Antigravity or another agent, opened in the PaperFold Studio folder:

```
Read channels/README.md and channels/maplestreet/ as the reference example.
Create a new channel "<NAME>" (id: <id>) by copying channels/_template to channels/<id> and filling in
every CHANGE-ME, following the checklist in section 3, step 2.
Channel facts:
- niche: <...>
- audience: <...>
- language: <...>
- style/theme: <ink or a paper theme>
- character: <name, age, situation, personality>
- tone: <...>
- never: <topics/claims to avoid>
- disclaimer: <...>
- voice: <Kokoro voice id, or "pick one and let me listen">
- YouTube: category <...>, playlists <...>, hashtags <...>, audience time zone <...>, my time zone <...>
Do not change engine/, tools/, themes/, assets/, reference/ or templates/.
Then generate the logo files, build with: python3 tools/package.py channel <id>,
and show me the built SKILL.md files and CHANNEL.md for review before installing.
```

## 5. Removing a channel skill

Delete (or move to an archive folder) `~/.gemini/config/skills/<id>-studio` and `<id>-scriptwriter` (or `~/.claude/skills/...`). The source `channels/<id>/` stays, so you can rebuild later.
