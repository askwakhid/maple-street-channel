# {{script_skill}}

**Naskah untuk channel YouTube {{name}} ({{handle}}): {{niche}}, dengan tokoh {{character}}.**

[English → README.md](README.md)

Skill ini menulis **kata-kata** sebuah video: naskah dan brief publish. Skill ini tidak pernah membuat audio atau video. Videonya dibuat setelahnya dengan **{{studio_skill}}**.

| Skill | Tugas | Model terbaik |
|---|---|---|
| **{{script_skill}}** (skill ini) | naskah + brief (judul, teks thumbnail, deskripsi, komentar pin, rencana adegan) | model kuat: naskah menentukan apakah orang terus menonton |
| **{{studio_skill}}** | voice-over, storyboard, render, folder upload | model murah sudah cukup |

---

## 1. Isinya

| File | Kegunaan |
|---|---|
| `SKILL.md` | langkah dan aturan yang diikuti AI |
| `CHANNEL.md` | "series bible" channel: penonton, gaya bahasa, **kanon pemeran dan tempat**, seri dan episode yang sudah ada, angka default, daftar larangan, gaya judul/thumbnail/komentar pin |
| `SCRIPT-GUIDE.md` | struktur Shorts dan 16:9, jenis adegan yang bisa ditampilkan studio, daftar periksa |
| `BRIEF.md` | format `brief.json` |
| `examples/` | contoh naskah dan brief yang sudah jadi |

## 2. Bisa dipakai di mana

- **Google Antigravity / Claude Code:** bisa membaca folder `videos/` Anda (supaya topik tidak berulang) dan langsung menyimpan `videos/<topik>/script.txt` + `videos/<topik>/brief.json`.
- **Claude.ai atau aplikasi chat lain:** kedua file ditampilkan sebagai blok kode; simpan sendiri ke `videos/<topik>/`. Kalau chat-nya tidak bisa menjalankan Python, hitungannya ditampilkan langkah demi langkah dan ditandai "please verify".

## 3. Memasang atau memperbarui

Dibangun dari folder sumber PaperFold Studio, bersamaan dengan {{studio_skill}}.

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

## 4. Contoh permintaan

```
/{{script_skill}} tulis episode 3 dari rencana season: Where's the post office?
/{{script_skill}} tulis episode di apotek (A2): merasa sakit, should
/{{script_skill}} tulis Shorts: Don't say "I am agree" — say this
/{{script_skill}} beri 5 ide episode untuk season 2
/{{script_skill}} rapikan naskah saya di draft.txt (frasanya jangan diubah)
```
Revisi saat Anda meninjau: "kata-katanya lebih sederhana", "tambah satu frasa", "buat Grace lebih lucu", "OK, disetujui".

## 5. Hasilnya

```
videos/<topik>/script.txt   satu kalimat per baris, angka dibulatkan supaya enak didengar, ditutup CTA channel
videos/<topik>/brief.json   3 judul (satu ditandai rekomendasi, dengan alasan), deskripsi dengan "The math: ...", komentar pin,
                            1-3 teks thumbnail, rencana adegan (adegan mana menampilkan baris mana)
```
Lalu agent memberikan prompt berikutnya:
```
/{{studio_skill}} buat video Shorts dari videos/<topik>/script.txt
```

## 6. Aturan yang diikutinya

- Membaca `CHANNEL.md` lebih dulu; tidak pernah bertentangan dengan kanon pemeran dan tempat.
- Satu kalimat per baris; hook di baris pertama; satu tindakan untuk penonton; CTA channel di akhir.
- Setiap baris memakai tag pembicara (`MIA:`) dan segmen (`[STORY]`); kosakata sesuai level; tanpa terjemahan; pujian setelah setiap jeda REPEAT.
- Tidak pernah: fakta karangan, nama merek, rekomendasi saham/kripto, jaminan hasil, merendahkan orang (daftar lengkap di `CHANNEL.md`).
- Menunjukkan naskah dan menunggu persetujuan Anda sebelum menyimpannya sebagai final.

## 7. Memperbarui series bible

Edit `channels/{{id}}/CHANNEL.md` di folder sumber (episode baru di tabel episode, perubahan kanon, angka default baru), lalu build dan pasang lagi (bagian 3). Tabel episode yang selalu diperbarui itulah yang menjaga cerita {{character}} tetap konsisten.

