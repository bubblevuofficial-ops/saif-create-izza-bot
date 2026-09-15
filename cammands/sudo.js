module.exports = [
    {
        name: 'addsudo',
        alias: ['setsudo'],
        ownerOnly: true,
        async execute({ m, args, reply, db }) {
            const quoted = m.message?.extendedTextMessage?.contextInfo;
            let target = quoted?.participant;

            if (!target && m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (!target && args[0]) {
                const num = args[0].replace(/[^0-9]/g, '');
                if (num) target = `${num}@s.whatsapp.net`;
            }

            if (!target) return reply('❌ *Usage:* Reply to a user, tag them, or type `.addsudo 923xxxxxxxxx`');

            if (!db.sudoUsers) db.sudoUsers = [];
            const cleanNum = target.split('@')[0];

            if (db.sudoUsers.includes(cleanNum)) {
                return reply(`⚠️ *@${cleanNum} is already in the Sudo User List.*`, { mentions: [target] });
            }

            db.sudoUsers.push(cleanNum);
            reply(`👑 *SUDO ACCESS GRANTED*\n\n👤 *User:* @${cleanNum}\n⚡ *Status:* Granted full bot administration access.`, { mentions: [target] });
        }
    },
    {
        name: 'delsudo',
        alias: ['removesudo'],
        ownerOnly: true,
        async execute({ m, args, reply, db }) {
            const quoted = m.message?.extendedTextMessage?.contextInfo;
            let target = quoted?.participant;

            if (!target && m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (!target && args[0]) {
                const num = args[0].replace(/[^0-9]/g, '');
                if (num) target = `${num}@s.whatsapp.net`;
            }

            if (!target) return reply('❌ *Usage:* Reply to a user, tag them, or type `.delsudo 923xxxxxxxxx`');

            if (!db.sudoUsers) db.sudoUsers = [];
            const cleanNum = target.split('@')[0];

            if (!db.sudoUsers.includes(cleanNum)) {
                return reply(`⚠️ *@${cleanNum} is not a Sudo user.*`, { mentions: [target] });
            }

            db.sudoUsers = db.sudoUsers.filter(num => num !== cleanNum);
            reply(`🔻 *SUDO ACCESS REVOKED*\n\n👤 *User:* @${cleanNum}\n⚡ *Status:* Removed from Sudo administration.`, { mentions: [target] });
        }
    },
    {
        name: 'sudolist',
        alias: ['sudos'],
        async execute({ reply, db }) {
            if (!db.sudoUsers || db.sudoUsers.length === 0) {
                return reply('📋 *SUDO DIRECTORY*\n\nNo co-owners/sudo users added yet.');
            }

            let text = `👑 *AUTHORIZED SUDO USERS LIST*\n━━━━━━━━━━━━━━━━━━━━━━\n\n`;
            const mentions = [];
            for (let num of db.sudoUsers) {
                text += `• @${num}\n`;
                mentions.push(`${num}@s.whatsapp.net`);
            }
            reply(text, { mentions });
        }
    }
];