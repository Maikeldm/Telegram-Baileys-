const { default: makeWASocket, DisconnectReason, makeInMemoryStore, jidDecode, Browsers, proto, getContentType, useMultiFileAuthState, downloadContentFromMessage } = require("@adiwajshing/baileys")
const pino = require('pino')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const readline = require("readline");
const _ = require('lodash')
const FileType = require('file-type')
const path = require('path')
const yargs = require('yargs/yargs')
const PhoneNumber = require('awesome-phonenumber')
const simple = require('./lib/oke.js')
const smsg = require('./lib/smsg');
const { isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, await, sleep, reSize } = require('./lib/myfunc')
const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })
const question = (text) => { const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); return new Promise((resolve) => { rl.question(text, resolve) }) };
const crypto = require('crypto');
async function startpairing(phoneNumber, sessionPath) {
  async function WhatsAppStart() {
    // Usar la ruta de sesión pasada como parámetro
    const {state,saveCreds} = await useMultiFileAuthState(sessionPath);
    const conn = simple({
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      auth: state,
      version: [2, 3000, 1017531287],
      browser: Browsers.ubuntu("Edge"),
      getMessage: async key => {
        const jid = jidNormalizedUser(key.remoteJid);
        const msg = await store.loadMessage(jid, key.id);
        return msg?.message || '';
      },
    }, store);


    if (!conn.authState.creds.registered) {
      setTimeout(async () => {
        let code = await conn.requestPairingCode(phoneNumber);
        code = code?.match(/.{1,4}/g)?.join("-") || code;
        // Guarda el código en la carpeta específica de la sesión
        if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });
        fs.writeFileSync(path.join(sessionPath, 'pairing.json'), JSON.stringify({ code }, null, 2));
      }, 1700);

    }

    store.bind(conn.ev);

    conn.ev.on('messages.upsert', async chatUpdate => {
      try {
        mek = chatUpdate.messages[0]
        if (!mek.message) return
        mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
        if (mek.key && mek.key.remoteJid === 'status@broadcast') return
        if (!conn.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
        if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
        m = smsg(conn, mek, store)
        require("./bruxin.js")(conn, m, chatUpdate, store)
      } catch (err) {
        console.log(err)
      }
    })

    // Setting
    conn.decodeJid = (jid) => {
      if (!jid) return jid
      if (/:\d+@/gi.test(jid)) {
        let decode = jidDecode(jid) || {}
        return decode.user && decode.server && decode.user + '@' + decode.server || jid
      } else return jid
    }

    conn.getName = (jid, withoutContact= false) => {
      id = conn.decodeJid(jid)
      withoutContact = conn.withoutContact || withoutContact 
      let v
      if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
        v = store.contacts[id] || {}
        if (!(v.name || v.subject)) v = conn.groupMetadata(id) || {}
        resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
      })
      else v = id === '0@s.whatsapp.net' ? {
        id,
        name: 'WhatsApp'
      } : id === conn.decodeJid(conn.user.id) ?
      conn.user :
      (store.contacts[id] || {})
      return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }

    conn.public = true

    conn.serializeM = (m) => smsg(conn, m, store);
    conn.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === 'close') {
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        switch (reason) {
          case DisconnectReason.restartRequired:
            console.log('Reinicio necesario. Reconectando...');
            setTimeout(() => startpairing(phoneNumber, sessionPath), 2000); // Reintenta conexión
            break;
          case DisconnectReason.connectionClosed:
          case DisconnectReason.connectionLost:
          case DisconnectReason.timedOut:
          case DisconnectReason.multideviceMismatch:
          case DisconnectReason.connectionReplaced:
            console.warn('Conexión cerrada. Reconectando...');
            setTimeout(() => startpairing(phoneNumber, sessionPath), 2000);
            break;
          case DisconnectReason.loggedOut:
          case DisconnectReason.forbidden:
            console.error(`Conexión de: ${phoneNumber} cayó, removiendo el archivo`);
            fs.rmSync(sessionPath, { recursive: true, force: true });
            break;
          case DisconnectReason.restartRequired:
            console.log('Reinicio necesario. Reconectando...');
            setTimeout(() => startpairing(phoneNumber, sessionPath), 2000);
            break;
          default:
            console.error(`Motivo de desconexión desconocido: ${reason}. Reconectando ${phoneNumber}...`);
            setTimeout(() => startpairing(phoneNumber, sessionPath), 2000);
            break;
        }
      } else if (connection === 'open') {
        console.log('\n')
      }
    });


    conn.ev.on('creds.update', saveCreds)

    async function getMessage(key) {
      if (store) {
        const msg = await store.loadMessage(key.remoteJid, key.id)
        return msg
      }
      return {
        conversation: "NekoBot"
      }
    }
    conn.ev.on('messages.update', 
    async(chatUpdate) => {
      for (const { key, update } of chatUpdate) {
        if (update.pollUpdates && key.fromMe) {
           const pollCreation = await getMessage(key);
           if (pollCreation) {
            let pollUpdate = await getAggregateVotesInPollMessage({
    message: pollCreation?.message,
    pollUpdates: update.pollUpdates,
    });
    let toCmd = pollUpdate.filter(v => v.voters.length !== 0)[0]?.name
    console.log(toCmd);
    await appenTextMessage(m, conn, toCmd, pollCreation);
    await conn.sendMessage(m.cht, { delete: key });
           } else return false
    return 
         }
       }
    });

    conn.sendText = (jid, text, quoted = '', options) => conn.sendMessage(jid, { text: text, ...options }, { quoted })
//=========================================\\
conn.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
let quoted = message.msg ? message.msg : message
let mime = (message.msg || message).mimetype || ''
let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
const stream = await downloadContentFromMessage(quoted, messageType)
let buffer = Buffer.from([])
for await(const chunk of stream) {
buffer = Buffer.concat([buffer, chunk])
}
let type = await FileType.fromBuffer(buffer)
let trueFileName = attachExtension ? ('./sticker/' + filename + '.' + type.ext) : './sticker/' + filename
// save to file
await fs.writeFileSync(trueFileName, buffer)
return trueFileName
}
//=========================================\\
conn.getFile = async (PATH, save) => {
let res
let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
//if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
let type = await FileType.fromBuffer(data) || {
mime: 'application/octet-stream',
ext: '.bin'
}
filename = path.join(__filename, '../src/' + new Date * 1 + '.' + type.ext)
if (data && save) fs.promises.writeFile(filename, data)
return {
res,
filename,
size: await getSizeMedia(data),
...type,
data
}

}

conn.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
let type = await conn.getFile(path, true);
let { res, data: file, filename: pathFile } = type;

if (res && res.status !== 200 || file.length <= 65536) {
try {
throw {
json: JSON.parse(file.toString())
};
} catch (e) {
if (e.json) throw e.json;
}
}

let opt = {
filename
};

if (quoted) opt.quoted = quoted;
if (!type) options.asDocument = true;

let mtype = '',
mimetype = type.mime,
convert;

if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) mtype = 'sticker';
else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) mtype = 'image';
else if (/video/.test(type.mime)) mtype = 'video';
else if (/audio/.test(type.mime)) {
convert = await (ptt ? toPTT : toAudio)(file, type.ext);
file = convert.data;
pathFile = convert.filename;
mtype = 'audio';
mimetype = 'audio/ogg; codecs=opus';
} else mtype = 'document';

if (options.asDocument) mtype = 'document';

delete options.asSticker;
delete options.asLocation;
delete options.asVideo;
delete options.asDocument;
delete options.asImage;

let message = { ...options, caption, ptt, [mtype]: { url: pathFile }, mimetype };
let m;

try {
m = await conn.sendMessage(jid, message, { ...opt, ...options });
} catch (e) {
//console.error(e)
m = null;
} finally {
if (!m) m = await conn.sendMessage(jid, { ...message, [mtype]: file }, { ...opt, ...options });
file = null;
return m;
}
}

conn.sendTextWithMentions = async (jid, text, quoted, options = {}) => conn.sendMessage(jid, { text: text, mentions: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net'), ...options }, { quoted })
//=========================================\\
conn.downloadMediaMessage = async (message) => {
let mime = (message.msg || message).mimetype || ''
let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
const stream = await downloadContentFromMessage(message, messageType)
let buffer = Buffer.from([])
for await(const chunk of stream) {
buffer = Buffer.concat([buffer, chunk])
}
return buffer
}

return conn
}
WhatsAppStart()
}

module.exports = startpairing

let file = require.resolve(__filename)
fs.watchFile(file, () => {
fs.unwatchFile(file)
console.log(`Update ${__filename}`)
delete require.cache[file]
require(file)
})
