// main.js: Telegram + Baileys multiusuario centralizado
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const simple = require('./lib/oke.js');
const smsg = require('./lib/smsg');
const { default: makeWASocket, Browsers, useMultiFileAuthState, DisconnectReason, makeInMemoryStore, jidDecode, proto, getContentType, downloadContentFromMessage } = require('@adiwajshing/baileys');

const TOKEN = '8171241707:AAEDHi2KRbBBld-F15-Te2oBxkaBN4fuF08'; //pon tu token klona 
const bot = new TelegramBot(TOKEN, { polling: true });

const USERS_FILE = path.join(__dirname, 'users.json');
const activeSessions = {};

// juegos de hacer el amor.com
const userStates = {};

// alchilenose

function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) return { users: [] };
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

function saveUsers(data) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

function getUser(telegram_id) {
  const data = loadUsers();
  let user = data.users.find(u => u.telegram_id === telegram_id);
  // Pon tu id de telegram para ser admin :c
  if (telegram_id === 7223378630) {
    if (!user) {
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 10);
      user = { telegram_id, whatsapp_number: '', expires: expires.toISOString(), is_admin: true };
      data.users.push(user);
      saveUsers(data);
    } else if (!user.is_admin) {
      user.is_admin = true;
      saveUsers(data);
    }
  }
  return user;
}

// sekzo
function updateUserWhatsapp(telegram_id, number) {
  const data = loadUsers();
  const user = data.users.find(u => u.telegram_id === telegram_id);
  if (user) {
    user.whatsapp_number = number;
    saveUsers(data);
  }
  return user;
}

// viva mia khalifa
function clearUserWhatsapp(telegram_id) {
  const data = loadUsers();
  const user = data.users.find(u => u.telegram_id === telegram_id);
  if (user) {
    user.whatsapp_number = '';
    saveUsers(data);
  }
  return user;
}

function isActive(user) {
  return user && new Date(user.expires) > new Date();
}

// cambiar rutas para guardar sesiones , fue modificado con bot.js para que funcione  
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

  conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      console.log('Desconectado con código:', code);
      const data = loadUsers();
      const user = data.users.find(u => u.telegram_id === telegram_id);
      if ([401, 403, DisconnectReason.loggedOut, DisconnectReason.forbidden].includes(code)) {
        if (user) {
          clearUserWhatsapp(user.telegram_id);
          const disconnectMsg = await bot.sendMessage(user.telegram_id,
            '❌ *WhatsApp se ha desconectado*\n\nLa sesión fue cerrada desde el dispositivo.', {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '📱 Conectar WhatsApp', callback_data: 'start_pairing' }]
              ]
            }
          });
          setTimeout(() => bot.deleteMessage(user.telegram_id, disconnectMsg.message_id), 10000);
        }
        // Borra la carpeta de la sesión específica
        const sessionDir = path.join(__dirname, 'lib', 'pairing', String(telegram_id), number);
        if (fs.existsSync(sessionDir)) {
          fs.rmSync(sessionDir, { recursive: true, force: true });
        }
        // Si ya no quedan números, borra la carpeta del usuario
        const userDir = path.join(__dirname, 'lib', 'pairing', String(telegram_id));
        if (fs.existsSync(userDir) && fs.readdirSync(userDir).length === 0) {
          fs.rmSync(userDir, { recursive: true, force: true });
        }
        delete activeSessions[telegram_id];
        return;
      }
      delete activeSessions[telegram_id];
    } else if (connection === 'open') {
      console.log(`WhatsApp ${number} conectado para usuario ${telegram_id}.`);
      const data = loadUsers();
      const user = data.users.find(u => u.telegram_id === telegram_id);
      if (user) {
        const successMsg = await bot.sendMessage(user.telegram_id,
          '✅ *¡WhatsApp conectado exitosamente!*\n\nYa puedes usar el menú de comandos.', {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📜 Ver Menú', callback_data: 'show_menu' }],
              [{ text: '❌ DESCONECTAR', callback_data: 'disconnect_whatsapp' }]
            ]
          }
        });
        setTimeout(() => bot.deleteMessage(user.telegram_id, successMsg.message_id), 100000);
      }
    }
  });

  activeSessions[telegram_id] = conn;

  function isCommandMessage(m) {
    if (!m || !m.message) return false;
    const mtype = Object.keys(m.message)[0];
    let text = '';
    switch (mtype) {
      case 'conversation':
        text = m.message.conversation;
        break;
      case 'extendedTextMessage':
        text = m.message.extendedTextMessage.text;
        break;
      case 'imageMessage':
        text = m.message.imageMessage.caption || '';
        break;
      case 'videoMessage':
        text = m.message.videoMessage.caption || '';
        break;
      default:
        return false;
    }
    return text && (text.trim().startsWith('.') || text.trim().startsWith('/'));
  }

  conn.ev.on('messages.upsert', async chatUpdate => {
    try {
      const mek = chatUpdate.messages[0];
      if (!isCommandMessage(mek)) return;
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
}

// Opciones de compra para usuarios no VIP
defineBuyOptions = (chatId) => {
  const opts = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Comprar 1 día', url: 'https://wa.me/593969533280?text=Quiero%20comprar%201%20d%C3%ADa%20de%20acceso%20al%20bot%20VIP%20para%20mi%20Telegram%20ID%20' + chatId },
          { text: 'Comprar 7 días', url: 'https://wa.me/593969533280?text=Quiero%20comprar%207%20d%C3%ADas%20de%20acceso%20al%20bot%20VIP%20para%20mi%20Telegram%20ID%20' + chatId }
        ],
        [
          { text: 'Comprar 30 días', url: 'https://wa.me/593969533280?text=Quiero%20comprar%2030%20d%C3%ADas%20de%20acceso%20al%20bot%20VIP%20para%20mi%20Telegram%20ID%20' + chatId },
          { text: 'Comprar 365 días', url: 'https://wa.me/593969533280?text=Quiero%20comprar%20un%20a%C3%B1o%20de%20acceso%20al%20bot%20VIP%20para%20mi%20Telegram%20ID%20' + chatId }
        ]
      ]
    }
  };
  return opts;
};

// Helper para autodelete mensajes después de 15 minutos
function autoDelete(msgObj, chatId) {
  if (msgObj && msgObj.message_id) {
    setTimeout(() => {
      bot.deleteMessage(chatId, msgObj.message_id).catch(() => {});
    }, 900000); // 15 minutos
  }
}

// Modificar /start para añadir botones
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  let user = getUser(chatId);
  const message = await bot.sendMessage(chatId, `👋 ¡Bienvenido a Zetas-Bot V4!\n\n${
    !user ? '⚠️ Necesitas ser VIP para usar el bot.' :
    !isActive(user) ? '⛔ Tu acceso VIP ha expirado.' :
    user.whatsapp_number ? '✅ Ya tienes WhatsApp conectado.' :
    '✅ Eres usuario VIP activo.'
  }`, {
    reply_markup: {
      inline_keyboard: [
        ...((!user || !isActive(user)) ? [
          [{ text: '💎 Comprar Acceso VIP', callback_data: 'show_prices' }]
        ] : user.whatsapp_number ? [
          [{ text: '📜 Ver Menú', callback_data: 'show_menu' }],
          [{ text: '❌ Desconectar WhatsApp', callback_data: 'disconnect_whatsapp' }]
        ] : [
          [{ text: '📱 Conectar WhatsApp', callback_data: 'start_pairing' }]
        ])
      ]
    }
  });
  setTimeout(() => bot.deleteMessage(chatId, message.message_id), 30000);
  autoDelete(message, chatId);
});

// Agregar manejador para el botón de pairing
bot.onText(/\/pairing(?:\s+(\d{10,15}))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  let user = getUser(chatId);
  
  if (!user || !isActive(user)) {
    const message = await bot.sendMessage(chatId, '⛔ No tienes acceso VIP activo.', defineBuyOptions(chatId));
    setTimeout(() => bot.deleteMessage(chatId, message.message_id), 10000);
    autoDelete(message, chatId);
    return;
  }

  const keyboard = {
    inline_keyboard: [
      [{ text: '📱 Ingresar Número', callback_data: 'input_number' }],
      [{ text: '❌ Cancelar', callback_data: 'cancel_pairing' }]
    ]
  };

  const message = await bot.sendMessage(chatId, 
    '🔄 *Conexión WhatsApp*\n\n' +
    'Para conectar tu WhatsApp, presiona el botón "Ingresar Número" y envía tu número en formato internacional.\n\n' +
    'Ejemplo: 521234567890', {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
  setTimeout(() => bot.deleteMessage(chatId, message.message_id), 30000);
  autoDelete(message, chatId);
});

// Modificar las constantes del menú
const menuText = `
*📱 ZETAS-BOT V4 MENU*

*COMANDOS DISPONIBLES:*

*ANDROID:*
• !crash-android - Crash para Android
• !crashwa - Crash WhatsApp general

*IPHONE:*
• !crash-ios - Crash para iPhone
• !crash-ios2 - Crash iPhone alternativo

*PC:*
• !crash-pc - Crash para WhatsApp Web/Desktop
• !atraso - Crash de atraso general

_Selecciona un comando para ejecutar_
`;

const menuButtons = {
  parse_mode: 'Markdown',
  reply_markup: {
    inline_keyboard: [
      [
        { text: '📱 CRASH ANDROID', callback_data: 'exec_crashwa' },
        { text: '📱 CRASH IPHONE', callback_data: 'exec_crash-ios' }
      ],
      [
        { text: '💻 CRASH PC', callback_data: 'exec_crash-pc' },
        { text: '⚡ ATRASO', callback_data: 'exec_atraso' }
      ],
      [{ text: '❌ Cerrar Menú', callback_data: 'close_menu' }]
    ]
  }
};

// Modificar el callback handler para manejar mejor el input_number
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const data = query.data;

  switch(data) {
    case 'show_prices':
      // Borrar el mensaje anterior antes de mostrar las opciones de compra
      try {
        await bot.deleteMessage(chatId, messageId);
      } catch (e) {}
      const buyMsg = await bot.sendMessage(chatId, '💎 *Opciones de compra de acceso VIP*', defineBuyOptions(chatId));
      // No se borra automáticamente
      break;

    case 'start_pairing':
    case 'input_number':
      // Borrar el mensaje anterior antes de continuar
      try {
        await bot.deleteMessage(chatId, messageId);
      } catch (e) {}
      userStates[chatId] = { awaitingPairingNumber: true };
      const pairingMsg = await bot.sendMessage(chatId, 
        '*📱 CONEXIÓN WHATSAPP*\n\n' +
        'Envía tu número de WhatsApp en formato internacional\n' +
        'Ejemplo: 593969533280\n\n' +
        '_El código de emparejamiento se enviará aquí_', {
        parse_mode: 'Markdown',
        reply_markup: {
          force_reply: true, // Forzar respuesta
          selective: true,
          inline_keyboard: [[
            { text: '❌ Cancelar', callback_data: 'cancel_pairing' }
          ]]
        }
      });
      userStates[chatId].messageId = pairingMsg.message_id;
      break;

    case 'cancel_pairing':
      if (userStates[chatId]?.messageId) {
        try {
          await bot.deleteMessage(chatId, userStates[chatId].messageId);
        } catch (e) {}
      }
      delete userStates[chatId];
      const cancelMsg = await bot.sendMessage(chatId, '❌ Operación cancelada');
      setTimeout(() => bot.deleteMessage(chatId, cancelMsg.message_id), 5000);
      break;

    case 'show_menu':
      await sendUserMenu(chatId);
      break;

    case 'close_menu':
      // No necesitamos hacer nada más aquí ya que el mensaje ya se borró arriba
      break;

    case 'disconnect_whatsapp':
      cleanSession(chatId);
      clearUserWhatsapp(chatId);
      // Recargar users.json y limpiar sesión activa en memoria
      loadUsers();
      if (activeSessions[chatId]) delete activeSessions[chatId];
      await bot.sendMessage(chatId, '❌ Sesión de WhatsApp desconectada. Ahora puedes conectar otro número.', {
        reply_markup: {
          inline_keyboard: [[{ text: '📱 Conectar WhatsApp', callback_data: 'start_pairing' }]]
        }
      });
      break;

    // ...resto de los casos existentes...
  }
});

// Panel de administración solo para admin
bot.onText(/\/admin/, async (msg) => {
  const adminId = 7223378630;
  if (msg.chat.id !== adminId) return;
  const data = loadUsers();
  let texto = `👑 <b>Panel Admin</b>\n\n<b>Usuarios VIP:</b> ${data.users.length}\n`;
  texto += data.users.map(u => `• <b>ID:</b> <code>${u.telegram_id}</code> | <b>Expira:</b> ${u.expires.split('T')[0]} | <b>WA:</b> ${u.whatsapp_number || 'No vinculado'}`).join('\n');
  const adminMsg = await bot.sendMessage(adminId, texto, { parse_mode: 'HTML' });
  autoDelete(adminMsg, adminId);
});

// Backup automático de users.json y sesiones cada 6 horas
setInterval(() => {
  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
  const fecha = new Date().toISOString().replace(/[:.]/g, '-');
  // Backup users.json
  fs.copyFileSync(USERS_FILE, path.join(backupDir, `users-${fecha}.json`));
  // Backup sesiones
  const pairingDir = path.join(__dirname, 'lib', 'pairing');
  if (fs.existsSync(pairingDir)) {
    const dest = path.join(backupDir, `pairing-${fecha}`);
    fs.cpSync(pairingDir, dest, { recursive: true });
  }
  console.log('Backup automático realizado.');
}, 6 * 60 * 60 * 1000); // cada 6 horas

// Recarga automática si main.js o config.js cambian
['main.js', 'config.js'].forEach(file => {
  fs.watchFile(path.join(__dirname, file), () => {
    console.log(`Archivo ${file} modificado. Reiniciando...`);
    process.exit(0);
  });
});

// Al iniciar, reconectar automáticamente todas las sesiones guardadas
(async () => {
  const pairingDir = path.join(__dirname, 'lib', 'pairing');
  if (fs.existsSync(pairingDir)) {
    const userDirs = fs.readdirSync(pairingDir).filter(f => fs.statSync(path.join(pairingDir, f)).isDirectory());
    const users = loadUsers().users;
    for (const userId of userDirs) {
      const user = users.find(u => String(u.telegram_id) === userId);
      if (!user) continue;
      const numberDirs = fs.readdirSync(path.join(pairingDir, userId)).filter(f => fs.statSync(path.join(pairingDir, userId, f)).isDirectory());
      for (const number of numberDirs) {
        const credsPath = path.join(pairingDir, userId, number, 'creds.json');
        if (fs.existsSync(credsPath)) {
          try {
            await startSession(Number(userId), number);
            updateUserWhatsapp(Number(userId), number); // Actualiza el campo whatsapp_number al restaurar
            console.log(`Sesión restaurada para usuario ${userId} y número ${number}`);
          } catch (e) {
            console.error(`No se pudo restaurar la sesión para ${userId}/${number}:`, e);
          }
        }
      }
    }
  }
})();

console.log('Bot Telegram + WhatsApp listo.');

process.on('uncaughtException', err => {
  console.error('Error no capturado:', err);
});

process.on('unhandledRejection', reason => {
  console.error('Promesa rechazada no capturada:', reason);
});

// Comando para que el admin otorgue días VIP a un usuario
bot.onText(/\/addvip (\d+) (\d+)/, async (msg, match) => {
  const adminId = 7223378630;
  const chatId = msg.chat.id;
  if (chatId !== adminId) {
    await bot.sendMessage(chatId, '⛔ Solo el administrador puede usar este comando.');
    return;
  }
  const targetId = parseInt(match[1]);
  const days = parseInt(match[2]);
  if (!targetId || !days || days < 1) {
    await bot.sendMessage(chatId, '❌ Uso: /addvip <telegram_id> <días>');
    return;
  }
  let data = loadUsers();
  let user = data.users.find(u => u.telegram_id === targetId);
  const now = new Date();
  if (!user) {
    // Crear usuario nuevo
    const expires = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    user = { telegram_id: targetId, whatsapp_number: '', expires: expires.toISOString(), is_admin: false };
    data.users.push(user);
  } else {
    // Sumar días a la fecha actual o a la fecha de expiración existente
    let expires = new Date(user.expires);
    if (expires < now) expires = now;
    expires.setDate(expires.getDate() + days);
    user.expires = expires.toISOString();
  }
  saveUsers(data);
  await bot.sendMessage(chatId, `✅ Se otorgaron ${days} días VIP al usuario ${targetId}.`);
  try {
    await bot.sendMessage(targetId, `🎉 ¡Has recibido ${days} días VIP! Ya puedes usar el bot.`);
  } catch (e) {}
});

// MENÚ ÚNICO Y TEMPORIZADOR EN VIVO
function getMenuCaption(expires) {
  const now = new Date();
  let ms = expires - now;
  if (ms < 0) ms = 0;
  const segundos = Math.floor(ms / 1000) % 60;
  const minutos = Math.floor(ms / 60000) % 60;
  const horas = Math.floor(ms / 3600000) % 24;
  const dias = Math.floor(ms / 86400000);
  return `*📱 ZETAS-BOT V4 MENU*\n\n*TIEMPO VIP RESTANTE:* ${dias}d ${horas}h ${minutos}m ${segundos}s\n\n_Selecciona un comando para ejecutar_`;
}

async function sendUserMenu(chatId) {
  const currentUser = getUser(chatId);
  if (!currentUser || !isActive(currentUser)) {
    try {
      await bot.sendMessage(chatId, '⛔ No tienes acceso VIP activo.', defineBuyOptions(chatId));
    } catch (e) {}
    return;
  }
  const expires = new Date(currentUser.expires);
  // Botones según estado de vinculación
  let extraButtons = [];
  if (!currentUser.whatsapp_number) {
    extraButtons.push([{ text: '📱 Conectar WhatsApp', callback_data: 'start_pairing' }]);
  } else {
    extraButtons.push([{ text: '❌ Desconectar WhatsApp', callback_data: 'disconnect_whatsapp' }]);
  }
  let menuMsg = await bot.sendPhoto(chatId, path.join(__dirname, 'src', 'foto.jpg'), {
    caption: getMenuCaption(expires),
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📱 CRASH ANDROID', callback_data: 'exec_crashwa' },
          { text: '📱 CRASH IPHONE', callback_data: 'exec_crash-ios' }
        ],
        [
          { text: '💻 CRASH PC', callback_data: 'exec_crash-pc' },
          { text: '⚡ ATRASO', callback_data: 'exec_atraso' }
        ],
        ...extraButtons
      ]
    }
  });
  // Temporizador en vivo (edita el caption cada 60 segundos)
  let interval = setInterval(async () => {
    let ms = expires - new Date();
    if (ms < 0) ms = 0;
    try {
      await bot.editMessageCaption(getMenuCaption(expires), {
        chat_id: chatId,
        message_id: menuMsg.message_id,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📱 CRASH ANDROID', callback_data: 'exec_crashwa' },
              { text: '📱 CRASH IPHONE', callback_data: 'exec_crash-ios' }
            ],
            [
              { text: '💻 CRASH PC', callback_data: 'exec_crash-pc' },
              { text: '⚡ ATRASO', callback_data: 'exec_atraso' }
            ],
            ...extraButtons
          ]
        }
      });
    } catch (e) { clearInterval(interval); }
    if (ms <= 0) clearInterval(interval);
  }, 60000);
}
