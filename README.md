## 🚀 Fitur

- Login dengan scan QR code (tersimpan di folder `session/`)
- Kirim pesan ke nomor WhatsApp lewat HTTP POST
- Endpoint `/ping` untuk cek apakah bot aktif
- Docker-ready untuk deployment lintas platform

---

### 🐳 Jalankan dengan Docker

```bash
docker-compose up --build
```

---

## 📱 Scan QR Code

Saat pertama kali dijalankan, akan muncul QR di terminal:

* Scan menggunakan WhatsApp
* Data login akan disimpan otomatis di folder `session/`

---

## 🔌 API Endpoint

### ✅ Cek koneksi bot

```bash
GET /ping
```

**Response:**

```json
{
  "status": "alive",
  "message": "pong 🏓"
}
```

---

### 📤 Kirim Pesan

```bash
POST /send
Content-Type: application/json
```

**Body JSON:**

```json
{
  "number": "628XXXXXXXXX",
  "message": "Pesan dari bot"
}
```

**Contoh CURL:**

```bash
curl -X POST http://localhost:3000/send \
  -H "Content-Type: application/json" \
  -d '{"number":"6281234567890","message":"Halo dari bot"}'
```

**Response:**

```json
{
  "success": true,
  "message": "Pesan berhasil dikirim."
}
```

---

## 🧹 Reset Session

Untuk logout / scan ulang QR:

```bash
rm -rf node/session/*
```

Kemudian jalankan ulang `app.js`, QR akan muncul kembali.

---

## 🙏 Terima Kasih

* [Baileys](https://github.com/WhiskeySockets/Baileys)
* Rework by TeamAnuBot
