const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = [
    // 1. 🖼️ Sticker Command (Fixed Metadata & English Responses)
    {
        name: 'sticker',
        alias: ['s', 'stiker'],
        async execute({ sock, m, reply }) {
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const isImg = m.message?.imageMessage || quoted?.imageMessage;
            const isVid = m.message?.videoMessage || quoted?.videoMessage;

            if (!isImg && !isVid) {
                return reply('❌ *Usage:* Reply to an image/video or send one with the `.s` command.');
            }

            try {
                reply('⏳ *Converting to Sticker...*');

                const mediaMessage = isImg ? (quoted?.imageMessage || m.message.imageMessage) : (quoted?.videoMessage || m.message.videoMessage);
                const stream = await downloadContentFromMessage(mediaMessage, isImg ? 'image' : 'video');

                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }

                // Proper sticker header layout to prevent "Can't view sticker info" error
                await sock.sendMessage(m.key.remoteJid, { 
                    sticker: buffer,
                    isAnimated: isVid ? true : false
                }, { quoted: m });

            } catch (err) {
                console.error(err);
                reply('❌ *Failed to generate sticker.* Ensure the file size is reasonable.');
            }
        }
    },

    // 2. ⏰ Reminder Command (English Logic & Timer)
    {
        name: 'reminder',
        alias: ['remind', 'remindme'],
        async execute({ sock, m, args, reply }) {
            // Usage: .reminder 10m Check Server
            const timeInput = args[0];
            const textInput = args.slice(1).join(' ');

            if (!timeInput || !textInput) {
                return reply('❌ *Usage:* `.reminder 10m Meeting` or `.reminder 1h Homework`\n\n*Units:* `s` (seconds), `m` (minutes), `h` (hours)');
            }

            const unit = timeInput.slice(-1).toLowerCase();
            const timeValue = parseInt(timeInput.slice(0, -1));

            if (isNaN(timeValue)) {
                return reply('❌ *Invalid Time Format!* Example: `.reminder 5m Homework`');
            }

            let durationMs = 0;
            if (unit === 's') durationMs = timeValue * 1000;
            else if (unit === 'm') durationMs = timeValue * 60 * 1000;
            else if (unit === 'h') durationMs = timeValue * 60 * 60 * 1000;
            else return reply('❌ *Invalid Unit!* Use `s` for seconds, `m` for minutes, or `h` for hours.');

            reply(`⏰ *REMINDER SET SUCCESSFULLY!*\n\n📝 *Task:* ${textInput}\n⏳ *Duration:* ${timeValue}${unit}\n👑 *Izza Rana Bot will notify you when time is up.*`);

            // Active Background Timer
            setTimeout(async () => {
                const senderJid = m.key.participant || m.key.remoteJid;
                const userTag = `@${senderJid.split('@')[0]}`;
                const reminderNotice = `🔔 *REMINDER ALERT!*\n\n👤 *User:* ${userTag}\n📝 *Task:* ${textInput}\n📌 *Status:* Scheduled time completed!`;
                
                await sock.sendMessage(m.key.remoteJid, { 
                    text: reminderNotice, 
                    mentions: [senderJid] 
                }, { quoted: m });
            }, durationMs);
        }
    }
];