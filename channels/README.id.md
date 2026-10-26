# Channels: satu pasang skill per channel YouTube

[English → README.md](README.md)

Setiap folder di `channels/` mendeskripsikan **satu channel YouTube**. Dari folder itu, `tools/package.py` membangun dua skill yang sudah hafal channel tersebut:

| Skill | Dibangun dari | Tugas |
|---|---|---|
| `<channel>-scriptwriter` | `templates/scriptwriter/` + `CHANNEL.md` dan `examples/` milik channel | naskah + brief publish (pakai model kuat) |
| `<channel>-studio` | mesin PaperFold + `templates/studio/` + `brand/`, `CHANNEL.md`, dan `examples/` milik channel | suara, storyboard, render, folder upload (model murah sudah cukup) |

Channel yang ada sekarang: **maplestreet** (`channels/maplestreet/`). Titik awal untuk channel baru: `channels/_template/`.

---

## 1. Susunan folder

```
paperfold-studio/                 ← folder sumber (edit di sini, jangan di skill yang terpasang)
  engine/ tools/ themes/ assets/  ← mesin bersama semua channel (jangan diedit per channel)
  reference/                      ← referensi storyboard/publish bersama
  templates/
    studio/        SKILL.md README.md README.id.md          ← teks skill studio, dengan {{placeholder}}
    scriptwriter/  SKILL.md SCRIPT-GUIDE.md BRIEF.md calc.py README.md README.id.md
  channels/
    _template/     ← salin ini untuk channel baru
    maplestreet/
      channel.json   ← identitas + nama skill (mengisi {{placeholder}})
      CHANNEL.md     ← series bible: penonton, gaya bahasa, kanon tokoh, seri, angka, daftar larangan
      brand/         ← brand.json (tampilan, suara, watermark, pengaturan YouTube) + file logo
      examples/      ← satu contoh script.txt + brief.json (+ storyboard.json) yang ditiru AI
  dist/            ← hasil build (jangan diedit)
```

## 2. Build dan instalasi

```bash
python3 tools/package.py channel maplestreet                       # build ke dist/
python3 tools/package.py channel maplestreet --install antigravity # + pasang ke ~/.gemini/config/skills/
python3 tools/package.py channel maplestreet --install claude      # + pasang ke ~/.claude/skills/
python3 tools/package.py channel maplestreet --zip                 # + dist/<skill>.skill untuk Claude.ai
python3 tools/package.py channel --all --install antigravity     # semua channel (setelah mesin diperbarui)
```
Builder menolak membangun selama `channel.json`, `CHANNEL.md`, atau `brand/brand.json` masih berisi `CHANGE-ME`, atau ada template yang memakai `{{placeholder}}` yang tidak didefinisikan di `channel.json`.

Instalasi menimpa salinan yang terpasang. Kalau `brand/brand.json` yang terpasang berbeda dari sumbernya, file itu disimpan dulu sebagai `channels/<nama>/brand/brand.installed-<tanggal>.json`, jadi editan manual tidak pernah hilang diam-diam.

### Pasang di AI tool mana pun

Skill ini mengikuti format terbuka **Agent Skills** (folder berisi `SKILL.md` + file pendukung), jadi hasil build yang sama bisa dipakai di banyak AI tool. Jalankan dari folder sumber PaperFold Studio:

```bash
python3 tools/package.py channel <id> --install all           # Antigravity, Claude Code, CodeBuddy, WorkBuddy, ~/.agents
```

| AI tool | Target `--install` | Lokasi terpasang |
|---|---|---|
| Google Antigravity | `antigravity` | `~/.gemini/config/skills/` |
| Claude Code (CLI, desktop, VS Code/JetBrains) | `claude` | `~/.claude/skills/` |
| Tencent CodeBuddy (IDE, plugin, CLI) | `codebuddy` | `~/.codebuddy/skills/` |
| Tencent WorkBuddy AI (desktop app) | `workbuddy` | `~/.workbuddy-ai/skills/` |
| Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode, Cline, Amp, dan tool lain yang membaca folder bersama Agent Skills | `agents` | `~/.agents/skills/` |
| Semuanya sekaligus | `all` | |
| Satu project saja | `workspace`, `workspace-codebuddy`, `workspace-claude` + `--workspace PATH` | `PATH/.agents/skills/`, `PATH/.codebuddy/skills/`, `PATH/.claude/skills/` |
| Claude.ai (chat web/desktop) | `--zip`, lalu unggah `dist/<skill>.skill` | Settings → Capabilities → Skills |

Target bisa digabung: `--install antigravity,codebuddy`. Mulai percakapan baru (atau buka ulang IDE) setelah memasang supaya tool-nya melihat skill baru. Update = jalankan perintah yang sama lagi (setiap target berupa salinan, jadi perbarui semua yang Anda pakai).

**AI tool lain (cara universal).** Kalau sebuah tool tidak mendukung skill tapi bisa membaca file dan menjalankan perintah, arahkan langsung ke skill-nya:

```
Read ~/.agents/skills/<id>-studio/SKILL.md and follow it: make a Shorts video from videos/<topic>/script.txt
```

Atau taruh ini di file `AGENTS.md` di root workspace Anda (dibaca otomatis oleh banyak agent, misalnya Codex, Cursor, Copilot, Jules, Aider):

```markdown
## Skills for this project
- <channel> scripts: read ~/.agents/skills/<id>-scriptwriter/SKILL.md and follow it.
- <channel> videos: read ~/.agents/skills/<id>-studio/SKILL.md and follow it.
```
(Pasang dulu dengan `--install agents`, atau pakai path salinan terpasang lainnya.)

## 3. Meng-clone channel: langkah demi langkah

Contoh: channel baru **"Body Facts"** (sains tubuh manusia, tokoh "Mia", gaya paper).

### Langkah 1: salin template
```bash
cp -R channels/_template channels/bodyfacts
```
Nama folder = id channel: huruf kecil, angka, tanda hubung.

### Langkah 2: yang harus diubah (checklist)

| # | File | Yang diisi | Wajib |
|---|---|---|---|
| 1 | `channel.json` | `id` (= nama folder), `name`, `handle`, `language`, `niche`, `tagline`, `audience`, `style`, `theme`, `character`, `default_format` | ya |
| 2 | `channel.json` | `studio_skill` = `<id>-studio`, `script_skill` = `<id>-scriptwriter` (nama unik) | ya |
| 3 | `channel.json` | `studio_description`, `script_description`: masing-masing satu kalimat yang menjelaskan **apa** tugas skill dan **kapan** dipakai, menyebut nama channel dan niche (agent memakainya untuk memilih skill) | ya |
| 4 | `CHANNEL.md` | semua bagian: identitas, penonton, gaya bahasa, **kanon tokoh**, seri dan episode (boleh kosong dulu), pilar konten, angka/fakta default, daftar larangan, gaya judul/thumbnail/komentar pin | ya |
| 5 | `brand/brand.json` | `channel`, `handle`, `initials`, `color`, `color2`, `tagline`, `seed` (angka acak milik Anda) | ya |
| 6 | `brand/brand.json` | `theme`: `ink` (cerita stickman seperti Sam) atau tema paper `meadow`, `kraft`, `midnight`, `notebook`, `candy` (maskot Foldy) | ya |
| 7 | `brand/brand.json` | `mascot`: warna `hoodie` untuk ink; `body`, `scarf`, dst. untuk paper | disarankan |
| 8 | `brand/brand.json` | `outro` (teks CTA), `music` (`auto`, `lofi`, `playful`, `calm`, `curious`) | disarankan |
| 9 | `brand/brand.json` | `voice`: `profile` (nama baru, misalnya `bodyfacts - Heart`), `preset_voice_id` (ID suara Kokoro) | ya, kalau memakai Voicebox |
| 10 | `brand/brand.json` | `youtube`: `category`, `language`, `playlist_shorts`, `playlist_long`, `hashtags`, `tags`, `footer`, `disclaimer` (sesuaikan niche: kesehatan → "not medical advice"), `audience_timezone`, `schedule_local_times`, `my_timezone`, `rules`, `guide_language` | ya |
| 11 | `brand/brand.json` | `watermark` (default pindah tiap adegan), warna `logo` | opsional |
| 12 | `brand/*.png` | logo, banner, foto profil: buat otomatis (langkah 4) atau pakai `logo.png` sendiri | ya |
| 13 | `examples/` | minimal satu contoh: `<topik>/script.txt` (satu kalimat per baris) dan `<topik>/brief.json`; `storyboard.json` membantu studio | disarankan |

**Jangan diubah** (dipakai bersama semua channel): `engine/`, `tools/`, `themes/`, `assets/`, `reference/`, `templates/`. Ubah hanya kalau ingin memperbaiki semua channel sekaligus, lalu build ulang dengan `--all`.

### Langkah 3: tokoh
- **Tema ink:** tokoh digambar sebagai stickman berhoodie (warna `mascot.hoodie`). Nama, umur, dan kehidupannya hanya ada di `CHANNEL.md` (kanon) dan `channel.json` (`character`).
- **Tema paper:** maskotnya figur kertas terlipat; atur warna `mascot.body`, `scarf`, `cheek`. Beri nama dan kepribadian di `CHANNEL.md`.
- Simpan angka-angka tentang tokoh (penghasilan, umur, kota) di tabel kanon, supaya semua naskah konsisten.

### Langkah 4: suara dan logo
```bash
python3 tools/voicebox.py voices                                        # pilih ID suara
python3 tools/voicebox.py audition --voices af_heart,am_puck            # dengarkan di voice-samples/
python3 tools/voicebox.py --brand channels/<id>/brand use af_heart      # disimpan di brand.json channel
python3 tools/logo.py --brand channels/<id>/brand                       # logo, banner, foto profil
```
`use` menamai profil suara `<channel> - <Suara>` dan membuatnya di Voicebox. `logo.py` menulis file PNG ke `channels/<id>/brand/`.
(Atau taruh `logo.png` buatan sendiri, persegi dan transparan, di `channels/<id>/brand/`.)

### Langkah 5: build, pasang, uji
```bash
python3 tools/package.py channel <id> --install antigravity
```
Lalu, di percakapan baru pada workspace channel baru:
1. `python3 ~/.gemini/config/skills/<id>-studio/tools/voicebox.py setup` (membuat profil suara)
2. `/<id>-scriptwriter tulis naskah Shorts tentang <topik>`, lalu setujui
3. `/<id>-studio buat video Shorts dari videos/<topik>/script.txt`
4. Cek `videos/<topik>/publish/`: cover, warna, suara, watermark, teks outro.

### Langkah 6: rawat terus
- Tambahkan setiap episode yang sudah tayang ke tabel seri di `CHANNEL.md`, lalu build ulang.
- Jangan pernah mengedit skill yang terpasang secara langsung; edit `channels/<id>/` lalu build ulang.

## 4. Prompt untuk meminta AI meng-clone

Berikan ini ke Claude, Antigravity, atau agent lain, dengan folder PaperFold Studio sebagai workspace:

```
Baca channels/README.id.md dan channels/maplestreet/ sebagai contoh acuan.
Buat channel baru "<NAMA>" (id: <id>) dengan menyalin channels/_template ke channels/<id> lalu isi
setiap CHANGE-ME, mengikuti checklist di bagian 3, langkah 2.
Fakta channel:
- niche: <...>
- penonton: <...>
- bahasa: <...>
- gaya/tema: <ink atau tema paper>
- tokoh: <nama, umur, situasi, kepribadian>
- gaya bahasa: <...>
- larangan: <topik/klaim yang dihindari>
- disclaimer: <...>
- suara: <ID suara Kokoro, atau "pilihkan dan biarkan saya mendengarkan">
- YouTube: kategori <...>, playlist <...>, hashtag <...>, zona waktu penonton <...>, zona waktu saya <...>
Jangan ubah engine/, tools/, themes/, assets/, reference/, atau templates/.
Lalu buat file logo, build dengan: python3 tools/package.py channel <id>,
dan tunjukkan file SKILL.md hasil build dan CHANNEL.md untuk saya tinjau sebelum dipasang.
```

## 5. Menghapus skill channel

Hapus (atau pindahkan ke folder arsip) `~/.gemini/config/skills/<id>-studio` dan `<id>-scriptwriter` (atau `~/.claude/skills/...`). Sumbernya di `channels/<id>/` tetap ada, jadi bisa dibangun ulang kapan saja.
