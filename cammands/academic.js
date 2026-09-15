const axios = require('axios');

const GITHUB_USER = 'bubblevuofficial-ops';
const GITHUB_REPO = 'data';
const BRANCH = 'main';
const GITHUB_TOKEN = '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';

const headers = {
    'User-Agent': 'Mozilla/5.0',
    'Accept': 'application/vnd.github.v3+json',
    'Authorization': `Bearer ${GITHUB_TOKEN}`
};

module.exports = [
    {
        name: 'vu',
        alias: ['cs101', 'cs201', 'cs301', 'eng101', 'mth101', 'phy101', 'bio101', 'cs435', 'mth601', 'mth603', 'isl201'],
        async execute({ sock, m, args, reply, db }) {
            const body = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            const commandUsed = body.split(' ')[0].slice(1).toLowerCase();
            const subjectKey = commandUsed === 'vu' ? (args[0] ? args[0].toLowerCase() : '') : commandUsed;

            if (!subjectKey) return reply(`❌ *Usage:* \`.${commandUsed || 'cs101'}\``);

            try {
                const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${subjectKey.toLowerCase()}?ref=${BRANCH}`;
                const response = await axios.get(apiUrl, { headers });
                const files = response.data;

                if (!Array.isArray(files) || files.length === 0) {
                    return reply(`❌ No files found for *${subjectKey.toUpperCase()}*.`);
                }

                const categorized = {
                    handouts: files.filter(f => /handout|book/i.test(f.name)),
                    midterm: files.filter(f => /mid/i.test(f.name)),
                    finalterm: files.filter(f => /final/i.test(f.name)),
                    notes: files.filter(f => /note|short|quiz|paper/i.test(f.name))
                };

                let optionsCount = 0;
                const fileMap = {};
                const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];

                let menuText = `📚 *${subjectKey.toUpperCase()} ACADEMIC FILES*\n\n`;

                if (categorized.handouts.length > 0) {
                    optionsCount++;
                    menuText += `${numberEmojis[optionsCount - 1]} 📖 Handouts & Books (${categorized.handouts.length})\n`;
                    fileMap[optionsCount.toString()] = categorized.handouts.map(f => f.download_url);
                }
                if (categorized.midterm.length > 0) {
                    optionsCount++;
                    menuText += `${numberEmojis[optionsCount - 1]} 📝 Midterm Papers (${categorized.midterm.length})\n`;
                    fileMap[optionsCount.toString()] = categorized.midterm.map(f => f.download_url);
                }
                if (categorized.finalterm.length > 0) {
                    optionsCount++;
                    menuText += `${numberEmojis[optionsCount - 1]} 🎯 Finalterm Papers (${categorized.finalterm.length})\n`;
                    fileMap[optionsCount.toString()] = categorized.finalterm.map(f => f.download_url);
                }
                if (categorized.notes.length > 0) {
                    optionsCount++;
                    menuText += `${numberEmojis[optionsCount - 1]} 📌 Short Notes & Quizzes (${categorized.notes.length})\n`;
                    fileMap[optionsCount.toString()] = categorized.notes.map(f => f.download_url);
                }

                if (optionsCount === 0) return reply(`⚠️ No readable documents found for *${subjectKey.toUpperCase()}*.`);

                menuText += `\n👉 Reply with option number (1-${optionsCount})\n\n`;
                menuText += `👑 𝑷𝒐𝒘𝒆𝒓𝒆𝒅 𝒃𝒚 𝑰𝒛𝒛𝒂 𝑹𝒂𝒏𝒂 👑`;

                if (!db.vuSessions) db.vuSessions = {};
                db.vuSessions[m.key.remoteJid] = {
                    subject: subjectKey.toUpperCase(),
                    files: fileMap,
                    sender: m.key.participant || m.key.remoteJid
                };

                await sock.sendMessage(m.key.remoteJid, { text: menuText }, { quoted: m });

            } catch (err) {
                await reply(`❌ Subject *${subjectKey.toUpperCase()}* not found on server.`);
            }
        }
    }
];