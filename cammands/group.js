module.exports = [
    {
        name: 'kick',
        alias: ['remove'],
        groupOnly: true,
        ownerOnly: true,
        async execute({ sock, m, args, reply }) {
            const quoted = m.message?.extendedTextMessage?.contextInfo;
            let target = quoted?.participant;

            if (!target && m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (!target && args[0]) {
                const num = args[0].replace(/[^0-9]/g, '');
                if (num) target = `${num}@s.whatsapp.net`;
            }

            if (!target) return reply('❌ *Action Failed:* Please reply to a message, tag a user, or provide their phone number.');

            try {
                await sock.groupParticipantsUpdate(m.key.remoteJid, [target], 'remove');
                reply(`🚪 *EXPELLED:* User @${target.split('@')[0]} has been removed from the group.`, { mentions: [target] });
            } catch (err) {
                reply('❌ *Operation Failed:* Ensure the bot is a Group Admin with full privileges.');
            }
        }
    },
    {
        name: 'gkick',
        alias: ['globalkick', 'kickallgroups'],
        ownerOnly: true,
        async execute({ sock, m, args, reply }) {
            try {
                let target = null;
                const quoted = m.message?.extendedTextMessage?.contextInfo;

                if (quoted && quoted.participant) {
                    target = quoted.participant;
                } else if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
                    target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
                } else if (args[0]) {
                    target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                }

                if (!target) {
                    return reply('❌ *Action Failed:* Please reply to a message, tag a user, or provide their number.\n*Example:* `.gkick @user`');
                }

                const targetClean = target.split('@')[0];
                await reply(`⏳ *Scanning common groups...* Expelling @${targetClean} from all shared groups.`, { mentions: [target] });

                const allGroups = await sock.groupFetchAllParticipating();
                const groupKeys = Object.keys(allGroups);

                let kickedCount = 0;
                let failedGroups = [];

                for (const groupId of groupKeys) {
                    const group = allGroups[groupId];
                    const isUserInGroup = group.participants.some(p => p.id === target || p.id.split(':')[0] === targetClean);
                    
                    const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                    const isBotAdmin = group.participants.some(p => (p.id === botNumber || p.id.split(':')[0] === botNumber.split('@')[0]) && (p.admin === 'admin' || p.admin === 'superadmin'));

                    if (isUserInGroup) {
                        if (isBotAdmin) {
                            try {
                                await sock.groupParticipantsUpdate(groupId, [target], 'remove');
                                kickedCount++;
                            } catch (err) {
                                failedGroups.push(group.subject);
                            }
                        } else {
                            failedGroups.push(`${group.subject} (Bot not admin)`);
                        }
                    }
                }

                let resultText = `🚫 *GLOBAL KICK REPORT*\n\n`;
                resultText += `👤 *Target User:* @${targetClean}\n`;
                resultText += `✅ *Kicked From:* ${kickedCount} Groups\n`;

                if (failedGroups.length > 0) {
                    resultText += `⚠️ *Failed/Skipped:* ${failedGroups.length} Groups\n`;
                }

                resultText += `\n👑 𝑷𝒐𝒘𝒆𝒓𝒆𝒅 𝒃𝒚 𝑰𝒛𝒛𝒂 𝑹𝒂𝒏𝒂 👑`;

                await sock.sendMessage(m.key.remoteJid, { text: resultText, mentions: [target] }, { quoted: m });

            } catch (error) {
                console.error('GKick Error:', error);
                reply('❌ *An error occurred during global kick execution.*');
            }
        }
    },
    {
        name: 'add',
        alias: ['inviteuser'],
        groupOnly: true,
        ownerOnly: true,
        async execute({ sock, m, args, reply }) {
            if (!args[0]) return reply('❌ *Usage:* `.add 923327051601`');
            const num = args[0].replace(/[^0-9]/g, '');
            const target = `${num}@s.whatsapp.net`;

            try {
                const response = await sock.groupParticipantsUpdate(m.key.remoteJid, [target], 'add');
                if (response[0]?.status === '200') {
                    reply(`✅ *User Added:* @${num} has been successfully added.`, { mentions: [target] });
                } else {
                    reply(`⚠️ *Addition Restricted:* Could not add directly. User privacy settings may require an invite link.`);
                }
            } catch (err) {
                reply('❌ *Failed to add user.* Ensure number format is correct with country code.');
            }
        }
    },
    {
        name: 'promote',
        groupOnly: true,
        ownerOnly: true,
        async execute({ sock, m, reply }) {
            const quoted = m.message?.extendedTextMessage?.contextInfo;
            let target = quoted?.participant || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

            if (!target) return reply('❌ *Action Failed:* Reply to or tag the user you want to promote.');

            try {
                await sock.groupParticipantsUpdate(m.key.remoteJid, [target], 'promote');
                reply(`👑 *PRIVILEGE ELEVATED:* @${target.split('@')[0]} is now a Group Admin.`, { mentions: [target] });
            } catch (err) {
                reply('❌ *Promotion Failed:* Check bot admin permissions.');
            }
        }
    },
    {
        name: 'demote',
        groupOnly: true,
        ownerOnly: true,
        async execute({ sock, m, reply }) {
            const quoted = m.message?.extendedTextMessage?.contextInfo;
            let target = quoted?.participant || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

            if (!target) return reply('❌ *Action Failed:* Reply to or tag the admin you want to demote.');

            try {
                await sock.groupParticipantsUpdate(m.key.remoteJid, [target], 'demote');
                reply(`🔻 *PRIVILEGE REVOKED:* Admin permissions removed for @${target.split('@')[0]}.`, { mentions: [target] });
            } catch (err) {
                reply('❌ *Demotion Failed:* Check bot admin permissions.');
            }
        }
    },
    {
        name: 'close',
        alias: ['mute'],
        groupOnly: true,
        ownerOnly: true,
        async execute({ sock, m, reply }) {
            try {
                await sock.groupSettingUpdate(m.key.remoteJid, 'announcement');
                reply('🔒 *CHAT RESTRICTED:* Only Group Admins can send messages now.');
            } catch (err) {
                reply('❌ *Failed:* Ensure bot is an admin.');
            }
        }
    },
    {
        name: 'open',
        alias: ['unmute'],
        groupOnly: true,
        ownerOnly: true,
        async execute({ sock, m, reply }) {
            try {
                await sock.groupSettingUpdate(m.key.remoteJid, 'not_announcement');
                reply('🔓 *CHAT UNRESTRICTED:* All members can now send messages.');
            } catch (err) {
                reply('❌ *Failed:* Ensure bot is an admin.');
            }
        }
    },
    {
        name: 'lock',
        groupOnly: true,
        ownerOnly: true,
        async execute({ sock, m, reply }) {
            try {
                await sock.groupSettingUpdate(m.key.remoteJid, 'locked');
                reply('⚙️ *SETTINGS LOCKED:* Only admins can edit group subject & icon.');
            } catch (err) {
                reply('❌ *Failed:* Ensure bot is an admin.');
            }
        }
    },
    {
        name: 'unlock',
        groupOnly: true,
        ownerOnly: true,
        async execute({ sock, m, reply }) {
            try {
                await sock.groupSettingUpdate(m.key.remoteJid, 'unlocked');
                reply('⚙️ *SETTINGS UNLOCKED:* All members can edit group settings.');
            } catch (err) {
                reply('❌ *Failed:* Ensure bot is an admin.');
            }
        }
    },
    {
        name: 'gclink',
        alias: ['invite'],
        groupOnly: true,
        async execute({ sock, m, reply }) {
            try {
                const code = await sock.groupInviteCode(m.key.remoteJid);
                reply(`🔗 *GROUP INVITE LINK*\n\nhttps://chat.whatsapp.com/${code}`);
            } catch (err) {
                reply('❌ *Link Generation Failed:* Ensure bot has admin rights.');
            }
        }
    },
    {
        name: 'gcinfo',
        alias: ['groupinfo'],
        groupOnly: true,
        async execute({ sock, m, reply }) {
            try {
                const meta = await sock.groupMetadata(m.key.remoteJid);
                const admins = meta.participants.filter(p => p.admin).length;
                const members = meta.participants.length;

                const text = `📋 *GROUP METADATA SUMMARY*\n\n` +
                    `📌 *Group Title:* ${meta.subject}\n` +
                    `🆔 *Group JID:* \`${meta.id}\`\n` +
                    `👑 *Owner:* @${meta.owner ? meta.owner.split('@')[0] : 'Unknown'}\n` +
                    `👥 *Total Participants:* \`${members}\`\n` +
                    `🛡️ *Admin Count:* \`${admins}\`\n` +
                    `📝 *Description:* \n${meta.desc ? meta.desc.toString() : 'No description set.'}`;

                reply(text, { mentions: meta.owner ? [meta.owner] : [] });
            } catch (err) {
                reply('❌ *Failed to retrieve group metadata.*');
            }
        }
    }
];