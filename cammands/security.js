module.exports = [
    {
        name: 'antilink',
        alias: ['linkshield'],
        groupOnly: true,
        ownerOnly: true, // صرف اونر آن/آف اور سیٹ کر سکتا ہے
        async execute({ args, reply, db }) {
            const subCmd = args[0]?.toLowerCase();
            const actionInput = args[1]?.toLowerCase();

            if (!db.antiLinkConfig) {
                db.antiLinkConfig = {
                    whatsapp: { status: false, action: 'delete' },
                    youtube: { status: false, action: 'delete' },
                    facebook: { status: false, action: 'delete' },
                    website: { status: false, action: 'delete' },
                    all: { status: false, action: 'delete' }
                };
            }

            if (!subCmd || subCmd === 'status') {
                const cfg = db.antiLinkConfig;
                const statusText = `🛡️ *ADVANCED ANTILINK DASHBOARD*\n\n` +
                    `📲 *WhatsApp Links:* ${cfg.whatsapp.status ? '🟢 ON' : '🔴 OFF'} (Action: \`${cfg.whatsapp.action}\`)\n` +
                    `🎥 *YouTube Links:* ${cfg.youtube.status ? '🟢 ON' : '🔴 OFF'} (Action: \`${cfg.youtube.action}\`)\n` +
                    `📘 *Facebook Links:* ${cfg.facebook.status ? '🟢 ON' : '🔴 OFF'} (Action: \`${cfg.facebook.action}\`)\n` +
                    `🌐 *Web Links:* ${cfg.website.status ? '🟢 ON' : '🔴 OFF'} (Action: \`${cfg.website.action}\`)\n` +
                    `🚫 *All Links Guard:* ${cfg.all.status ? '🟢 ON' : '🔴 OFF'} (Action: \`${cfg.all.action}\`)\n\n` +
                    `💡 *Configuration Syntax:* \n` +
                    `• \`.antilink whatsapp on delete\` / \`warn\` / \`kick\`\n` +
                    `• \`.antilink youtube on warn\`\n` +
                    `• \`.antilink facebook on kick\`\n` +
                    `• \`.antilink website on delete\`\n` +
                    `• \`.antilink all on kick\`\n` +
                    `• \`.antilink whatsapp off\``;
                return reply(statusText);
            }

            const validTargets = ['whatsapp', 'youtube', 'facebook', 'website', 'all'];
            const validActions = ['delete', 'warn', 'kick'];

            if (!validTargets.includes(subCmd)) {
                return reply('❌ *Invalid Link Type!* Valid options: `whatsapp`, `youtube`, `facebook`, `website`, `all`');
            }

            if (actionInput === 'off') {
                db.antiLinkConfig[subCmd].status = false;
                return reply(`🔴 *AntiLink Status:* Guard for *[ ${subCmd.toUpperCase()} ]* links has been deactivated.`);
            }

            if (actionInput === 'on' || validActions.includes(actionInput)) {
                let selectedAction = args[2]?.toLowerCase() || (validActions.includes(actionInput) ? actionInput : 'delete');
                if (!validActions.includes(selectedAction)) selectedAction = 'delete';

                db.antiLinkConfig[subCmd].status = true;
                db.antiLinkConfig[subCmd].action = selectedAction;

                return reply(`🟢 *AntiLink Activated!*\n\n🎯 *Target:* \`${subCmd.toUpperCase()}\` Links\n⚡ *Action:* \`${selectedAction.toUpperCase()}\``);
            }

            reply('❌ *Usage Example:* `.antilink whatsapp on kick` OR `.antilink youtube on warn`');
        }
    },
    {
        name: 'antisticker',
        groupOnly: true,
        ownerOnly: true,
        async execute({ args, reply, db }) {
            const action = args[0]?.toLowerCase();
            const mode = args[1]?.toLowerCase() || 'delete';

            if (action === 'on') {
                db.antiSticker = { status: true, action: ['delete', 'warn', 'kick'].includes(mode) ? mode : 'delete' };
                reply(`🚫 *AntiSticker Active:* Restriction set to *[ ${db.antiSticker.action.toUpperCase()} ]*.`);
            } else if (action === 'off') {
                db.antiSticker = { status: false, action: 'delete' };
                reply('✅ *AntiSticker Deactivated:* Stickers are now permitted.');
            } else {
                reply('❌ *Usage:* `.antisticker on delete` / `warn` / `kick` OR `.antisticker off`');
            }
        }
    },
    {
        name: 'userwarn',
        alias: ['warn'],
        groupOnly: true,
        ownerOnly: true,
        async execute({ m, reply, db }) {
            const quoted = m.message?.extendedTextMessage?.contextInfo;
            const target = quoted?.participant;

            if (!target) return reply('❌ *Action Failed:* Reply to the user\'s message you want to warn.');

            if (!db.warns) db.warns = {};
            db.warns[target] = (db.warns[target] || 0) + 1;

            reply(`⚠️ *USER WARNED*\n\n👤 *User:* @${target.split('@')[0]}\n📊 *Total Warnings:* ${db.warns[target]}/3\n💡 *Note:* Reaching 3 warnings results in expulsion.`, { mentions: [target] });
        }
    },
    {
        name: 'warnlist',
        groupOnly: true,
        async execute({ m, reply, db }) {
            const quoted = m.message?.extendedTextMessage?.contextInfo;
            const target = quoted?.participant;

            if (target) {
                const count = db.warns?.[target] || 0;
                return reply(`📊 *Warning Status:* @${target.split('@')[0]} has *${count}* warning(s).`, { mentions: [target] });
            }

            if (!db.warns || Object.keys(db.warns).length === 0) {
                return reply('🎉 *Clean Record:* No warnings recorded in this group.');
            }

            let text = '📋 *WARNING LOGS*\n\n';
            for (const [user, count] of Object.entries(db.warns)) {
                text += `• @${user.split('@')[0]}: *${count}* warning(s)\n`;
            }
            reply(text, { mentions: Object.keys(db.warns) });
        }
    },
    {
        name: 'clearwarn',
        alias: ['resetwarn'],
        groupOnly: true,
        ownerOnly: true,
        async execute({ m, reply, db }) {
            const quoted = m.message?.extendedTextMessage?.contextInfo;
            const target = quoted?.participant;

            if (!target) return reply('❌ *Action Failed:* Reply to a user to reset their warnings.');

            if (db.warns && db.warns[target]) {
                delete db.warns[target];
                reply(`✅ *Warnings Reset:* Record cleared for @${target.split('@')[0]}.`, { mentions: [target] });
            } else {
                reply(`ℹ️ *User has zero warnings.*`);
            }
        }
    },
    {
        name: 'file',
        groupOnly: true,
        ownerOnly: true,
        async execute({ reply, db }) {
            db.blockFiles = true;
            reply('🛡️ *File Protection Active:* Documents and file transfers are now restricted.');
        }
    },
    {
        name: 'stopfile',
        groupOnly: true,
        ownerOnly: true,
        async execute({ reply, db }) {
            db.blockFiles = false;
            reply('✅ *File Protection Deactivated:* File transfers are now permitted.');
        }
    }
];