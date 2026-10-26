# PaperFold Studio

**From a script (or just a topic) to a ready-to-upload animated YouTube video, on your own computer.**

[Bahasa Indonesia → README.id.md](README.id.md)

> **Running a YouTube channel?** Build a channel-specific skill pair instead of using this generic skill: `<channel>-scriptwriter` (scripts, with your channel bible) and `<channel>-studio` (production, with your brand and voice). See [`channels/README.md`](../channels/README.md). The Maple Street pair is built with `python3 tools/package.py channel maplestreet --install claude`.

You send a `.txt` script, or only a topic. PaperFold Studio makes the voice-over, the animated scenes, captions that highlight every spoken word, music, sound effects and your watermark, then puts everything you need for YouTube into one folder: the video, a thumbnail, title options, the description, the comment to pin and a step-by-step upload guide.

It works as a **skill** for AI agents (Google Antigravity, Claude Code, Claude.ai) and as plain command-line tools.

---

## Contents

1. [Quick start](#1-quick-start)
2. [What you get](#2-what-you-get)
3. [How it works](#3-how-it-works)
4. [Requirements](#4-requirements)
5. [Install the requirements](#5-install-the-requirements)
6. [Install Voicebox and the Kokoro voices (free voice-over)](#6-install-voicebox-and-the-kokoro-voices-free-voice-over)
7. [Install the skill](#7-install-the-skill)
8. [First-time setup: your channel](#8-first-time-setup-your-channel)
9. [Choose the channel voice](#9-choose-the-channel-voice)
10. [Make a video with an AI agent](#10-make-a-video-with-an-ai-agent)
11. [Make a video with one command (no AI)](#11-make-a-video-with-one-command-no-ai)
12. [The publish folder and uploading](#12-the-publish-folder-and-uploading)
13. [The storyboard file](#13-the-storyboard-file)
14. [Writing scripts](#14-writing-scripts)
15. [Command reference](#15-command-reference)
16. [Troubleshooting](#16-troubleshooting)
17. [Limitations](#17-limitations)
18. [Folder structure](#18-folder-structure)
19. [Licenses](#19-licenses)

---

## 1. Quick start

Once, on a new computer (details in sections 5-9):

```bash
# 1. tools (macOS shown; Windows/Linux in section 5)
brew install python node ffmpeg
python3 -m pip install numpy
# 2. install the Voicebox app from https://github.com/jamiepine/voicebox (Releases) and open it
# 3. in the PaperFold Studio folder: install the skill for your AI tool
python3 tools/package.py channel maplestreet --install all
# 4. check everything, download the Kokoro voices, create the channel voice
python3 tools/pf.py doctor
python3 tools/voicebox.py setup
```

Every video after that:

- **With an AI agent:** type `/maplestreet-studio make a Shorts video from script.txt` (or give it only a topic).
- **Without AI:** `python3 tools/pf.py make videos/my-topic --script script.txt`

Result: `videos/my-topic/publish/` with the MP4, thumbnail, title, description, pinned comment and `UPLOAD.md`.

## 2. What you get

| | |
|---|---|
| **Formats** | YouTube Shorts / Reels / TikTok **9:16** (1080×1920) and normal YouTube **16:9** (1920×1080), 30 fps, H.264 + AAC |
| **Styles** | **ink**: stick-figure stories with the character *Sam*, data panels, handwritten notes (money, psychology, self-improvement). **paper**: paper-craft with the mascot *Foldy* (science, general knowledge) |
| **Themes** | `ink`, `meadow`, `kraft`, `midnight`, `notebook`, `candy` |
| **Scene templates** | 23: hook, meet, budget, growth, phone, talk, icons, list, steps, cycle, versus, myth, fact, number, chart, timeline, cause, zoom, warning, bigtext, title, image, outro |
| **Icons** | 93 built-in, plus your own PNG/SVG |
| **Captions** | Two lines, each word highlighted as it is spoken |
| **Voice** | Free and offline with Voicebox (Kokoro voices, generated sentence by sentence for exact sync), or your own file (ElevenLabs, a recording) |
| **Audio** | Voice + original background music + sound effects, loudness-normalised to −14 LUFS (YouTube standard) |
| **Branding** | Logo, outro with subscribe button, watermark that changes corner every scene, a faint drifting @handle and a tag in the caption card (re-uploads are hard to crop or blur) |
| **Publish kit** | Video, 1-3 thumbnails/covers with a big headline, 3 titles, full description with disclaimer and hashtags, pinned comment, upload guide with settings and the best upload times in your time zone |
| **Script help** | Script-writing guide for AI agents plus a money calculator (`calc`) so numbers are always right |
| **Speed** | On our 8-core test Mac: a 50-second Short goes from `.txt` to publish folder in about 65 seconds |

The same inputs always give the same video (deterministic).

## 3. How it works

```
topic ──(AI writes, you approve)──┐
                                  ▼
script.txt ──► init ──► voice-over (Voicebox or your file) + timing of every sentence and word
                    ──► lines.md (numbered sentences) + draft storyboard.json
storyboard.json + publish.json ──► make ──► check ► preview ► render ► publish/
```

All drawing, animation, timing, rendering and packaging code is already written. Per video only three small things change: the **script**, **`storyboard.json`** (which scene template shows each sentence, which icons, on which spoken word things appear) and **`publish.json`** (titles, description, pinned comment, thumbnail text). Cheap AI models (Gemini Flash/Lite, Claude Haiku) handle that reliably because they fill in a form instead of writing animation code, and `check` tells them exactly what to fix. Without any AI, `make` writes automatic drafts of both files.

## 4. Requirements

| What | Version | Needed for | Check with |
|---|---|---|---|
| **Python** | 3.9+ | all tools | `python3 --version` (Windows: `python --version`) |
| **numpy** | any recent | audio analysis and mixing | `python3 -c "import numpy"` |
| **Node.js** | **22+** | drives the browser that draws the frames | `node -v` |
| **ffmpeg** (incl. ffprobe) | any recent | reads audio, encodes video, makes thumbnails | `ffmpeg -version` |
| **Chromium browser** | Google Chrome, Microsoft Edge, Brave or Chromium | draws every frame | installed is enough |
| **Voicebox app** | 0.5+ | free voice-over (skip if you always bring a voice file) | open `http://127.0.0.1:17493` |
| **Kokoro model** (inside Voicebox) | about 300 MB | the voices | downloaded by `voicebox.py setup` |
| **AI agent** *(optional)* | Antigravity, Claude Code or Claude.ai | writes script/storyboard/publish text | — |

Disk: about 2 MB for the skill, 300 MB for Kokoro, roughly 25-40 MB per finished minute of video.
No npm packages, no Remotion, no paid services.

`python3 tools/pf.py doctor` checks everything in this table.

## 5. Install the requirements

### macOS (with [Homebrew](https://brew.sh))
```bash
brew install python node ffmpeg
```
```bash
python3 -m pip install numpy
```
Install Google Chrome if you have no Chromium browser.

### Windows (PowerShell, winget)
```powershell
winget install Python.Python.3.12
winget install OpenJS.NodeJS.LTS
winget install Gyan.FFmpeg
python -m pip install numpy
```
Close and reopen the terminal. On Windows type `python` wherever this guide says `python3`. Microsoft Edge works as the browser.

### Linux (Debian/Ubuntu)
```bash
sudo apt install python3 python3-pip ffmpeg
python3 -m pip install numpy
```
Ubuntu's own Node.js is often too old: install Node 22+ from [nodejs.org](https://nodejs.org) or NodeSource. Install Chrome or Chromium.

### Check
In the PaperFold Studio folder:
```bash
python3 tools/pf.py doctor
```
Every line should say `OK` (the Voicebox line is optional).

## 6. Install Voicebox and the Kokoro voices (free voice-over)

Skip this section if you will always supply your own voice file.

1. **Download Voicebox** from the official repository's Releases page: [github.com/jamiepine/voicebox](https://github.com/jamiepine/voicebox). It is free and open source and runs entirely on your computer. Pre-built apps exist for macOS and Windows; on Linux it is built from source (see its README).
2. **Open the Voicebox app.** It runs a local service at `http://127.0.0.1:17493`. Keep it open whenever you make a video without your own voice file.
3. **Download Kokoro and create the channel voice** with one command (in the PaperFold Studio folder, or the installed skill folder):
   ```bash
   python3 tools/voicebox.py setup
   ```
   The first time, this downloads the Kokoro model (about 300 MB) and creates the voice profile named in `brand/brand.json → voice` (default: `Maple Street English - Narrator`, voice `am_liam`). You can also download Kokoro by hand in Voicebox → **Models**.
4. Check:
   ```bash
   python3 tools/voicebox.py profiles
   ```

Kokoro voices are Apache-2.0 licensed, so they are safe on monetised channels. The voice-over is generated one sentence at a time and joined with a fixed pause, which makes caption timing exact.

## 7. Install the skill

In a terminal **in the PaperFold Studio folder**:

| Use it in | Command | Installed to |
|---|---|---|
| **Google Antigravity**, all workspaces | `python3 tools/package.py channel maplestreet --install antigravity` | `~/.gemini/config/skills/maplestreet-studio` |
| Antigravity, one workspace | `python3 tools/package.py channel maplestreet --install workspace --workspace /path/to/workspace` | `<workspace>/.agents/skills/maplestreet-studio` |
| **Claude Code** | `python3 tools/package.py channel maplestreet --install claude` | `~/.claude/skills/maplestreet-studio` |
| **Claude.ai** (web/desktop) | `python3 tools/package.py channel maplestreet --zip` | `dist/maplestreet-studio.skill + maplestreet-scriptwriter.skill` → upload in Settings → Capabilities → Skills |

- **Channel skill pairs** (`channels/`) can also be installed into Tencent CodeBuddy (`~/.codebuddy/skills`), Tencent WorkBuddy AI (`~/.workbuddy-ai/skills`) and the shared Agent Skills folder `~/.agents/skills` (Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode, ...): `python3 tools/package.py channel <id> --install all`. See `channels/README.md`, section 2.
- In Antigravity the skill is the slash command **`/maplestreet-studio`** (no separate workflow file needed). Start a new conversation after installing.
- **Updating:** run the same command again. The installed `brand/` folder is kept, so your settings survive. To push new brand settings from the source folder, copy `brand/brand.json` into the installed folder yourself.
- **Claude.ai** runs in a cloud sandbox: it needs Node 22+ and Chromium there and cannot reach Voicebox on your computer, so give it a voice file. Use Antigravity or Claude Code for the full workflow.
- Remove older skills that do a similar job, so the agent does not pick the wrong one.

## 8. First-time setup: your channel

Do this once; it is what makes your videos different from everyone else's. All settings are in `brand/brand.json` **of the installed skill** (full key list in [`brand/README.md`](../brand/README.md)).

| Section | What to set |
|---|---|
| `channel`, `handle`, `initials`, `color`, `color2` | Channel name, @handle, letters for the auto-logo, brand colours |
| `theme` | Default look: `ink` or a paper theme |
| `seed` | **Your own random number**: changes decorations and the music melody |
| `mascot` | Character colours (`hoodie`; per-character looks in `voice.cast`) |
| `watermark` | How the watermark moves, opacity, size, faint @handle, caption tag |
| `outro`, `music` | End-screen text, music style (`auto`, `lofi`, `playful`, `calm`, `curious`) |
| `voice` | Channel voice (set with `voicebox.py use`, section 9) |
| `youtube` | Category, audience, playlists, hashtags, footer, disclaimer, upload times, posting rules, language of `UPLOAD.md` (`id`/`en`) |
| `logo`, `tagline` | Logo colours and the banner tagline |

Then make the logo and channel images:
```bash
python3 tools/logo.py
```
It writes `brand/logo.png` (used in videos), `logo-wordmark.png`, `youtube-profile.png` (800×800), `youtube-banner.png` (2560×1440) and `youtube-watermark.png` (150×150, for YouTube Studio → Customization → Branding). You may use your own `brand/logo.png` instead.

Pick one theme and keep it: a consistent look is how viewers recognise a channel.

## 9. Choose the channel voice

```bash
python3 tools/voicebox.py voices                                  # list Kokoro voices
python3 tools/voicebox.py audition --voices am_puck,af_heart,am_michael --script script.txt
python3 tools/voicebox.py use am_puck                             # make it the channel voice
```

- `voices` lists every voice id. `a` = American, `b` = British, `f` = female, `m` = male (`af_heart` = American female "Heart").
- `audition` reads the first sentences of your script with each voice and saves one mp3 per voice in `voice-samples/`. Temporary profiles are removed afterwards.
- `use` saves the voice in `brand.json → voice` and creates the Voicebox profile. Every new video uses it.

Listen especially to how numbers are spoken. Keep one voice for the whole channel: it becomes the channel's "host".

## 10. Make a video with an AI agent

1. Open your project folder (workspace) in Antigravity or Claude Code. Open the Voicebox app.
2. Ask, for example:
   - **You have a script:** `/maplestreet-studio make a Shorts video from script.txt`
   - **With your own voice file:** `/maplestreet-studio make a 16:9 video from script.txt with voice.mp3`
   - **Only a topic:** `/maplestreet-studio make a 16:9 episode from videos/first-breakfast/script.txt`
3. With only a topic, the agent writes a script using the built-in guide and `calc` for every number, **shows it to you and waits for your OK**. Approve it or ask for changes.
4. The agent then makes the voice, writes the storyboard and the publish texts, runs `make`, checks the preview and the thumbnails, and tells you where the publish folder is.

Everything for one video stays in **one folder per topic**, named after the topic (`videos/subscription-creep`; a new version is `videos/subscription-creep-v2`). Generic names like `v3` or `test`, and scripts saved next to the folder, are refused by the tool:

```
videos/my-topic/
  script.txt        the script (edit this one)
  input/            the voice-over and the exact script it was made from
  lines.md          numbered sentences with times
  storyboard.json   scenes
  publish.json      titles, description, pinned comment, thumbnail text
  build/            working files (preview.jpg)
  out/              the rendered MP4
  publish/          ← everything you upload (see section 12)
```

To change something, say e.g. "scene 4 should use a budget panel" or "make the title shorter". The agent edits and runs `make` again; the voice is reused, so it is quick.

### Example requests

Write them in any language. The agent maps your words to the settings below.

**Format.** No format mentioned = Shorts (9:16).

| You say | Result |
|---|---|
| "Shorts", "vertical", "Reels", "TikTok", "9:16" | `--format shorts` (1080×1920) |
| "16:9", "horizontal", "landscape", "long video", "normal YouTube video" | `--format long` (1920×1080) |

**Starting a video**
```
/maplestreet-studio make a Shorts video from script.txt
/maplestreet-studio make a 16:9 video from script.txt
/maplestreet-studio make a Shorts video from script.txt with voice.mp3
/maplestreet-studio make a 16:9 episode from videos/first-breakfast/script.txt
/maplestreet-studio make a 6-minute 16:9 video about paying off credit card debt
/maplestreet-studio make a Short about compound interest, theme kraft
/maplestreet-studio make a Short about the 50/30/20 budget, just make it (no questions)
```

**Both formats from one topic** (two projects; the long script has 3-5 chapters and the Short is a teaser of one chapter)
```
/maplestreet-studio make a 16:9 video and a Shorts version about emergency funds
```

**Script stage** (topic mode)
```
make the hook stronger
shorter, under 45 seconds
use $2,500 a month instead of $3,200
add a line about high-yield savings accounts
OK, the script is approved
```

**After the first version**
```
scene 4 should be a budget panel
use the phone scene for the opening
the label "Everything else" is too long, change it to "Other"
make the title shorter and add a question
use scene 7 for the thumbnail with the text "$21,000 for free?"
change the pinned comment to ask about their savings rate
re-render as 16:9
```

**Voice and channel**
```
list the available voices
make samples with am_puck, af_heart and am_michael from script.txt
use af_heart as the channel voice
change the watermark to stay in the top-right corner
make the logo and YouTube banner again
```

The agent never uploads anything; the result is always the `publish/` folder.

## 11. Make a video with one command (no AI)

```bash
python3 tools/pf.py make videos/my-topic --script script.txt
```
Options: `--format long` (16:9), `--voice voice.mp3` (your own voice file), `--theme kraft`, `--music song.mp3`.

Common variations:
```bash
python3 tools/pf.py make videos/emergency-fund --script script.txt                          # Shorts, Voicebox voice
python3 tools/pf.py make videos/emergency-fund-long --script script-long.txt --format long  # 16:9
python3 tools/pf.py make videos/my-topic --script script.txt --voice voice.mp3              # your own voice file
python3 tools/pf.py make videos/my-topic --script script.txt --theme kraft --music song.mp3
python3 tools/pf.py make videos/my-topic                    # after editing script.txt, storyboard.json or publish.json (voice reused unless script.txt changed)
python3 tools/pf.py make videos/my-topic --script script.txt --force   # remake the voice and a new automatic draft storyboard
python3 tools/pf.py publish videos/my-topic                 # only rebuild the publish folder (after editing publish.json)
```

The script is copied to `videos/my-topic/script.txt`, so everything for the video stays in that folder. Next time you can just edit that file and run `python3 tools/pf.py make videos/my-topic` (it notices the change and remakes the voice).

`make` runs everything: voice (Voicebox) → timing → automatic draft storyboard → check → preview → render → publish folder. Without an AI the storyboard and publish texts are automatic drafts. They work, but hand-written ones (or AI-written ones) look better: edit `storyboard.json` and `publish.json`, then run `make videos/my-topic` again.

Run from your workspace with the installed skill: replace `tools/pf.py` with the full path, e.g. `python3 ~/.gemini/config/skills/maplestreet-studio/tools/pf.py make ...`.

## 12. The publish folder and uploading

`videos/<name>/publish/` contains:

| File | Use |
|---|---|
| `<name>.mp4` | the video |
| `cover-9x16.jpg` (+`-2`, `-3`) | Shorts: cover / frame reference; also for TikTok and Reels |
| `thumbnail.jpg` (+`-2`, `-3`) | Long videos: 1280×720 thumbnail; extras for YouTube's Test & compare |
| `title.txt` | 3 title options |
| `description.txt` | full description: text, math/source, channel footer, disclaimer, hashtags |
| `pinned-comment.txt` | the first comment to post and pin |
| `UPLOAD.md` | step-by-step: what to check, every upload setting, and upload times converted to your time zone (daylight saving included) |

Open `UPLOAD.md` and follow it. Notes:
- YouTube does not accept a custom image for Shorts on desktop; `UPLOAD.md` gives the exact second of the cover frame to pick in the YouTube phone app.
- PaperFold Studio never uploads anything itself. You stay in control of your channel.
- Always watch the video once with sound before uploading.

## 13. The storyboard file

`lines.md` lists the numbered sentences. `storyboard.json` groups them into scenes:

```json
{
  "format": "shorts",
  "theme": "ink",
  "scenes": [
    { "lines": [1, 2], "type": "phone", "items": [
        { "icon": "paycheck", "title": "Payday", "text": "+$3,200", "at": "$3,200" },
        { "icon": "bank", "title": "Bank alert", "text": "Balance: $0.00", "at": "zero", "color": "#FF4D4D" } ] },
    { "lines": [3], "type": "meet", "title": "Meet Sam.", "subtitle": "24 · first job" },
    { "lines": [4], "type": "outro", "text": "New money story every week" }
  ]
}
```

Rules (`check` enforces them and explains every error):
- every line number used exactly once, in order; a scene's `lines` are consecutive;
- `type` is one of the 23 templates; icons come from the icon list (`python3 tools/pf.py catalog`);
- `"at"` is a word copied from that scene's sentences: the visual appears when it is spoken (never seconds);
- no `start`, `end` or `t` keys (calculated);
- optional `"tint": "alert" | "calm" | "happy" | "sad"` per scene, `"transition": "fold" | "slide" | "torn" | "ink"` at the top.

Every scene type with an example: [`reference/STORYBOARD.md`](reference/STORYBOARD.md). Publish texts: [`reference/PUBLISH.md`](reference/PUBLISH.md). Full examples: `reference/example-ink-storyboard.json`.
Own icon: put a PNG/SVG in `brand/icons/` or `videos/<name>/images/` and use `"icon": "img:file.png"`.

## 14. Writing scripts

Bring your own script, or let the agent write one from a topic using the maplestreet-scriptwriter skill. Either way:

- **One sentence = one idea**, about 20 words max. End with `.` `?` or `!`; a new line also starts a new sentence.
- **Hook in the first 2 seconds:** the problem or a surprising number, not an introduction.
- **Numbers as digits** (`$3,200`, `10%`); check them with `calc`:
  ```bash
  python3 tools/pf.py calc save --monthly 320 --rate 4 --years 5
  python3 tools/pf.py calc loan --amount 2000 --rate 24 --months 12
  python3 tools/pf.py calc percent 10 3200
  ```
- **Length:** Shorts 35-55 seconds (90-140 words); long videos 5-8 minutes.
- **Facts:** the tools never change your script. For money or health topics, every number needs a source or a calculation, and the description includes a disclaimer automatically.
- **Your own voice file?** Leave a clear pause between sentences (Voicebox does this automatically).

## 15. Command reference

Run any command with `-h` for details. Paths are relative to the PaperFold Studio (or installed skill) folder.

**`tools/pf.py`**

| Command | What it does |
|---|---|
| `doctor` | Checks Python, numpy, Node, ffmpeg, the browser and Voicebox |
| `catalog` | Lists scene types (with fields) and icon names |
| `make PROJECT [--script FILE] [--voice FILE] [--format shorts\|long] [--theme T] [--music FILE] [--no-preview] [--force] [--accept-warnings]` | **All-in-one**: init (when the script is new or changed) → check → preview → render → publish. Stops before rendering while `MUST FIX` items remain |
| `init PROJECT --script FILE [--voice FILE] [--format ...] [--theme T] [--music FILE] [--force]` | Voice (Voicebox when no `--voice`), timing, `lines.md`, draft `storyboard.json` (kept if it exists, unless `--force`) |
| `check PROJECT` | Validates the storyboard and the video quality. Prints errors, `MUST FIX` items (these block render/publish) and warnings, then `OK` or `NOT READY` |
| `preview PROJECT` | One picture per scene → `build/preview.jpg` |
| `render PROJECT [--cpu eco\|balanced\|max\|N] [--workers N] [--accept-warnings]` | Renders the MP4 into `out/`; `--cpu` limits processor use (see below) |
| `publish PROJECT [--accept-warnings]` | Builds `publish/` from `publish.json` (writes a draft if missing) |
| `calc save --monthly M --rate R --years Y [--start S]` | Savings growth, compounded monthly |
| `calc loan --amount A --rate R --months N` | Loan / credit card payment and total interest |
| `calc percent P OF` · `calc share PART WHOLE` | Percent of a number · what percent a part is |

### Quality features (automatic)

| Feature | What it does | Setting |
|---|---|---|
| Sharper output | renders 1440p (1440×2560 / 2560×1440) so YouTube keeps lines and text crisp | `brand.json → render.resolution` (`1080p`, `1440p`, `2160p`) or `--resolution` |
| Voice polish | rumble filter, warmth, presence, de-esser and light compression on the voice-over | `brand.json → voice_polish` (true/false) |
| Music | stereo width + reverb on the generated music; your own tracks in `assets/music/` rotate per video and loop with crossfades | `brand.json → music` |
| Motion | slow camera push/pull on every scene, squash & stretch on pop-ins, the character's mouth follows the loudness of the voice | always on |
| Timing | word timing weighted by spoken syllables ("$3,200" = "three thousand two hundred dollars") | always on |
| Pronunciation check | transcribes the voice-over and flags numbers that were not said as written (MUST FIX) | also checks that the channel name is heard; fix names with `brand.json → voice.pronounce` (`{"Haddad": "ha-dad"}`: captions keep the spelling). Needs a Whisper model: Voicebox → Models → Whisper (base or small), or `whisper-cli` with `PF_WHISPER_MODEL` (also gives exact word timing). Run by `init`; or `python3 tools/speech.py check videos/<topic>` |
| Final QA | frozen picture over 3 s, black frames, loudness (−14 LUFS), peaks, frame count; shown after rendering and in `UPLOAD.md` | always on |
| 16:9 extras | YouTube chapters from `"chapter"` in the storyboard; 8 s outro for end-screen elements | storyboard |
| Phone check | `phone-preview-*.png` shows the thumbnail at feed size | always on |

### CPU use

Rendering draws every frame in headless Chrome and encodes it with ffmpeg; by default it leaves room for your other apps:

| `--cpu` | What it does | Example (8-core Mac, 53 s Short) |
|---|---|---|
| `balanced` (default) | low priority + about half the processor | ~62 s render, ~285% CPU on average |
| `eco` | low priority + about a quarter of the processor (paused/resumed in short slices) | ~113 s, ~135% |
| `max` | everything, normal priority (fastest when the computer is idle) | ~45-54 s, ~350-400% |
| a number, e.g. `30` | roughly that percent | |

Use it on `make` or `render` (`python3 tools/pf.py make videos/<topic> --cpu eco`), or set it once for every run with the environment variable `PF_CPU=eco` (e.g. in `~/.zshrc`). On Windows only the priority is lowered (no pause/resume). The Voicebox app uses about one core while it makes the voice-over.

**`tools/voicebox.py`**

| Command | What it does |
|---|---|
| `setup` | Downloads the model if needed and creates the channel voice profile |
| `voices [--engine kokoro]` | Lists the preset voices |
| `audition --voices a,b,c [--script FILE] [--out DIR]` | One sample mp3 per voice |
| `use VOICE_ID [--name NAME]` | Sets the channel voice in `brand.json` and creates its profile |
| `profiles` | Lists voice profiles in Voicebox |
| `make --script FILE --out FILE [--profile NAME] [--gap SEC] [--seed N]` | Makes a voice-over by itself |

**`tools/logo.py`**: logo, profile picture, banner and YouTube watermark from `brand.json`.
**`tools/package.py channel maplestreet [--install TARGET] [--zip]`**: builds or installs the skill.

Environment variables: `PF_CHROME` (browser path if not found), `VOICEBOX_URL` (if Voicebox is not on `http://127.0.0.1:17493`).

## 16. Troubleshooting

| Message or symptom | Fix |
|---|---|
| `numpy is missing` | `python3 -m pip install numpy` |
| `OLD node` / `need 22+` | Install Node.js 22 or newer |
| `MISSING browser` / `Chrome/Edge/Chromium not found` | Install Chrome, or set `PF_CHROME=/path/to/chrome` |
| `Voicebox not running` / `cannot reach Voicebox` | Open the Voicebox app, or pass `--voice your-file.mp3`, or set `VOICEBOX_URL` |
| `download of "kokoro" stopped` | Open Voicebox → Models and download Kokoro there, then `voicebox.py setup` |
| `profile "..." not found` | `python3 tools/voicebox.py setup` |
| `WARNING: found only N pauses for M sentences` | Your voice file has too few pauses between sentences, so timing is estimated. Use Voicebox or re-export with clearer pauses |
| `STORYBOARD HAS ERRORS` / `publish.json HAS ERRORS` | Fix exactly what each line says, then run the command again |
| `MUST FIX: ...` / `NOT READY` / `STOPPED before rendering` | A quality problem that would make a weak video (empty first second, a scene over 12 s, cents read aloud, a number the narrator never says, unreadable text colour). Fix it in `script.txt` or `storyboard.json`. To publish anyway, add `--accept-warnings` yourself |
| `folder name "v3" does not say what the video is about` | Name the folder after the topic: `videos/subscription-creep`, and `videos/subscription-creep-v3` for a new version |
| `... is saved outside its topic folder` / `found videos/NAME-script.txt outside the topic folder` | Keep the script only as `videos/NAME/script.txt`: move it there (or delete the duplicate) |
| `... is not valid JSON: line X col Y` | Missing comma, quote or bracket at that position |
| `at="..." not found in its lines` (warning) | Use a word that really appears in that scene's sentences |
| `... not found. Run render first.` | Run `make` (or `render`) before `publish` |
| Number spoken wrongly | Write it differently in the script (e.g. `3,200 dollars`) or choose another voice |
| Something overlaps in the preview or thumbnail | Shorter text, fewer items, another scene type, or another thumbnail scene |
| Render is slow | Use `--cpu max` when you are not using the computer; close heavy apps |
| The computer gets slow / fans loud while rendering | `--cpu eco` (or `export PF_CPU=eco` once) |
| Agent picks the wrong skill | Type `/maplestreet-studio` explicitly, remove similar older skills |

## 17. Limitations

- Word timing for your own voice files is estimated from pauses (sentence timing is accurate). Voicebox voices give exact sentence timing.
- Scenes are templates: you change words, icons, colours and order, not the drawings themselves.
- Automatic drafts (no AI) are functional but plainer than AI-written or hand-written storyboards.
- The tools cannot judge audio quality: listen to every video once.
- Claude.ai's cloud sandbox may lack Node 22+/Chromium and cannot reach a local Voicebox.
- The generated music is simple; use your own royalty-free track for a richer sound.

## 18. Folder structure

```
README.md / README.id.md this guide
MONETISASI.md            YouTube growth and monetisation guide (Indonesian)
brand/                   brand.json, logo files, brand/icons/   ← your settings
themes/                  6 themes
engine/                  rendering engine (do not edit per video)
tools/pf.py              main tool (make, init, check, preview, render, publish, calc)
tools/voicebox.py        voices: setup, voices, audition, use, make
tools/logo.py            logo / banner / profile picture
tools/package.py         build and install the skill
reference/               STORYBOARD.md, PUBLISH.md, example storyboard
assets/fonts, assets/music
```

## 19. Licenses

- Fonts Fredoka, Nunito, Space Grotesk, Caveat: SIL Open Font License (`assets/fonts/OFL-LICENSE.txt`).
- Icons, characters, generated music and sound effects are made by code in this package.
- Voicebox is open source ([github.com/jamiepine/voicebox](https://github.com/jamiepine/voicebox)); Kokoro voices are Apache-2.0. Check the licence of any other voice before publishing.
- Do not clone anyone's voice without their permission.
