# storyboard.json reference

Shape of the file:

```json
{
  "format": "shorts",
  "theme": "meadow",
  "scenes": [
    { "lines": [1], "type": "hook", "icon": "smoke", "at": "dirty", "text": "Just dirty?" },
    { "lines": [2, 3], "type": "icons", "items": [ { "icon": "eye", "label": "Eyes", "at": "eyes" } ] }
  ]
}
```

- `format`: `shorts` (1080x1920) or `long` (1920x1080).
- `theme`: `ink` (stick-figure story style, character Sam), or paper styles `meadow`, `kraft`, `midnight`, `notebook`, `candy`. Leave out to use the brand default.
- `transition` defaults to the theme's own (`ink` uses sweeping colour bands).
- `transition` (optional, top level): `fold`, `slide`, `torn`.
- Each scene needs `lines` (consecutive line numbers from lines.md) and `type`.
- `at` is always ONE word (or short phrase) copied from that scene's lines. Never seconds.
- Optional on every scene: `"tint": "alert" | "calm" | "happy" | "sad"`.
- Never write `start`, `end` or `t` in a scene. They are filled in automatically.
- 16:9 videos: add `"chapter": "Title"` to the first scene of each chapter. The publish kit turns them into YouTube chapters (needs 3+ chapters of 10 s or more).

## Scene types, copy-paste examples

**hook** - first scene. Mascot wonders; icon in a thought bubble; `at` = moment of surprise.
```json
{ "lines": [1], "type": "hook", "icon": "egg", "at": "first", "text": "Egg or chicken?" }
```

**title** - big title card.
```json
{ "lines": [2], "type": "title", "title": "Why do we dream?", "subtitle": "Science explained", "icon": "sleep" }
```

**icons** - 1 to 4 icons with labels. The all-rounder.
```json
{ "lines": [3], "type": "icons", "title": "Most at risk", "items": [
  { "icon": "child", "label": "Kids", "at": "children" },
  { "icon": "elder", "label": "Elderly", "at": "elderly" },
  { "icon": "pregnant", "label": "Pregnant", "at": "pregnant" } ] }
```

**list** - up to 5 rows of tips. `"style": "number"` adds numbers.
```json
{ "lines": [4, 5], "type": "list", "title": "Protect yourself", "items": [
  { "icon": "house", "text": "Stay indoors", "at": "indoors" },
  { "icon": "window", "text": "Close windows", "at": "close" },
  { "icon": "mask", "text": "Wear an N95", "at": "mask" } ] }
```

**versus** - A vs B. `winner` optional.
```json
{ "lines": [6], "type": "versus", "left": { "icon": "coins", "label": "Saving", "at": "saving" },
  "right": { "icon": "chart", "label": "Investing", "at": "investing" }, "winner": "right" }
```

**myth** / **fact** - stamp lands on the `at` word. `stamp` = custom word (e.g. "MITOS", "FAKTA").
```json
{ "lines": [7], "type": "myth", "icon": "brain", "label": "We use 10% of our brain", "at": "false", "stamp": "MYTH" }
```

**number** - counting statistic.
```json
{ "lines": [8], "type": "number", "value": "8", "suffix": " hrs", "label": "of sleep per night", "icon": "sleep", "at": "eight" }
```

**steps** - 2 to 4 numbered steps with arrows.
```json
{ "lines": [9], "type": "steps", "items": [
  { "icon": "soap", "label": "Soap", "at": "soap" },
  { "icon": "water", "label": "Rinse", "at": "rinse" },
  { "icon": "check", "label": "Dry", "at": "dry" } ] }
```

**cycle** - 3 to 5 items around a circle; `runner` icon travels round.
```json
{ "lines": [10], "type": "cycle", "runner": "drop", "items": [
  { "icon": "sun", "label": "Evaporate", "at": "heats" },
  { "icon": "cloud", "label": "Condense", "at": "clouds" },
  { "icon": "rain", "label": "Rain", "at": "rain" } ] }
```

**talk** - mascot says a short line. pose: `point wave cheer shrug think idle`; mood: `happy shock sad think`.
```json
{ "lines": [11], "type": "talk", "text": "So what really happens?", "icon": "question", "pose": "shrug", "mood": "think" }
```

**warning** - danger / important.
```json
{ "lines": [12], "type": "warning", "icon": "hospital", "label": "Can't breathe? Get help!" }
```

**zoom** - magnifier reveals `detail` inside `icon`.
```json
{ "lines": [13], "type": "zoom", "icon": "lungs", "detail": "virus", "label": "Tiny particles", "at": "particles" }
```

**chart** - bar chart (up to 6 bars).
```json
{ "lines": [14], "type": "chart", "title": "Screen time", "suffix": "h", "items": [
  { "label": "2010", "value": 2, "at": "2010" }, { "label": "2024", "value": 7, "at": "today" } ] }
```

**timeline** - up to 5 moments in time.
```json
{ "lines": [15], "type": "timeline", "items": [
  { "icon": "egg", "label": "Egg", "at": "egg" }, { "icon": "bird", "label": "Chick", "at": "chick" } ] }
```

**cause** - cause -> effect.
```json
{ "lines": [16], "type": "cause", "from": { "icon": "smoke", "label": "Smoke", "at": "smoke" },
  "to": { "icon": "heart", "label": "Heart risk", "at": "heart" } }
```

**bigtext** - big words, one highlighted.
```json
{ "lines": [17], "type": "bigtext", "text": "Clean air is for everyone", "highlight": "everyone" }
```

**image** - your own picture (file in PROJECT/images/).
```json
{ "lines": [18], "type": "image", "image": "photo.png", "label": "Real photo" }
```

**outro** - last scene: logo, channel name, subscribe click, mascot waves.
```json
{ "lines": [19, 20], "type": "outro", "text": "Share this with a friend!" }
```

## Story / money scenes (best with theme `ink`)

**meet** - introduce the character. Up to 3 fact chips.
```json
{ "lines": [1, 2], "type": "meet", "title": "Meet Sam.", "subtitle": "24 · first job · big city", "pose": "wave", "items": [
  { "icon": "person", "label": "24 years old", "at": "24" },
  { "icon": "paycheck", "label": "$3,200 / month", "at": "$3,200" } ] }
```

**budget** - where the money goes. Rows fill as spoken; red `left` stamp lands on `at`.
```json
{ "lines": [4, 5, 6], "type": "budget", "total": "$3,200", "left": "$0", "at": "had", "note": "where did it go??", "items": [
  { "label": "Rent", "value": 1600, "at": "rent" },
  { "label": "Food", "value": 520, "at": "food" },
  { "label": "Subscriptions", "value": 310, "at": "subscriptions" } ] }
```

**growth** - compound growth line from `start_value` (default 0) to `value`; finishes near the end of the scene.
```json
{ "lines": [13], "type": "growth", "value": 23000, "label": "$320/mo · 7% · 5 years", "years": "5 years", "at": "$320", "note": "on autopilot!" }
```

**phone** - notifications drop onto a big phone. `color` optional per notification.
```json
{ "lines": [3], "type": "phone", "note": "every. single. month.", "items": [
  { "icon": "bank", "title": "Bank alert", "text": "Balance: $0.00", "at": "bank", "color": "#FF4D4D" } ] }
```

In theme `ink`, `talk`/`hook`/`timeline` show Sam. Extra poses for Sam: `phone` (holding a phone), `facepalm`, `thumbsup`, `present` (open hand towards the content); extra moods: `smug`, `excited` (star eyes, big smile), `worried` (sweat drop).
`note` (handwritten arrow note) works on meet, budget, growth, phone.

## Multi-character scenes (channels with `voice.cast` in brand.json, e.g. Maple Street)

Script lines look like `MIA: Can I get a coffee, please?` under segment markers like `[STORY]`. One speaker turn = one line in lines.md. Cast names and place keys come from brand.json (`voice.cast`, `places`).

**dialogue** - 1-3 characters inside a place; whoever speaks the current line talks, gestures and gets the speech bubble. Up to ~20 s, so 3-6 lines of one conversation fit in one scene.
```json
{ "lines": [4, 5, 6, 7], "type": "dialogue", "cast": ["MIA", "WALTER"], "place": "bakery", "moods": {"WALTER": "excited"} }
```

**repeat** - speaking practice for the `[REPEAT]` segment. The first cast member says each phrase (slowed down), then in the silent pause the phrase stays on a card with a mic countdown ("Now you say it!") and a praise burst. A narrator line right after a pause (`NARRATOR: Great job!`) is shown as that praise; a line by another cast member (a question) becomes "Now you answer!". Up to ~30 s.
```json
{ "lines": [65, 66, 67, 68, 69, 70, 71], "type": "repeat", "cast": ["MIA"], "place": "bakery" }
```

**location** - the street; the camera zooms to the place, its name sign pops, then the episode card. Use for the title of an episode or a change of place.
```json
{ "lines": [3], "type": "location", "place": "bakery", "at": "Brooks", "title": "First breakfast", "subtitle": "Episode 2", "badge": "A2" }
```

## Icons

heart lungs brain eye mask virus pill hospital doctor thermometer drop fire smoke cloud rain sun moon snow tree leaf
forest mountain wave house window factory car globe money coins chart chart_down clock hourglass calendar lightbulb book rocket
phone laptop star check cross warning question exclaim lock shield person child elder pregnant family apple food water battery
gear megaphone trophy target egg fish cat dog bird plant sleep run muscle soap idea search chat share bell play
wallet card piggy receipt bank cart percent calculator cash coffee paycheck key briefcase subscription gift tag

Own icon: `"icon": "img:myicon.png"` (file in `brand/icons/` or `PROJECT/images/`).
