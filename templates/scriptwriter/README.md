# {{script_skill}}

**Scripts for the YouTube channel {{name}} ({{handle}}): {{niche}}, starring {{character}}.**

[Bahasa Indonesia → README.id.md](README.id.md)

This skill writes the **words** of a video: the script and a publish brief. It never makes audio or video. The video is made afterwards with **{{studio_skill}}**.

| Skill | Job | Best model |
|---|---|---|
| **{{script_skill}}** (this one) | script + brief (titles, thumbnail text, description, pinned comment, scene plan) | a strong model: the script decides whether people keep watching |
| **{{studio_skill}}** | voice-over, storyboard, render, upload folder | a cheap model is fine |

---

## 1. What is inside

| File | Purpose |
|---|---|
| `SKILL.md` | the steps and rules the AI follows |
| `CHANNEL.md` | the channel bible: audience, voice and tone, **the cast and places**, series and episodes so far, default numbers, the never-list, title/thumbnail/pinned-comment style |
| `SCRIPT-GUIDE.md` | structure for Shorts and 16:9, the scene types the studio can show, the self-check list |
| `BRIEF.md` | the `brief.json` format |
| `examples/` | a finished script and brief |

## 2. Where it works

- **Google Antigravity / Claude Code:** it can read your `videos/` folder (to avoid repeating topics) and saves `videos/<topic>/script.txt` + `videos/<topic>/brief.json` directly.
- **Claude.ai or another chat app:** it outputs the two files as code blocks; save them yourself into `videos/<topic>/`. 

## 3. Install or update

Built from the PaperFold Studio source folder together with {{studio_skill}}.

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

## 4. Example requests

```
/{{script_skill}} write episode 3 from the season plan: Where's the post office?
/{{script_skill}} write an episode at the pharmacy (A2): feeling sick, should
/{{script_skill}} write a Shorts: Don't say "I am agree" — say this
/{{script_skill}} give me 5 episode ideas for season 2
/{{script_skill}} polish my script in draft.txt (keep the phrases)
```
Revisions while you review: "simpler words", "add one more phrase", "make Grace funnier", "OK, approved".

## 5. What you get

```
videos/<topic>/script.txt   speaker tags + segments, ends with the channel CTA
videos/<topic>/brief.json   3 titles (one marked recommended, with a reason), target phrases, description, pinned comment,
                            1-3 thumbnail texts, scene plan (which scene shows which lines)
```
Then the agent gives you the next prompt:
```
/{{studio_skill}} make a 16:9 video from videos/<topic>/script.txt
```

## 6. The rules it follows

- Reads `CHANNEL.md` first; never contradicts the cast and places.
- One sentence per line; hook in the first line; one action for the viewer; channel CTA last.
- Every line has a speaker tag (`MIA:`) and a segment (`[STORY]`); words fit the level; no translations; praise after every REPEAT pause.
- Never: invented facts, brand names, stock/crypto picks, guarantees, shaming (full list in `CHANNEL.md`).
- Shows you the script and waits for your OK before saving it as final.

## 7. Updating the channel bible

Edit `channels/{{id}}/CHANNEL.md` in the source folder (new episodes in the episode table, a changed canon, new default numbers), then build and install again (section 3). Keeping the episode table current is what keeps {{character}}'s story consistent.

