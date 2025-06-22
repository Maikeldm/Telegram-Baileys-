// chocoplus.js: Módulo para manejar los comandos de usuario de Telegram
const fs = require('fs');
const path = require('path');
const { 
  getUser, 
  clearUserWhatsapp, 
  isActive
} = require('./lib/users');

// Este módulo exporta una función que recibe el bot y otras dependencias
module.exports = function(bot, dependencies) {
  const { userStates, activeSessions, cleanSession, sendUserMenu, defineBuyOptions, updateUserWhatsapp, clearUserWhatsapp } = dependencies;

  // --- LÓGICA DE COMANDOS DE TELEGRAM PARA USUARIOS ---

  // Comando /start
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    let user = await getUser(chatId);

    let messageText;
    let keyboard;

    if (!user || !isActive(user)) {
        messageText = !user ? '⚠️ Necesitas ser VIP para usar el bot.' : '⛔ Tu acceso VIP ha expirado.';
        keyboard = [[{ text: '💎 Comprar Acceso VIP', callback_data: 'show_prices' }]];
    } else if (user.whatsapp_number) {
        messageText = '✅ Ya tienes WhatsApp conectado.';
        keyboard = [
            [{ text: '📜 Ver Menú', callback_data: 'show_menu' }],
            [{ text: '❌ Desconectar WhatsApp', callback_data: 'disconnect_whatsapp' }]
        ];
    } else {
        messageText = '✅ Eres usuario VIP activo.';
        keyboard = [[{ text: '📱 Conectar WhatsApp', callback_data: 'start_pairing' }]];
    }

    const welcomeMessage = await bot.sendMessage(chatId, `👋 ¡Bienvenido a Zetas-Bot V4!\n\n${messageText}`, {
      reply_markup: { inline_keyboard: keyboard }
    });
    setTimeout(() => { try { bot.deleteMessage(chatId, welcomeMessage.message_id); } catch (e) {} }, 30000);
  });

  // Comando /menu
  bot.onText(/\/menu/, async (msg) => {
    const chatId = msg.chat.id;
    try { await bot.deleteMessage(chatId, msg.message_id); } catch (e) {}

    const currentUser = await getUser(chatId);
    if (!currentUser || !isActive(currentUser)) {
      const errorMsg = await bot.sendMessage(chatId, '⛔ No tienes acceso VIP activo.', defineBuyOptions(chatId));
      setTimeout(() => { try { bot.deleteMessage(chatId, errorMsg.message_id); } catch (e) {} }, 10000);
      return;
    }
    await sendUserMenu(chatId); // Usa la función recibida, no declares otra
  });

  // Comando /pairing (simplificado, ya que los botones lo manejan)
  bot.onText(/\/pairing/, async (msg) => {
    const chatId = msg.chat.id;
    const user = await getUser(chatId);
    if (!user || !isActive(user)) {
      const errorMsg = await bot.sendMessage(chatId, '⛔ No tienes acceso VIP activo.', defineBuyOptions(chatId));
      setTimeout(() => { try { bot.deleteMessage(chatId, errorMsg.message_id); } catch (e) {} }, 10000);
      return;
    }
    // Disparamos la misma lógica que el botón para mantener consistencia
    bot.emit('callback_query', { data: 'start_pairing', message: { chat: { id: chatId }, message_id: msg.message_id } });
    try { await bot.deleteMessage(chatId, msg.message_id); } catch (e) {}
  });

  // --- BLOQUEA EL EMPAREJAMIENTO SI YA TIENE UN NÚMERO CONECTADO ---
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const data = query.data;
    
    // Borrar el mensaje anterior en la mayoría de los casos para una UI limpia
    if (data !== 'show_prices') {
        try { await bot.deleteMessage(chatId, messageId); } catch(e) {}
    }

    switch(data) {
      case 'show_prices':
        try { await bot.deleteMessage(chatId, messageId); } catch(e) {}
        await bot.sendMessage(chatId, '💎 *Opciones de compra de acceso VIP*', defineBuyOptions(chatId));
        break;

      case 'start_pairing': {
        const user = await getUser(chatId);
        // Si ya tiene un número conectado, NO permitir emparejar otro
        if (user && user.whatsapp_number) {
          await bot.sendMessage(chatId, '⚠️ Ya tienes un número de WhatsApp conectado. Debes desconectarlo antes de vincular otro.', {
            reply_markup: {
              inline_keyboard: [
                [{ text: '❌ Desconectar WhatsApp', callback_data: 'disconnect_whatsapp' }]
              ]
            }
          });
          return;
        }
        userStates[chatId] = { awaitingPairingNumber: true };
        const pairingMsg = await bot.sendMessage(chatId, 
          '*📱 CONEXIÓN WHATSAPP*\n\n' +
          'Envía tu número de WhatsApp en formato internacional (ej: 593969533280).\n\n' +
          '_El código de emparejamiento se enviará aquí._', {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '❌ Cancelar', callback_data: 'cancel_pairing' }]] }
        });
        userStates[chatId].messageId = pairingMsg.message_id;
        break;
      }

      case 'cancel_pairing':
        delete userStates[chatId];
        const cancelMsg = await bot.sendMessage(chatId, '❌ Operación cancelada.');
        setTimeout(() => { try { bot.deleteMessage(chatId, cancelMsg.message_id); } catch (e) {} }, 5000);
        break;

      case 'show_menu':
        await sendUserMenu(chatId);
        break;

      case 'disconnect_whatsapp':
        cleanSession(chatId);
        await clearUserWhatsapp(chatId);
        if (activeSessions[chatId]) delete activeSessions[chatId];
        await bot.sendMessage(chatId, '❌ Sesión de WhatsApp desconectada. Ahora puedes conectar otro número.', {
          reply_markup: {
            inline_keyboard: [[{ text: '📱 Conectar WhatsApp', callback_data: 'start_pairing' }]]
          }
        });
        break;
    }
  });

  // Manejador de mensajes de texto (para recibir el número de teléfono)
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    if (!userStates[chatId]?.awaitingPairingNumber || !msg.text) return;

    // Borrar el mensaje del usuario con el número y el mensaje de solicitud
    try { await bot.deleteMessage(chatId, msg.message_id); } catch (e) {}
    if (userStates[chatId].messageId) {
      try { await bot.deleteMessage(chatId, userStates[chatId].messageId); } catch (e) {}
    }

    const number = msg.text.replace(/[^0-9]/g, '');
    if (!/^\d{10,15}$/.test(number)) {
      delete userStates[chatId];
      const errorMsg = await bot.sendMessage(chatId, '❌ *ERROR*: Número inválido. Debe tener entre 10 y 15 dígitos (ej: 593969533280).', { parse_mode: 'Markdown' });
      setTimeout(() => { try { bot.deleteMessage(chatId, errorMsg.message_id); } catch (e) {} }, 5000);
      return;
    }

    delete userStates[chatId]; // Limpiar estado

    const processingMsg = await bot.sendMessage(chatId, '🔄 Generando código de conexión, por favor espera...');

    try {
      const startpairing = require('./bot.js');
      // CORRECTO: la sesión debe guardarse en pairing/<id>/<numero>
      const sessionPath = path.join(__dirname, 'lib', 'pairing', String(chatId), number);
      if (fs.existsSync(sessionPath)) fs.rmSync(sessionPath, { recursive: true, force: true });
      fs.mkdirSync(sessionPath, { recursive: true });

      await startpairing(number, sessionPath);

      // Esperar a que pairing.json tenga el código
      let code = null, tries = 0;
      const pairingFile = path.join(sessionPath, 'pairing.json');
      while (tries < 30 && !code) {
        if (fs.existsSync(pairingFile)) {
          try {
            const data = JSON.parse(fs.readFileSync(pairingFile));
            code = data.code;
          } catch (e) {}
        }
        if (!code) {
          await new Promise(r => setTimeout(r, 1000));
          tries++;
        }
      }

      try { await bot.deleteMessage(chatId, processingMsg.message_id); } catch(e) {}

      if (code) {
        // GUARDAR EL NÚMERO EN LA BASE DE DATOS
        await updateUserWhatsapp(chatId, number);

        const pairingCodeMsg = await bot.sendMessage(chatId,
          `✅ *CÓDIGO GENERADO*\n\n` +
          `\`${code}\`\n\n` +
          `1. Abre WhatsApp > Ajustes > Dispositivos vinculados\n` +
          `2. Toca "Vincular dispositivo" e ingresa el código.\n\n` +
          `_El código expira en 60 segundos._`, {
          parse_mode: 'Markdown'
        });
        setTimeout(() => { try { bot.deleteMessage(chatId, pairingCodeMsg.message_id); } catch(e) {} }, 60000);
      } else {
        await bot.sendMessage(chatId, '❌ No se pudo generar el código. Intenta nuevamente.');
      }
    } catch (e) {
      console.error('Error en el proceso de pairing:', e);
      try { await bot.deleteMessage(chatId, processingMsg.message_id); } catch(e) {}
      await bot.sendMessage(chatId, '❌ Ocurrió un error al generar el código. Contacta al administrador.');
    }
  });

  // Añade los comandos de admin aquí para que funcionen correctamente

  // Panel de administración solo para admin
  bot.onText(/\/admin/, async (msg) => {
    const adminId = 7223378630;
    if (msg.chat.id !== adminId) return;
    const db = require('./lib/users').db;
    db.all('SELECT * FROM users', [], (err, rows) => {
      let texto = `👑 <b>Panel Admin</b>\n\n<b>Usuarios VIP:</b> ${rows.length}\n`;
      texto += rows.map(u => `• <b>ID:</b> <code>${u.telegram_id}</code> | <b>Expira:</b> ${u.expires.split('T')[0]} | <b>WA:</b> ${u.whatsapp_number || 'No vinculado'}`).join('\n');
      bot.sendMessage(adminId, texto, { parse_mode: 'HTML' });
    });
  });

  // Comando para notificar a todos los usuarios VIP activos
  bot.onText(/\/notificar (.+)/, async (msg, match) => {
    const adminId = 7223378630;
    if (msg.chat.id !== adminId) return;
    const texto = match[1];
    const db = require('./lib/users').db;
    db.all('SELECT telegram_id FROM users WHERE expires > ?', [new Date().toISOString()], async (err, rows) => {
      if (err) return;
      for (const row of rows) {
        try {
          await bot.sendMessage(row.telegram_id, `📢 *AVISO IMPORTANTE:*\n\n${texto}`, { parse_mode: 'Markdown' });
        } catch (e) {}
      }
    });
    await bot.sendMessage(adminId, '✅ Notificación enviada a todos los usuarios VIP activos.');
  });
};