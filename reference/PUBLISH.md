# publish.json reference

`python3 tools/pf.py publish videos/NAME` reads `videos/NAME/publish.json` and builds `videos/NAME/publish/`:

| File | What it is |
|---|---|
| `NAME.mp4` | the finished video |
| `cover-9x16.jpg` (+ `-2`, `-3`) | Shorts cover / TikTok / Reels cover, 1080x1920 |
| `thumbnail.jpg` (+ `-2`, `-3`) | long-video thumbnail, 1280x720 |
| `title.txt` | the title options |
| `description.txt` | full description (your text + channel footer + disclaimer + hashtags from brand.json) |
| `pinned-comment.txt` | first comment to post and pin |
| `UPLOAD.md` | step-by-step upload guide with all settings, the best upload times in your time zone, and a QA section (loudness, frozen picture, pronunciation) |
| `phone-preview-*.png` | the thumbnail/cover at phone-feed size: is the text still readable? |

If publish.json does not exist, `publish` writes a draft and still builds the folder; improve the draft and run it again.

## Example

```json
{
  "titles": [
    "$3,200 a month and still broke by the 25th?",
    "Why you're broke by the 25th",
    "The 10% rule that fixes payday"
  ],
  "description": "You make $3,200 a month... so why are you broke by the 25th? Meet Sam, and the one habit that fixes it: pay yourself first.\n\nThe math: $320/month for 5 years at ~4% APY, compounded monthly = about $21,200. Savings rates change. Investment returns are never guaranteed.",
  "hashtags": ["#shorts"],
  "tags": ["pay yourself first"],
  "pinned_comment": "Would you try the 10% rule? What % do you save right now?",
  "thumbnails": [
    {"scene": 1, "text": "Broke by the 25th?", "highlight": "25th"},
    {"scene": 3, "text": "Where did $3,200 go?", "highlight": "$3,200"}
  ]
}
```

| Field | Required | Rules |
|---|---|---|
| `recommended_title`, `title_reason` | recommended | which title to publish (1-3) and why; `UPLOAD.md` marks it ⭐ and scores every title with a transparent checklist |
| `titles` | yes | 1-3 strings. Max 100 characters (aim for 70 or less: longer titles are cut on phones). The video must answer what the title promises |
| `description` | yes | Your text only. Footer, disclaimer and the brand hashtags are added automatically. Total max 5000 characters |
| `pinned_comment` | yes | One short question |
| `thumbnails` | yes | 1-3 items. `scene` = scene number (1 = first scene in storyboard.json). `text` = 2-5 big words. `highlight` = one word from the text that gets the marker |
| `hashtags` | no | Extra hashtags for this video, added before the brand hashtags |
| `tags` | no | Extra tags for this video |

Channel-wide settings (category, audience, playlists, schedule, rules, footer, disclaimer, hashtags, guide language) live in `brand/brand.json -> youtube`. See `brand/README.md`.
