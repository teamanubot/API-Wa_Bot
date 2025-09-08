global.crypto = require('crypto');
const fs = require('fs');
const axios = require('axios');
const mime = require('mime-types');
const {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

let globalSock;

async function createSocketConnection(app) {
  if (globalSock?.ws?.readyState === 1) {
    console.log('⚠️ Socket sudah aktif. Skip init ulang.');
    return;
  }

  const { state, saveCreds } = await useMultiFileAuthState('session');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
  });

  globalSock = sock;

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('📷 QR Code received. Scan dengan WhatsApp:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log('🔴 Connection closed, reason:', reason);

      if (reason !== DisconnectReason.loggedOut) {
        console.log('🔁 Reconnecting in 5s...');
        setTimeout(() => createSocketConnection(app), 5000);
      } else {
        console.log('❌ Logged out. Hapus folder `session` untuk mulai ulang.');
      }
    }

    if (connection === 'open') {
      console.log('🟢 WhatsApp connected!');
    }
  });

  setInterval(() => {
    if (sock?.ws?.readyState === 1) {
      console.log('📶 Keepalive ping...');
      sock.sendPresenceUpdate('available');
    }
  }, 60000);

  app.get('/ping', (req, res) => {
    res.json({ status: 'alive', message: 'pong 🏓' });
  });

  app.all('/send', async (req, res) => {
    const isPost = req.method === 'POST';
    const data = isPost ? req.body : req.query;

    const { number, message, filePath, fileUrl } = data;

    if (!number) {
      return res.status(400).json({ error: 'Nomor wajib diisi.' });
    }

    const jid = `${number.replace(/\D/g, '')}@s.whatsapp.net`;

    try {
      if (filePath) {
        const fileBuffer = fs.readFileSync(filePath);
        const fileName = filePath.split('/').pop();
        const mimeType = mime.lookup(filePath) || 'application/octet-stream';

        if (mimeType.startsWith('image/')) {
          await sock.sendMessage(jid, {
            image: fileBuffer,
            caption: message || '',
          });
        } else {
          await sock.sendMessage(jid, {
            document: fileBuffer,
            fileName,
            mimetype: mimeType,
            caption: message || '',
          });
        }

      } else if (fileUrl) {
        try {
          const response = await axios.get(fileUrl, {
            responseType: 'arraybuffer',
            maxRedirects: 5,
            headers: {
              Accept: 'application/pdf',
            },
          });

          const contentType = response.headers['content-type'] || '';
          const fileBuffer = Buffer.from(response.data, 'binary');

          if (!contentType.includes('application/pdf')) {
            console.warn('⚠️ Bukan PDF. Konten:', fileBuffer.toString().slice(0, 100));
            return res.status(400).json({
              success: false,
              message: 'File bukan PDF',
            });
          }

          let fileName = 'invoice.pdf';
          const contentDisposition = response.headers['content-disposition'];
          if (contentDisposition?.includes('filename=')) {
            fileName = contentDisposition.split('filename=')[1].replace(/["']/g, '');
          } else if (fileUrl.includes('/')) {
            fileName = decodeURIComponent(fileUrl.split('/').pop());
          }

          let mimeType = contentType;
          if (!mimeType || !mimeType.includes('pdf')) {
            mimeType = 'application/pdf';
          }

          console.log('📄 File Name:', fileName);
          console.log('📄 MIME Type:', mimeType);
          console.log('📄 Buffer Length:', fileBuffer.length);

          await sock.sendMessage(jid, {
            document: fileBuffer,
            fileName,
            mimetype: mimeType,
            caption: message || '',
          });

          return res.json({ success: true, message: 'PDF Terkirim.' });

        } catch (err) {
          console.error('❌ Gagal ambil PDF:', err.message);
          return res.status(500).json({ success: false, error: err.message });
        }

      } else if (message) {
        await sock.sendMessage(jid, { text: message });

      } else {
        return res.status(400).json({ error: 'Harus ada message atau file.' });
      }

      res.json({ success: true, message: 'Terkirim.' });

    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Gagal kirim.', error: err.message });
    }

    console.log('📥 Input:', data);
  });
}

module.exports = { createSocketConnection };