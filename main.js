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

// Agregar objeto global para manejar estados de usuarios
const userStates = {};

// Estado global para el menú
const menuOpts = {
  parse_mode: 'HTML',
  reply_markup: {
    inline_keyboard: [
      [
        { text: '🤖 MENÚ ANDROID', callback_data: 'menu_android' },
        { text: '📱 MENÚ IPHONE', callback_data: 'menu_ios' }
      ],
      [
        { text: '💻 MENÚ PC', callback_data: 'menu_pc' }
      ],
      [
        { text: '❌ Cerrar Menú', callback_data: 'close_menu' }
      ]
    ]
  }
};

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
  // Forzar admin si es el ID del dueño
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

// Agregar función para actualizar número de WhatsApp
function updateUserWhatsapp(telegram_id, number) {
  const data = loadUsers();
  const user = data.users.find(u => u.telegram_id === telegram_id);
  if (user) {
    user.whatsapp_number = number;
    saveUsers(data);
  }
  return user;
}

// Agregar función para limpiar número de WhatsApp
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
        fs.rmSync(sessionPath, { recursive: true, force: true });
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

  // Auto-borrar después de 30 segundos
  setTimeout(() => bot.deleteMessage(chatId, message.message_id), 30000);
});

// Agregar manejador para el botón de pairing
bot.onText(/\/pairing(?:\s+(\d{10,15}))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  let user = getUser(chatId);
  
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
      const currentUser = getUser(chatId);
      if (!currentUser || !isActive(currentUser) || !currentUser.whatsapp_number || !activeSessions[chatId] || !activeSessions[chatId].user || activeSessions[chatId].user !== currentUser.whatsapp_number) {
        const errorMsg = await bot.sendMessage(chatId,
          '❌ *ERROR*: Debes conectar WhatsApp primero', {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '📱 Conectar WhatsApp', callback_data: 'start_pairing' }]]
          }
        });
        setTimeout(() => { try { bot.deleteMessage(chatId, errorMsg.message_id); } catch (e) {} }, 5000);
        return;
      }
      // Calcular tiempo restante
      const expires = new Date(currentUser.expires);
      const now = new Date();
      let ms = expires - now;
      if (ms < 0) ms = 0;
      const segundos = Math.floor(ms / 1000) % 60;
      const minutos = Math.floor(ms / 60000) % 60;
      const horas = Math.floor(ms / 3600000) % 24;
      const dias = Math.floor(ms / 86400000);
      const tiempoRestante = `${dias}d ${horas}h ${minutos}m ${segundos}s`;
      await bot.sendPhoto(chatId, path.join(__dirname, 'src', 'foto.jpg'), {
        caption: `*📱 ZETAS-BOT V4 MENU*\n\n*TIEMPO VIP RESTANTE:* ${tiempoRestante}\n\n_Selecciona un comando para ejecutar_`,
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
            [
              { text: '❌ DESCONECTAR', callback_data: 'disconnect_whatsapp' }
            ]
          ]
        }
      });
      break;

    case 'close_menu':
      // No necesitamos hacer nada más aquí ya que el mensaje ya se borró arriba
      break;

    case 'disconnect_whatsapp':
      cleanSession(chatId);
      clearUserWhatsapp(chatId);
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
  const currentUser = getUser(chatId);
  try { await bot.deleteMessage(chatId, msg.message_id); } catch (e) {}
  // Solo permitir si es VIP y activo
  if (!currentUser || !isActive(currentUser)) {
    const errorMsg = await bot.sendMessage(chatId,
      '⛔ No tienes acceso VIP activo.', defineBuyOptions(chatId));
    setTimeout(() => { try { bot.deleteMessage(chatId, errorMsg.message_id); } catch (e) {} }, 10000);
    return;
  }
  // Validar correctamente la sesión activa
  if (!currentUser?.whatsapp_number || !activeSessions[chatId] || !activeSessions[chatId].user || activeSessions[chatId].user !== currentUser.whatsapp_number) {
    const errorMsg = await bot.sendMessage(chatId,
      '❌ *ERROR*: Debes conectar WhatsApp primero', {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '📱 Conectar WhatsApp', callback_data: 'start_pairing' }]]
      }
    });
    setTimeout(() => { try { bot.deleteMessage(chatId, errorMsg.message_id); } catch (e) {} }, 5000);
    return;
  }
  // Calcular tiempo restante
  const expires = new Date(currentUser.expires);
  const now = new Date();
  let ms = expires - now;
  if (ms < 0) ms = 0;
  const segundos = Math.floor(ms / 1000) % 60;
  const minutos = Math.floor(ms / 60000) % 60;
  const horas = Math.floor(ms / 3600000) % 24;
  const dias = Math.floor(ms / 86400000);
  const tiempoRestante = `${dias}d ${horas}h ${minutos}m ${segundos}s`;
  // Enviar foto, menú y contador
  await bot.sendPhoto(chatId, path.join(__dirname, 'src', 'foto.jpg'), {
    caption: `*📱 ZETAS-BOT V4 MENU*\n\n*TIEMPO VIP RESTANTE:* ${tiempoRestante}\n\n_Selecciona un comando para ejecutar_`,
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
        [
          { text: '❌ DESCONECTAR', callback_data: 'disconnect_whatsapp' }
        ]
      ]
    }
  });
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
    const processingMsg = await bot.sendMessage(chatId, '🔄 Generando código de conexión...');

    try {
      // Limpiar sesión anterior si existe
      const sessionPath = path.join(__dirname, 'lib', 'pairing', number);
      if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
      }

      // Crear directorios necesarios
      const pairingDir = path.join(__dirname, 'lib', 'pairing', number);
      if (!fs.existsSync(pairingDir)) {
        fs.mkdirSync(pairingDir, { recursive: true });
      }

      // Iniciar proceso de pairing
      const startpairing = require('./bot.js');
      await startpairing(number);

      // Esperar el código
      let tries = 0;
      let code = null;
      const pairingFile = path.join(pairingDir, 'pairing.json');
      
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
      await bot.deleteMessage(chatId, processingMsg.message_id);

      if (code) {
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

        // Esperar conexión exitosa
        let connected = false;
        tries = 0;
        while (tries < 60 && !connected) {
          if (fs.existsSync(path.join(pairingDir, 'creds.json'))) {
            connected = true;
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
            setTimeout(() => bot.deleteMessage(chatId, successMsg.message_id), 10000);
            break;
          }
          await new Promise(r => setTimeout(r, 1000));
          tries++;
        }

        setTimeout(() => bot.deleteMessage(chatId, pairingMsg.message_id), 60000);
      } else {
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
      }
    } catch (e) {
      console.error('Error en proceso de pairing:', e);
      const errorMsg = await bot.sendMessage(chatId, '❌ Error al generar código. Contacta al administrador.');
      setTimeout(() => bot.deleteMessage(chatId, errorMsg.message_id), 5000);
    }

    delete userStates[chatId];
    return;
  }

  // Agregar sistema anti-spam
  const cooldowns = new Map();

  function isOnCooldown(userId) {
    if (!cooldowns.has(userId)) return false;
    const cooldownTime = cooldowns.get(userId);
    return Date.now() < cooldownTime;
  }

  function setCooldown(userId, minutes) {
    cooldowns.set(userId, Date.now() + (minutes * 60000));
  }

  // Agregar logs detallados
  function logAction(userId, action, target = null) {
    const log = {
      timestamp: new Date().toISOString(),
      userId,
      action,
      target,
      success: true
    };
    
    fs.appendFileSync(
      path.join(__dirname, 'logs', 'actions.log'),
      JSON.stringify(log) + '\n'
    );
  }

  // Modificar manejo de comandos para incluir límites
  if (userStates[chatId]?.awaitingNumber) {
    // Verificar límites
    if (isOnCooldown(chatId)) {
      const errorMsg = await bot.sendMessage(chatId, 
        '⚠️ Debes esperar 5 minutos entre comandos.');
      setTimeout(() => bot.deleteMessage(chatId, errorMsg.message_id), 5000);
      return;
    }
    
    // Verificar límite diario
    const dailyUsage = getUserDailyUsage(chatId);
    if (dailyUsage >= config.LIMITS.MAX_CRASHES_PER_DAY) {
      const errorMsg = await bot.sendMessage(chatId,
        '⚠️ Has alcanzado el límite diario de comandos.');
      setTimeout(() => bot.deleteMessage(chatId, errorMsg.message_id), 5000);
      return;
    }
    
    // Aplicar cooldown
    setCooldown(chatId, config.LIMITS.COOLDOWN_MINUTES);
    
    // Registrar acción
    logAction(chatId, 'crash_command', target);
  }
});

// Al iniciar, reconectar automáticamente todas las sesiones guardadas
(async () => {
  const pairingDir = path.join(__dirname, 'lib', 'pairing');
  if (fs.existsSync(pairingDir)) {
    const dirs = fs.readdirSync(pairingDir).filter(f => fs.statSync(path.join(pairingDir, f)).isDirectory());
    for (const number of dirs) {
      try {
        await startSession(number);
        console.log(`Sesión restaurada para ${number}`);
      } catch (e) {
        console.error(`No se pudo restaurar la sesión para ${number}:`, e);
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
