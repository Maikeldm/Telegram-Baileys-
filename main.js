// main.js: Telegram + Baileys multiusuario centralizado
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const simple = require('./lib/oke.js');
const smsg = require('./lib/smsg');
const { default: makeWASocket, Browsers, useMultiFileAuthState, DisconnectReason, makeInMemoryStore, jidDecode, proto, getContentType, downloadContentFromMessage } = require('baron-baileys-v2');
const { 
  getUser, 
  updateUserWhatsapp, 
  clearUserWhatsapp, 
  isActive, 
  addOrUpdateVip, 
  db 
} = require('./lib/users');
require('dotenv').config();

const TOKEN = process.env.BOT_TOKEN || 'pon_tu_token_aqui'; // Usa .env
const bot = new TelegramBot(TOKEN, { polling: true });

const activeSessions = {};
const userStates = {};

// --- FUNCIONES CENTRALIZADAS ---

// Cambiar la estructura de pairing: pairing/<telegram_id>/<numero>
async function startSession(telegram_id, number) {
  if (activeSessions[telegram_id]) return activeSessions[telegram_id];
  const sessionPath = path.join(__dirname, 'lib', 'pairing', String(telegram_id), number);
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const store = makeInMemoryStore({ logger: pino({ level: 'silent' }) });
  const conn = simple({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    version: [2, 3000, 1017531287],
    browser: Browsers.ubuntu('Edge'),
    getMessage: async key => {
      const msg = await store.loadMessage(key.remoteJid, key.id);
      return msg?.message || '';
    }
  }, store);

  store.bind(conn.ev);
  conn.ev.on('creds.update', saveCreds);
  conn.public = true;

  // Variables para reconexión estable
  let reconnectTries = 0;
  let reconnectTimeout = null;

  conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      // Solo borra la sesión si el motivo es LOGGED_OUT o FORBIDDEN
      if (
        code === DisconnectReason.loggedOut ||
        code === DisconnectReason.forbidden
      ) {
        console.log('Desconectado permanentemente con código:', code);
        delete activeSessions[telegram_id];
        // Limpia la sesión en disco y en la base de datos
        cleanSession(telegram_id);
        await clearUserWhatsapp(telegram_id);
        // Reinicia el bot para refrescar el menú y el estado global
        setTimeout(() => process.exit(0), 500);
      } else {
        // Intento de reconexión automática para caídas temporales
        reconnectTries++;
        if (reconnectTries <= 5) {
          console.log('Desconexión temporal, reintentando conexión en 3s...');
          clearTimeout(reconnectTimeout);
          reconnectTimeout = setTimeout(() => startSession(telegram_id, number), 3000);
        } else {
          console.log('Demasiados intentos de reconexión fallidos, limpiando sesión...');
          delete activeSessions[telegram_id];
          cleanSession(telegram_id);
          await clearUserWhatsapp(telegram_id);
          setTimeout(() => process.exit(0), 500);
        }
      }
    } else if (connection === 'open') {
      reconnectTries = 0;
      console.log(`WhatsApp ${number} conectado para usuario ${telegram_id}.`);
    }
  });

  activeSessions[telegram_id] = conn;

  function isCommandMessage(m) {
    if (!m || !m.message) return false;
    const mtype = Object.keys(m.message)[0];
    let text = '';
    switch (mtype) {
      case 'conversation': text = m.message.conversation; break;
      case 'extendedTextMessage': text = m.message.extendedTextMessage.text; break;
      case 'imageMessage': text = m.message.imageMessage.caption || ''; break;
      case 'videoMessage': text = m.message.videoMessage.caption || ''; break;
      default: return false;
    }
    return text && (text.trim().startsWith('.') || text.trim().startsWith('/'));
  }

  conn.ev.on('messages.upsert', async chatUpdate => {
    try {
      const mek = chatUpdate.messages[0];
      // Elimina el filtro para probar si responde en grupos
      // if (!isCommandMessage(mek)) return;

      const m = smsg(conn, mek, store);
      require("./bruxin.js")(conn, m, chatUpdate, store);
    } catch (err) {
      console.log(err);
    }
  });

  return conn;
}

function cleanSession(telegram_id) {
  const pairingDir = path.join(__dirname, 'lib', 'pairing', String(telegram_id));
  if (fs.existsSync(pairingDir)) {
    fs.rmSync(pairingDir, { recursive: true, force: true });
  }
  if (activeSessions[telegram_id]) delete activeSessions[telegram_id];
  // En vez de process.exit, recarga el módulo de comandos y el menú para actualizar el estado
  setImmediate(() => {
    // Limpia el require cache y recarga chocoplus.js para refrescar los comandos
    delete require.cache[require.resolve('./chocoplus')];
    require('./chocoplus')(bot, {
      userStates,
      activeSessions,
      cleanSession,
      sendUserMenu,
      defineBuyOptions,
      updateUserWhatsapp,
      clearUserWhatsapp
    });
  });
}

function defineBuyOptions(chatId) {
  const opts = {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Comprar 1 día', url: `https://wa.me/593969533280?text=Quiero%20comprar%201%20d%C3%ADa%20de%20acceso%20al%20bot%20VIP%20para%20mi%20Telegram%20ID%20${chatId}` }],
        [{ text: 'Comprar 7 días', url: `https://wa.me/593969533280?text=Quiero%20comprar%207%20d%C3%ADas%20de%20acceso%20al%20bot%20VIP%20para%20mi%20Telegram%20ID%20${chatId}` }],
        [{ text: 'Comprar 30 días', url: `https://wa.me/593969533280?text=Quiero%20comprar%2030%20d%C3%ADas%20de%20acceso%20al%20bot%20VIP%20para%20mi%20Telegram%20ID%20${chatId}` }],
        [{ text: 'Comprar 365 días', url: `https://wa.me/593969533280?text=Quiero%20comprar%20un%20a%C3%B1o%20de%20acceso%20al%20bot%20VIP%20para%20mi%20Telegram%20ID%20${chatId}` }]
      ]
    }
  };
 return opts;
};
async function sendUserMenu(chatId) {
  // Refresca el usuario desde la base de datos para obtener el estado REAL
  const currentUser = await getUser(chatId);
  if (!currentUser || !isActive(currentUser)) {
    try {
      await bot.sendMessage(chatId, '⛔ No tienes acceso VIP activo.', defineBuyOptions(chatId));
    } catch (e) {}
    return;
  }
  // Verifica si la sesión realmente existe en disco, si no, limpia el campo whatsapp_number
  let whatsappConnected = false;
  if (currentUser.whatsapp_number) {
    const pairingDir = path.join(__dirname, 'lib', 'pairing', String(chatId), currentUser.whatsapp_number);
    const credsPath = path.join(pairingDir, 'creds.json');
    if (fs.existsSync(pairingDir) && fs.existsSync(credsPath)) {
      whatsappConnected = true;
    } else {
      // Si no existe la sesión, limpia el campo y actualiza el usuario
      await clearUserWhatsapp(chatId);
      whatsappConnected = false;
      // Reinicia el proceso para actualizar el menú y el estado global
      setTimeout(() => process.exit(0), 500);
      return;
    }
  }

  const expires = new Date(currentUser.expires);

 let extraButtons = [];
  if (!whatsappConnected) {
    extraButtons.push([{ text: '📱 Conectar WhatsApp', callback_data: 'start_pairing' }]);
  } else {
    extraButtons.push([{ text: '❌ Desconectar WhatsApp', callback_data: 'disconnect_whatsapp' }]);
  }

  function getMenuCaption(expiresDate) {
    const now = new Date();
    let ms = expiresDate - now;
    if (ms < 0) ms = 0;
    const segundos = Math.floor(ms / 1000) % 60;
    const minutos = Math.floor(ms / 60000) % 60;
    const horas = Math.floor(ms / 3600000) % 24;
    const dias = Math.floor(ms / 86400000);
    return `*📱 ZETAS-BOT V4 MENU*\n\n*TIEMPO VIP RESTANTE:* ${dias}d ${horas}h ${minutos}m ${segundos}s\n\n_Selecciona un comando para ejecutar_`;
  }

  let menuMsg = await bot.sendPhoto(chatId, path.join(__dirname, 'src', 'foto.jpg'), {
    caption: getMenuCaption(expires),
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '📱 CRASH ANDROID', callback_data: 'exec_crashwa' }, { text: '📱 CRASH IPHONE', callback_data: 'exec_crash-ios' }],
        [{ text: '💻 CRASH PC', callback_data: 'exec_crash-pc' }, { text: '⚡ ATRASO', callback_data: 'exec_atraso' }],
        ...extraButtons
      ]
    }
  });

let interval = setInterval(() => {
    let ms = expires - new Date();
    if (ms <= 0) {
      clearInterval(interval);
      bot.editMessageCaption('⛔ Tu acceso VIP ha expirado.', { chat_id: chatId, message_id: menuMsg.message_id }).catch(() => {});
      return;
    }
    bot.editMessageCaption(getMenuCaption(expires), {
      chat_id: chatId,
      message_id: menuMsg.message_id,
      parse_mode: 'Markdown',
      reply_markup: menuMsg.reply_markup
    }).catch(() => clearInterval(interval));
  }, 60000);
}

// --- CARGA LOS COMANDOS DE USUARIO DESDE chocoplus.js ---
// Pasamos todas las dependencias que el módulo de comandos necesita
require('./chocoplus')(bot, {
    userStates,
    activeSessions,
    cleanSession,
    sendUserMenu,
    defineBuyOptions,
    updateUserWhatsapp, // <-- Añade esto para que chocoplus.js pueda actualizar el número
    clearUserWhatsapp
});


// --- COMANDOS DE ADMINISTRADOR ---

// Elimina los comandos de admin duplicados de este archivo, ya que ahora están en chocoplus.js
// Borra todo este bloque:

/*
async function sendNotificationToAll(text) {
    db.all('SELECT telegram_id FROM users WHERE expires > ?', [new Date().toISOString()], async (err, rows) => {
        if (err) return;
        for (const row of rows) {
            try {
                await bot.sendMessage(row.telegram_id, `📢 *AVISO IMPORTANTE:*\n\n${text}`, { parse_mode: 'Markdown' });
            } catch (e) {}
        }
    });
}

bot.onText(/\/addvip (\d+) (\d+)/, async (msg, match) => {
  const adminId = 7223378630;
  if (msg.chat.id !== adminId) {
    return bot.sendMessage(msg.chat.id, '⛔ Solo el administrador puede usar este comando.');
  }
  const targetId = parseInt(match[1]);
  const days = parseInt(match[2]);
  if (!targetId || !days || days < 1) {
    return bot.sendMessage(msg.chat.id, '❌ Uso: /addvip <telegram_id> <días>');
  }
  await addOrUpdateVip(targetId, days);
  const user = await getUser(targetId);
  await bot.sendMessage(msg.chat.id, `✅ Se otorgaron ${days} días VIP al usuario ${targetId}.`);
  try {
    const message = user && isActive(user) 
      ? `🎉 ¡Has recibido ${days} días VIP! Ya puedes usar el bot.` 
      : `🎉 ¡Has recibido ${days} días VIP! Si no puedes acceder, espera unos segundos y usa /start.`;
    await bot.sendMessage(targetId, message);
  } catch (e) {
    console.log(`No se pudo notificar al usuario ${targetId} sobre su VIP.`);
  }
});

bot.onText(/\/notificar (.+)/, async (msg, match) => {
  const adminId = 7223378630;
  if (msg.chat.id !== adminId) return;
  const texto = match[1];
  await sendNotificationToAll(texto);
  await bot.sendMessage(adminId, '✅ Notificación enviada a todos los usuarios VIP activos.');
});
*/

// --- PROCESOS DE INICIO Y FONDO ---

// Al iniciar, reconectar automáticamente todas las sesiones guardadas (VIP y FREE)
(async () => {
  // Restaurar sesiones VIP
  db.all('SELECT * FROM users WHERE whatsapp_number != ""', [], async (err, users) => {
    if (err) {
        console.error("Error al leer la base de datos para restaurar sesiones:", err);
        return;
    }
    for (const user of users) {
      const pairingDir = path.join(__dirname, 'lib', 'pairing', String(user.telegram_id), user.whatsapp_number);
      const credsPath = path.join(pairingDir, 'creds.json');
      if (fs.existsSync(pairingDir) && fs.existsSync(credsPath)) {
        try {
          console.log(`Intentando restaurar sesión para usuario ${user.telegram_id} y número ${user.whatsapp_number}...`);
          await startSession(Number(user.telegram_id), user.whatsapp_number);
          console.log(`✅ Sesión restaurada para usuario ${user.telegram_id} y número ${user.whatsapp_number}`);
        } catch (e) {
          console.error(`❌ No se pudo restaurar la sesión para ${user.telegram_id}/${user.whatsapp_number}:`, e);
        }
      } else {
        if (user.whatsapp_number) {
          try {
            await clearUserWhatsapp(user.telegram_id);
            console.log(`Limpieza: Usuario ${user.telegram_id} tenía whatsapp_number pero no sesión, campo limpiado.`);
          } catch (e) {}
        }
      }
    }
    console.log('Restauración de sesiones VIP finalizada.');
  });

  // Restaurar sesiones FREE
  const freePairingRoot = path.join(__dirname, 'lib', 'pairing', 'free');
  if (fs.existsSync(freePairingRoot)) {
    const freeUsers = fs.readdirSync(freePairingRoot);
    for (const freeUserId of freeUsers) {
      const userDir = path.join(freePairingRoot, freeUserId);
      if (!fs.statSync(userDir).isDirectory()) continue;
      const numbers = fs.readdirSync(userDir);
      for (const number of numbers) {
        const sessionDir = path.join(userDir, number);
        const credsPath = path.join(sessionDir, 'creds.json');
        if (fs.existsSync(credsPath)) {
          try {
            console.log(`Intentando restaurar sesión FREE para usuario ${freeUserId} y número ${number}...`);
            await startSession(Number(freeUserId), number);
            console.log(`✅ Sesión FREE restaurada para usuario ${freeUserId} y número ${number}`);
          } catch (e) {
            console.error(`❌ No se pudo restaurar la sesión FREE para ${freeUserId}/${number}:`, e);
          }
        }
      }
    }
    console.log('Restauración de sesiones FREE finalizada.');
  }
})();

// Manejo robusto de errores de Telegram (evita spam de "message to delete not found")
process.on('unhandledRejection', reason => {
  if (reason && reason.response && reason.response.body && reason.response.body.description && reason.response.body.description.includes('message to delete not found')) {
    // Silencia este error específico
    return;
  }
  console.error('Promesa rechazada no capturada:', reason);
});

// Mensaje final de inicio
console.log('Telegram x Baileys conectado com sucesso');

// --- Recarga automática de comandos sin duplicar listeners ---
// Elimina la recarga automática, solo deja la función para recarga manual si la necesitas
// let isReloading = false;
// function reloadChocoplus() {
//   if (isReloading) return;
//   isReloading = true;
//   try {
//     bot.removeAllListeners();
//     delete require.cache[require.resolve('./chocoplus')];
//     require('./chocoplus')(bot, {
//       userStates,
//       activeSessions,
//       cleanSession,
//       sendUserMenu,
//       defineBuyOptions,
//       updateUserWhatsapp,
//       clearUserWhatsapp
//     });
//     console.log('Comandos recargados  correctamente.');
//   } catch (e) {
//     console.error('Error al recargar comandos:', e);
//   }
//   setTimeout(() => { isReloading = false; }, 1000); // Evita recargas múltiples en 1s
// }

// // Recarga automática si main.js o chocoplus.js cambian
// ['main.js', 'chocoplus.js'].forEach(file => {
//   fs.watchFile(path.join(__dirname, file), () => {
//     console.log(`Archivo ${file} modificado. Recargando comandos...`);
//     reloadChocoplus();
//   });
// });

// // Recarga automática de comandos cada 8 minutos (sin apagar la consola)
// setInterval(() => {
//   console.log('Recarga automática de comandos (intervalo 8 minutos)...');
//   reloadChocoplus();
// }, 8 * 60 * 1000);

// Asegúrate de que todas las referencias a users.json sean:
const usersPath = path.join(__dirname, 'lib', 'users.json');

// Ejemplo de uso:
const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));