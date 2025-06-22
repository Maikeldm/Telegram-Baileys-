// main.js: Telegram + Baileys multiusuario centralizado
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const simple = require('./lib/oke.js');
const smsg = require('./lib/smsg');
const { default: makeWASocket, Browsers, useMultiFileAuthState, DisconnectReason, makeInMemoryStore, jidDecode, proto, getContentType, downloadContentFromMessage } = require('@adiwajshing/baileys');
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

const DB_FILE = path.join(__dirname, 'users.db');
const activeSessions = {};
const userStates = {};

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

  conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      console.log('Desconectado con código:', code);
      // ...aquí puedes agregar lógica si quieres...
      delete activeSessions[telegram_id];
    } else if (connection === 'open') {
      console.log(`WhatsApp ${number} conectado para usuario ${telegram_id}.`);
      // ...aquí puedes agregar lógica si quieres...
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





// Modificar /start para añadir botones
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  let user = await getUser(chatId);
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

  // Auto-borrar después de 30 segundos
setTimeout(() => bot.deleteMessage(chatId, message.message_id), 30000);
});

// Agregar manejador para el botón de pairing
bot.onText(/\/pairing(?:\s+(\d{10,15}))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  let user = await getUser(chatId);
  
  if (!user || !isActive(user)) {
    const message = await bot.sendMessage(chatId, '⛔ No tienes acceso VIP activo.', defineBuyOptions(chatId));
setTimeout(() => bot.deleteMessage(chatId, message.message_id), 10000);
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

// Agregar handler para comando /menu
bot.onText(/\/menu/, async (msg) => {
  const chatId = msg.chat.id;
  const currentUser = await getUser(chatId);
  try { await bot.deleteMessage(chatId, msg.message_id); } catch (e) {}
  // Solo permitir si es VIP y activo
  if (!currentUser || !isActive(currentUser)) {
    const errorMsg = await bot.sendMessage(chatId,
      '⛔ No tienes acceso VIP activo.', defineBuyOptions(chatId));
    setTimeout(() => { try { bot.deleteMessage(chatId, errorMsg.message_id); } catch (e) {} }, 10000);
    return;
  }
  await sendUserMenu(chatId);
});

// Modificar el manejador de mensajes para el pairing
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const messageId = msg.message_id;

  // Si está esperando número de teléfono
  if (userStates[chatId]?.awaitingPairingNumber) {
    // Borrar mensaje del usuario
    try {
      await bot.deleteMessage(chatId, messageId);
    } catch (e) {}

    // Validar el número
    const number = msg.text?.replace(/[^0-9]/g, '');
    
    if (!/^\d{10,15}$/.test(number)) {
      const errorMsg = await bot.sendMessage(chatId, 
        '❌ *ERROR*: Número inválido\n' +
        'Debe tener entre 10 y 15 dígitos\n' +
        'Ejemplo: 593969533280', {
        parse_mode: 'Markdown'
      });
      setTimeout(() => bot.deleteMessage(chatId, errorMsg.message_id), 5000);
      return;
    }

    // Borrar mensaje de solicitud anterior
    if (userStates[chatId].messageId) {
      try {
        await bot.deleteMessage(chatId, userStates[chatId].messageId);
      } catch (e) {}
    }

    // Continuar con el proceso de pairing
    // Eliminar cualquier sesión previa del usuario
    const userPairingDir = path.join(__dirname, 'lib', 'pairing', String(chatId));
    if (fs.existsSync(userPairingDir)) {
      fs.rmSync(userPairingDir, { recursive: true, force: true });
    }
    // Crear la nueva ruta de sesión para este usuario y número
    const sessionPath = path.join(__dirname, 'lib', 'pairing', String(chatId), number);
    fs.mkdirSync(sessionPath, { recursive: true });

    let processingMsg;
    try {
      processingMsg = await bot.sendMessage(chatId, '🔄 Generando código de conexión...');
    } catch (e) {}

    try {
      // Iniciar proceso de pairing
      const startpairing = require('./bot.js');
      await startpairing(number, sessionPath); // Asegúrate que bot.js use sessionPath

      // Esperar el código
      let tries = 0;
      let code = null;
      const pairingFile = path.join(sessionPath, 'pairing.json');
      while (tries < 30 && !code) {
        if (fs.existsSync(pairingFile)) {
          try {
            const data = JSON.parse(fs.readFileSync(pairingFile));
            code = data.code;
          } catch (e) {
            console.error('Error leyendo código:', e);
          }
        }
        if (!code) {
          await new Promise(r => setTimeout(r, 1000));
          tries++;
        }
      }

      // Borrar mensaje de procesamiento
      if (processingMsg) try { await bot.deleteMessage(chatId, processingMsg.message_id); } catch (e) {}

      if (code) {
        try {
          const pairingMsg = await bot.sendMessage(chatId,
            '✅ *CÓDIGO DE CONEXIÓN GENERADO*\n\n' +
            `\`${code}\`\n\n` +
            '1️⃣ Abre WhatsApp\n' +
            '2️⃣ Ve a Ajustes > Dispositivos vinculados\n' +
            '3️⃣ Toca en "Vincular dispositivo"\n' +
            '4️⃣ Ingresa el código mostrado arriba\n\n' +
            '_El código expirará en 60 segundos_', {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '🔄 Generar nuevo código', callback_data: 'start_pairing' }]
                ]
              }
            }
          );
          setTimeout(() => bot.deleteMessage(chatId, pairingMsg.message_id), 60000);
        } catch (e) {}
        // Esperar conexión exitosa
        let connected = false;
        tries = 0;
        let successMsgId = null;
        while (tries < 60 && !connected) {
          if (fs.existsSync(path.join(sessionPath, 'creds.json'))) {
            connected = true;
            try {
              const successMsg = await bot.sendMessage(chatId,
                '✅ *¡WHATSAPP CONECTADO!*\n\n' +
                'Ya puedes usar el menú de comandos', {
                  parse_mode: 'Markdown',
                  reply_markup: {
                    inline_keyboard: [
                      [{ text: '📜 Ver Menú', callback_data: 'show_menu' }]
                    ]
                  }
                }
              );
              successMsgId = successMsg.message_id;
            } catch (e) {}
            break;
          }
          await new Promise(r => setTimeout(r, 1000));
          tries++;
        }
        // Esperar a que el usuario presione "Ver Menú" y borrar el mensaje
        if (successMsgId) {
          const handler = async (query) => {
            if (query.data === 'show_menu' && query.message.message_id === successMsgId && query.message.chat.id === chatId) {
              try { await bot.deleteMessage(chatId, successMsgId); } catch (e) {}
              bot.removeListener('callback_query', handler);
            }
          };
          bot.on('callback_query', handler);
        }
      } else {
        try {
          const errorMsg = await bot.sendMessage(chatId,
            '❌ No se pudo generar el código. Intenta nuevamente.', {
              reply_markup: {
                inline_keyboard: [
                  [{ text: '🔄 Reintentar', callback_data: 'start_pairing' }]
                ]
              }
            }
          );
          setTimeout(() => bot.deleteMessage(chatId, errorMsg.message_id), 5000);
        } catch (e) {}
      }
    } catch (e) {
      console.error('Error en proceso de pairing:', e);
      try {
        await bot.sendMessage(chatId, '❌ Error al generar código. Contacta al administrador.');
      } catch (err) {}
    }

    delete userStates[chatId];
    return;
  }
});

// Panel de administración solo para admin
bot.onText(/\/admin/, async (msg) => {
  const adminId = 7223378630;
  if (msg.chat.id !== adminId) return;
  db.all('SELECT * FROM users', [], (err, rows) => {
    let texto = `👑 <b>Panel Admin</b>\n\n<b>Usuarios VIP:</b> ${rows.length}\n`;
    texto += rows.map(u => `• <b>ID:</b> <code>${u.telegram_id}</code> | <b>Expira:</b> ${u.expires.split('T')[0]} | <b>WA:</b> ${u.whatsapp_number || 'No vinculado'}`).join('\n');
    bot.sendMessage(adminId, texto, { parse_mode: 'HTML' });
  });
});

// Backup automático de users.json y sesiones cada 6 horas
setInterval(() => {
  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
  const fecha = new Date().toISOString().replace(/[:.]/g, '-');
  // Backup de la base de datos SQLite en vez de users.json
  const dbBackup = path.join(backupDir, `users-${fecha}.db`);
  fs.copyFileSync(DB_FILE, dbBackup);
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
  db.all('SELECT * FROM users WHERE whatsapp_number != ""', [], async (err, users) => {
    for (const user of users) {
      const pairingDir = path.join(__dirname, 'lib', 'pairing', String(user.telegram_id), user.whatsapp_number);
      const credsPath = path.join(pairingDir, 'creds.json');
      if (fs.existsSync(credsPath)) {
        try {
          await startSession(Number(user.telegram_id), user.whatsapp_number);
          console.log(`Sesión restaurada para usuario ${user.telegram_id} y número ${user.whatsapp_number}`);
        } catch (e) {
          console.error(`No se pudo restaurar la sesión para ${user.telegram_id}/${user.whatsapp_number}:`, e);
        }
      }
    }
  });
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
  await addOrUpdateVip(targetId, days);
  // Espera a que el usuario esté en la base de datos antes de enviar el mensaje
  const user = await getUser(targetId);
  await bot.sendMessage(chatId, `✅ Se otorgaron ${days} días VIP al usuario ${targetId}.`);
  try {
    if (user && isActive(user)) {
      await bot.sendMessage(targetId, `🎉 ¡Has recibido ${days} días VIP! Ya puedes usar el bot.`);
    } else {
      await bot.sendMessage(targetId, `🎉 ¡Has recibido ${days} días VIP! Si no puedes acceder, espera unos segundos y usa /start.`);
    }
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
  const currentUser = await getUser(chatId);
  if (!currentUser || !isActive(currentUser)) {
    try {
      await bot.sendMessage(chatId, '⛔ No tienes acceso VIP activo.', defineBuyOptions(chatId));
    } catch (e) {}
    return;
  }
  const expires = new Date(currentUser.expires);


  //forever mia khalifa
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

  // setInterval NO puede ser async, así que NO uses await directamente aquí.
  let interval = setInterval(() => {
    let ms = expires - new Date();
    if (ms < 0) ms = 0;
    bot.editMessageCaption(getMenuCaption(expires), {
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
    }).catch(() => { clearInterval(interval); });
    if (ms <= 0) clearInterval(interval);
  }, 60000);
}

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

// Ejemplo de comando solo para admin para enviar notificación masiva
bot.onText(/\/notificar (.+)/, async (msg, match) => {
  const adminId = 7223378630;
  if (msg.chat.id !== adminId) return;
  const texto = match[1];
  await sendNotificationToAll(texto);
  await bot.sendMessage(adminId, '✅ Notificación enviada a todos los usuarios VIP activos.');
});
    