module.exports = [
    {
        name: 'tagall',
        alias: ['everyone', 'all'],
        groupOnly: true,
        ownerOnly: true,
        async execute({ sock, m, args, reply }) {
            try {
                const meta = await sock.groupMetadata(m.key.remoteJid);
                const participants = meta.participants;
                const messageText = args.join(' ') || 'Important Notice!';

                let text = `✨ *━━━ 👥 G R O U P  T A G A L L 👥 ━━━*\n\n`;
                text += `📢 *Notice:* ${messageText}\n\n`;
                text += `📊 *Total Members:* ${participants.length}\n`;
                text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

                const mentions = [];
                for (let p of participants) {
                    text += ` ⚡ @${p.id.split('@')[0]}\n`;
                    mentions.push(p.id);
                }

                text += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
                text += `👑 *Powered by Izza Rana System*`;

                reply(text, { mentions });
            } catch (err) {
                reply('❌ *Failed to execute TagAll.*');
            }
        }
    },
    {
        name: 'admintag',
        alias: ['admins', 'tagadmins'],
        groupOnly: true,
        ownerOnly: true,
        async execute({ sock, m, args, reply }) {
            try {
                const meta = await sock.groupMetadata(m.key.remoteJid);
                const admins = meta.participants.filter(p => p.admin);
                const messageText = args.join(' ') || 'Attention Admins!';

                let text = `👑 *━━━ 🛡️ A D M I N  S Q U A D 🛡️ ━━━*\n\n`;
                text += `💬 *Message:* ${messageText}\n\n`;
                text += `🛡️ *Total Admins:* ${admins.length}\n`;
                text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

                const mentions = [];
                for (let a of admins) {
                    const role = a.admin === 'superadmin' ? '⚙️ Creator' : '⭐ Admin';
                    text += ` ${role} : @${a.id.split('@')[0]}\n`;
                    mentions.push(a.id);
                }

                text += `\n━━━━━━━━━━━━━━━━━━━━━━`;
                reply(text, { mentions });
            } catch (err) {
                reply('❌ *Failed to tag admins.*');
            }
        }
    },
    {
        name: 'hidetag',
        alias: ['htag', 'notify'],
        groupOnly: true,
        ownerOnly: true,
        async execute({ sock, m, args, reply }) {
            try {
                const meta = await sock.groupMetadata(m.key.remoteJid);
                const mentions = meta.participants.map(p => p.id);
                
                const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                const text = args.join(' ') || (quoted ? (quoted.conversation || quoted.extendedTextMessage?.text) : '🔔 *System Notification*');

                if (!text && !quoted) {
                    return reply('❌ *Usage:* Provide text or reply to a message.');
                }

                await sock.sendMessage(m.key.remoteJid, { text, mentions });
            } catch (err) {
                reply('❌ *Failed to send hidden tag.*');
            }
        }
    },
    {
        name: 'welcome',
        groupOnly: true,
        ownerOnly: true,
        async execute({ args, reply, db }) {
            const action = args[0]?.toLowerCase();
            if (action === 'on') {
                db.welcomeStatus = true;
                reply('🟢 *Welcome & Goodbye System:* Enabled!');
            } else if (action === 'off') {
                db.welcomeStatus = false;
                reply('🔴 *Welcome & Goodbye System:* Disabled!');
            } else {
                reply(`ℹ️ *Status:* Welcome is currently *[ ${db.welcomeStatus ? 'ON' : 'OFF'} ]*\n\nUsage:\n• \`.welcome on\`\n• \`.welcome off\``);
            }
        }
    },
    {
        name: 'setwelcome',
        groupOnly: true,
        ownerOnly: true,
        async execute({ args, reply, db }) {
            const text = args.join(' ');
            if (!text) return reply('❌ *Usage:* `.setwelcome Welcome @user to @group!`');

            db.welcomeMsg = text;
            reply('✅ *Custom Welcome Message Updated!*');
        }
    },
    {
        name: 'setgoodbye',
        groupOnly: true,
        ownerOnly: true,
        async execute({ args, reply, db }) {
            const text = args.join(' ');
            if (!text) return reply('❌ *Usage:* `.setgoodbye Goodbye @user!`');

            db.goodbyeMsg = text;
            reply('✅ *Custom Goodbye Message Updated!*');
        }
    }
];