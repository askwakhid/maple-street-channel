# {{studio_skill}}

**Produksi video untuk channel YouTube {{name}} ({{handle}}): dari naskah final sampai folder siap upload.**

[English → README.md](README.md)

Skill ini adalah satu dari sepasang skill:

| Skill | Tugas | Model terbaik |
|---|---|---|
| **{{script_skill}}** | menulis naskah + brief publish (judul, teks thumbnail, deskripsi, komentar pin, rencana adegan) | model kuat (Claude, Gemini Pro, ...) |
| **{{studio_skill}}** (skill ini) | voice-over, storyboard, render, thumbnail, dan folder upload | model murah sudah cukup (Flash, Lite, Haiku, ...) |

Semua yang membuat {{name}} terlihat dan terdengar khas sudah ada di dalam skill ini: gaya {{theme}} dengan tokoh {{character}}, logo dan watermark, suara, musik, outro, pengaturan YouTube, dan "series bible" channel (`CHANNEL.md`).

---

## 1. Alur kerja

```
/{{script_skill}} tulis naskah Shorts tentang <topik>
        │  (Anda menyetujui naskahnya)
        ▼
videos/<topik>/script.txt + videos/<topik>/brief.json
        │
/{{studio_skill}} buat video Shorts dari videos/<topik>/script.txt
        ▼
videos/<topik>/publish/   ← video, cover/thumbnail, judul, deskripsi, komentar pin, UPLOAD.md
```

Mulai **percakapan baru untuk setiap video**: biaya per video tetap rendah dan agent tidak menyalin hasil video sebelumnya.

## 2. Kebutuhan (sekali saja)

Python 3.9+ dengan numpy, Node.js 22+, ffmpeg, Google Chrome (atau Edge/Chromium), dan aplikasi Voicebox dengan model Kokoro untuk voice-over gratis. Langkah instalasi lengkap untuk macOS, Windows, dan Linux: [`docs/ENGINE.id.md`](docs/ENGINE.id.md) bagian 4–6.

Cek dari folder skill:
```bash
python3 tools/pf.py doctor
python3 tools/voicebox.py setup     # mengunduh Kokoro sekali dan membuat suara channel
```

## 3. Memasang atau memperbarui

Skill ini **dibangun** dari folder sumber PaperFold Studio (jangan mengedit salinan yang terpasang). Perintah ini membangun dan memasang {{studio_skill}} sekaligus {{script_skill}}.

Skill ini mengikuti format terbuka **Agent Skills** (folder berisi `SKILL.md` + file pendukung), jadi hasil build yang sama bisa dipakai di banyak AI tool. Jalankan dari folder sumber PaperFold Studio:

```bash
python3 tools/package.py channel {{id}} --install all           # Antigravity, Claude Code, CodeBuddy, WorkBuddy, ~/.agents
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
Read ~/.agents/skills/{{studio_skill}}/SKILL.md and follow it: make a 16:9 video from videos/<topic>/script.txt
```

Atau taruh ini di file `AGENTS.md` di root workspace Anda (dibaca otomatis oleh banyak agent, misalnya Codex, Cursor, Copilot, Jules, Aider):

```markdown
## Skills for this project
- {{name}} scripts: read ~/.agents/skills/{{script_skill}}/SKILL.md and follow it.
- {{name}} videos: read ~/.agents/skills/{{studio_skill}}/SKILL.md and follow it.
```
(Pasang dulu dengan `--install agents`, atau pakai path salinan terpasang lainnya.)

## 4. Workspace Anda

Buka folder channel Anda (misalnya `.../youtube/{{id}}/`) sebagai workspace. Setiap video ada di **satu folder yang dinamai sesuai topiknya**:

```
videos/
  first-breakfast/
    script.txt        dari {{script_skill}} (edit file ini untuk mengubah kata-kata)
    brief.json        dari {{script_skill}} (judul, deskripsi, komentar pin, teks thumbnail, rencana adegan)
    input/            voice-over dan salinan naskah yang dipakai untuk membuatnya
    lines.md          baris bernomor beserta waktunya
    storyboard.json   adegan (ditulis oleh agent studio)
    publish.json      teks upload (dibuat dari brief.json)
    build/  out/      file kerja dan MP4 hasil render
    publish/          ← ini yang di-upload: buka UPLOAD.md
```
Nama folder adalah topiknya (`first-breakfast`; versi baru `first-breakfast-v2`). Nama generik (`v3`, `test`) dan naskah yang disimpan di samping folder ditolak.

## 5. Contoh permintaan

```
/{{studio_skill}} buat video Shorts dari videos/first-breakfast/script.txt
/{{studio_skill}} buat video 16:9 dari videos/at-the-pharmacy/script.txt
/{{studio_skill}} buat video Shorts dari videos/where-is-the-post-office/script.txt dengan voice.mp3
/{{studio_skill}} adegan 3 pakai panel anggaran, lalu buat ulang
/{{studio_skill}} thumbnail pakai adegan 5 dengan teks "Order Like a Local"
/{{studio_skill}} naskahnya berubah, buat ulang videonya
```
Format: Shorts, kecuali Anda menyebut 16:9 / horizontal / video panjang, atau `brief.json` berisi `"format": "long"`.

## 6. Gerbang kualitas

Sebelum render, `check` mencari masalah yang membuat video lemah: detik pertama kosong, adegan lebih dari 12 detik, angka sen dibacakan, angka di layar yang tidak diucapkan narator, warna teks tak terbaca. Semuanya ditandai **MUST FIX**, dan `make` berhenti sampai masalahnya diperbaiki. Kalau Anda tetap ingin publish, katakan saja; agent lalu boleh menambahkan `--accept-warnings`. Masalah narasi (angka sen, hook) diperbaiki di naskah lewat {{script_skill}}.

## 7. Perintah (untuk Anda atau agent)

| Perintah | Fungsinya |
|---|---|
| `python3 tools/pf.py doctor` | mengecek tools |
| `python3 tools/pf.py init videos/<topik> [--format long] [--voice FILE] [--script FILE]` | suara (Voicebox) + timing + draft storyboard |
| `python3 tools/pf.py check videos/<topik>` | memvalidasi storyboard dan gerbang kualitas |
| `python3 tools/pf.py make videos/<topik>` | check → preview → render → folder publish |
| `... make videos/<topik> --cpu eco` | sama, tapi ringan untuk komputer (lebih lambat). Default `balanced`; `max` = paling cepat. Atau atur `PF_CPU=eco` sekali |
| `python3 tools/pf.py catalog` | jenis adegan dan ikon |
| `python3 tools/voicebox.py voices / audition / use` | mencoba atau mengganti suara channel |
| `python3 tools/logo.py` | logo, banner, foto profil dari brand.json |

Referensi lengkap: [`docs/ENGINE.id.md`](docs/ENGINE.id.md) bagian 15.

## 8. Lokasi pengaturan channel

| Apa | File (di folder sumber: `channels/{{id}}/`) |
|---|---|
| Nama, nama skill, deskripsi | `channel.json` |
| Warna, tema, warna tokoh, watermark, suara, musik, pengaturan YouTube, aturan posting | `brand/brand.json` |
| Logo dan gambar YouTube | `brand/*.png` (`python3 tools/logo.py`) |
| Penonton, gaya bahasa, kanon {{character}}, seri, angka, daftar larangan | `CHANNEL.md` |
| Contoh naskah, brief, dan storyboard | `examples/` |

Edit di folder sumber, lalu bangun dan pasang lagi (bagian 3). Perubahan yang hanya dilakukan di salinan terpasang akan hilang saat instalasi berikutnya (installer menyimpan `brand.json` terpasang yang berbeda di samping file sumber, supaya tidak ada yang hilang diam-diam).

## 9. Membuat pasangan skill untuk channel lain

Lihat `channels/README.id.md` di folder sumber PaperFold Studio: salin `channels/_template`, isi beberapa file, lalu build.
