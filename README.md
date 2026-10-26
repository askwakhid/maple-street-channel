# Maple Street English

**An automated studio for an English-learning YouTube channel: a cute chibi sitcom on one street, every episode at a different house or shop.**

[Bahasa Indonesia → README.id.md](README.id.md)

![The Maple Street cast](channels/maplestreet/brand/cast-lineup.png)

From an episode idea to a ready-to-upload folder: multi-character dialogue scripts, a different voice for every character, animated scenes, captions with speaker names, a speaking-practice segment ("Your turn") with slower voices and praise, thumbnails, titles, description, chapters and a pinned comment.

## Contents

| Part | What |
|---|---|
| [`channels/maplestreet/CHANNEL.md`](channels/maplestreet/CHANNEL.md) | channel bible: audience, level, 8 characters, 7 places, episode format, Season 1 plan |
| [`channels/maplestreet/YOUTUBE-SETUP.md`](channels/maplestreet/YOUTUBE-SETUP.md) | setting up the channel in YouTube Studio (Indonesian) |
| [`MONETISASI.md`](MONETISASI.md) | monetization strategy and a 90-day plan (Indonesian) |
| `channels/maplestreet/brand/` | brand.json (colours, per-character voices and looks, places, YouTube settings) + logo, banner, profile picture, watermark |
| `channels/maplestreet/examples/first-breakfast/` | the full Episode 2: script, brief, storyboard |
| `engine/`, `tools/`, `themes/` | the render engine (based on PaperFold Studio) |
| [`docs/ENGINE.md`](docs/ENGINE.md) | full engine documentation (install, commands, troubleshooting) |

## Two skills

| Skill | Job | Model |
|---|---|---|
| **maplestreet-scriptwriter** | writes episode/Shorts scripts + a brief (target phrases, titles, description, scene plan) | a strong model |
| **maplestreet-studio** | voices, storyboard, render, thumbnail, upload folder | a cheap model is fine |

## Quick start

```bash
python3 -m pip install numpy
python3 tools/pf.py doctor                                       # ffmpeg, node, Chrome, Voicebox
python3 tools/package.py channel maplestreet --install claude    # or antigravity / all / --zip
```
Then, in a new conversation per video:
```
/maplestreet-scriptwriter write episode 3 from the season plan: Where's the post office?
/maplestreet-studio make a 16:9 video from videos/wheres-the-post-office/script.txt
```
The result is `videos/<topic>/publish/`; open `UPLOAD.md` there.

Script format, scenes (`dialogue`, `location`, `repeat`), the chibi style, the `maple` theme and the channel-art tools are described in [`README.id.md`](README.id.md) sections 4-7 and [`reference/STORYBOARD.md`](reference/STORYBOARD.md).

Channel art:
```bash
python3 tools/logo.py --brand channels/maplestreet/brand          # logo, wordmark, watermark
python3 tools/channel_art.py --brand channels/maplestreet/brand   # banner, profile picture, cast line-up (after logo.py)
```

Fonts in `assets/fonts/` are SIL OFL licensed. The engine comes from PaperFold Studio.
