const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@adiwajshing/baileys');
const P = require('pino');

const sock = makeWASocket({
    auth: state,
    logger: P({ level: 'silent' }), // Ubah ke 'debug' jika ingin melihat log detail
    printQRInTerminal: true,        // QR code akan muncul di terminal
});

    // Handle koneksi
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect =
                lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed. Reconnecting...', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('Bot connected!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Event untuk membaca pesan
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;

        const from = msg.key.remoteJid; // ID pengirim
        const isGroup = from.endsWith('@g.us'); // Cek apakah pesan dari grup
        const text = msg.message.conversation || 
                     msg.message.extendedTextMessage?.text || 
                     "";

        if (text.startsWith('!hidetag') && isGroup) {
            const groupMetadata = await sock.groupMetadata(from);
            const participants = groupMetadata.participants.map((p) => p.id);

            const message = text.slice(9).trim() || 'Halo semua!';
            await sock.sendMessage(from, {
                text: message,
                mentions: participants, // Mention semua anggota grup
            });
            console.log(`Hidetag message sent to group ${groupMetadata.subject}`);
        }
    });
}

startBot();
