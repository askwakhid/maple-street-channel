# brief.json

The brief travels with the script to **{{studio_skill}}**. The studio copies titles, description, hashtags, tags and pinned comment into the YouTube publish kit as they are, uses `thumbnails` for the cover/thumbnail images, and uses `scene_plan` as a strong hint for the storyboard.

Save it as `videos/<topic>/brief.json`, next to `videos/<topic>/script.txt`. A complete example is in `examples/first-breakfast/brief.json`.

```json
{
  "format": "long",
  "topic": "first-breakfast",
  "episode": 2,
  "level": "A2",
  "place": "bakery",
  "cast": ["MIA", "WALTER", "GRACE", "NARRATOR"],
  "target_phrases": ["Can I get a coffee, please?", "For here or to go?", "Here you go"],
  "titles": [
    "Ordering at a Bakery in English | Real Conversation (A2)",
    "Don't Say 'Give me a coffee' — Say This Instead (A2)",
    "How to Order Breakfast in English | Maple Street Ep. 2"
  ],
  "recommended_title": 1,
  "title_reason": "Names the situation learners search for and the level.",
  "description": "2-3 sentences: the situation and what the viewer learns.\n\nPhrases in this episode: ...",
  "hashtags": [],
  "tags": ["ordering food in english", "english conversation a2"],
  "pinned_comment": "What would you order at Brooks Bakery? Write a full sentence 👇",
  "thumbnails": [
    {"text": "Order Like a Local", "highlight": "Local", "scene_hint": "dialogue"}
  ],
  "scene_plan": [
    {"lines": [1, 2], "type": "dialogue", "cast": ["MIA", "GRACE"], "place": "bakery", "idea": "Mia unsure at the counter; Grace laughs"},
    {"lines": [3], "type": "location", "place": "bakery", "idea": "street, fly to No. 1, title + A2 badge"}
  ]
}
```

| Field | Required | Rules |
|---|---|---|
| `format` | yes | `long` or `shorts` |
| `topic` | yes | the folder name (`videos/<topic>/`) |
| `episode`, `level`, `place`, `cast` | yes | episode number (Shorts: the episode it comes from, or 0), CEFR level, a place key from `CHANNEL.md` (`bakery`, `busstop`, `pharmacy`, `millers`, `cornershop`, `junes`, `street`), the speakers used |
| `target_phrases` | yes | the 5-8 phrases taught (Shorts: 1-2), exactly as said in the script |
| `titles` | yes | 3 options, each max ~70 characters, honest, with the level in brackets |
| `recommended_title` | yes | 1, 2 or 3 |
| `title_reason` | yes | one sentence: who it speaks to and why it gets clicked. No invented numbers |
| `description` | yes | your text plus the list of target phrases. No hashtags, footer or disclaimer: the studio adds those |
| `hashtags`, `tags` | no | extra hashtags (`#shorts` for Shorts) and 2-4 search tags |
| `pinned_comment` | yes | a practice question the viewer answers in English, ending with 👇 |
| `thumbnails` | yes | 1-3 items: `text` (2-5 big words), `highlight` (one word of the text), `scene_hint` |
| `chapters` | 16:9 | `{"line": N, "title": "..."}` for the story, phrases, slow story, your turn, quiz |
| `scene_plan` | recommended | covers every line once, in order; `type` from SCRIPT-GUIDE.md; `dialogue`/`repeat` scenes add `cast` and `place`; `idea` = what is on screen. Last scene = `outro` |
