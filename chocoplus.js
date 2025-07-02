// chocoplus.js: Módulo para manejar los comandos de usuario de Telegram
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import free from './lib/free.js';
import {
  getUser,
  clearUserWhatsapp,
  isActive,
  addOrUpdateVip
} from './lib/users.js';

// ESM: __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Utilidad para verificar si un usuario es admin
function isAdmin(id) {
  return config.ADMIN_IDS.includes(Number(id));
}

// Este módulo exporta una función que recibe el bot y otras dependencias
export default function(bot, dependencies) {
  const { userStates, activeSessions, cleanSession, sendUserMenu, defineBuyOptions, updateUserWhatsapp, clearUserWhatsapp } = dependencies;

  // --- LÓGICA DE COMANDOS DE TELEGRAM PARA USUARIOS ---

  // Comando /start
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    let user = await getUser(chatId);

    let isVip = user && isActive(user);
    let isFree = free.isFreeMode();

    let messageText;
    let keyboard;

    if (!isVip && !isFree) {
        messageText = !user ? '⚠️ Necesitas ser VIP para usar el bot.' : '⛔ Tu acceso VIP ha expirado.';
        keyboard = [
          [{ text: '💎 Comprar Acceso VIP', callback_data: 'show_prices' }],
          [{ text: '🆘 Soporte', callback_data: 'soporte' }]
        ];
    } else if (isVip || isFree) {
        if (isFree && !isVip) free.addFreeUser(chatId);
        if (user && user.whatsapp_number) {
            messageText = '✅ Ya tienes WhatsApp conectado.';
            keyboard = [
                [{ text: '📜 Ver Menú', callback_data: 'show_menu' }],
                [{ text: '❌ Desconectar WhatsApp', callback_data: 'disconnect_whatsapp' }],
                [{ text: '🆘 Soporte', callback_data: 'soporte' }]
            ];
        } else {
            messageText = isVip ? '✅ Eres usuario VIP activo.' : '✅ Eres usuario FREE temporal.';
            keyboard = [
              [{ text: '📱 Conectar WhatsApp', callback_data: 'start_pairing' }],
              [{ text: '🆘 Soporte', callback_data: 'soporte' }]
            ];
        }
    }

    const welcomeMessage = await bot.sendMessage(chatId, `👋 ¡Bienvenido a Zetas-Bot V4!\n\n${messageText}`, {
      reply_markup: { inline_keyboard: keyboard }
    });
    setTimeout(() => { try { bot.deleteMessage(chatId, welcomeMessage.message_id); } catch (e) {} }, 30000);
  });

  // Comando /menu (corrige error si currentUser es undefined)
  bot.onText(/\/menu/, async (msg) => {
    // Si hay más de 1 listener para /menu, reinicia el proceso para limpiar todo (PM2 lo levantará solo)
    if (bot._events && bot._events['text'] && Array.isArray(bot._events['text']) && bot._events['text'].length > 1) {
      console.log('Detectado listeners duplicados, reiniciando proceso (PM2 lo levantará solo)...');
      process.exit(0);
    }

    const chatId = msg.chat.id;
    try { await bot.deleteMessage(chatId, msg.message_id); } catch (e) {}

    const currentUser = await getUser(chatId);
    const isVip = currentUser && isActive(currentUser);
    const isFree = free.isFreeMode();

    if (!isVip && !isFree) {
      const errorMsg = await bot.sendMessage(chatId, '⛔ No tienes acceso VIP activo.', defineBuyOptions(chatId));
      setTimeout(() => { try { bot.deleteMessage(chatId, errorMsg.message_id); } catch (e) {} }, 10000);
      return;
    }

    // --- Botón de soporte en el menú ---
    let extraButtons = [];
    if (currentUser && currentUser.whatsapp_number) {
      extraButtons.push([{ text: '❌ Desconectar WhatsApp', callback_data: 'disconnect_whatsapp' }]);
    } else {
      extraButtons.push([{ text: '📱 Conectar WhatsApp', callback_data: 'start_pairing' }]);
    }
    extraButtons.push([{ text: '🆘 Soporte', callback_data: 'soporte' }]);

    function getMenuCaption(expiresDate) {
      if (!expiresDate) return `*📱 ZETAS-BOT V4 MENU*\n\n_Modo FREE activado temporalmente._\n\n_Selecciona un comando para ejecutar_`;
      const now = new Date();
      let ms = expiresDate - now;
      if (ms < 0) ms = 0;
      const segundos = Math.floor(ms / 1000) % 60;
      const minutos = Math.floor(ms / 60000) % 60;
      const horas = Math.floor(ms / 3600000) % 24;
      const dias = Math.floor(ms / 86400000);
      return `*📱 ZETAS-BOT V4 MENU*\n\n*TIEMPO VIP RESTANTE:* ${dias}d ${horas}h ${minutos}m ${segundos}s\n\n_Selecciona un comando para ejecutar_`;
    }

    let expires = currentUser && currentUser.expires ? new Date(currentUser.expires) : null;
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

    if (expires) {
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

      case 'soporte':
        try { await bot.deleteMessage(chatId, messageId); } catch (e) {}
        userStates[chatId] = { awaitingSupport: true };
        const msg = await bot.sendMessage(chatId,
          '🆘 *Soporte Zetas-Bot*\n\nPor favor, escribe tu consulta, reporte o sugerencia. El equipo de soporte te responderá lo antes posible.',
          { parse_mode: 'Markdown' }
        );
        userStates[chatId].supportMsgId = msg.message_id;
        break;

      case 'admin_menu':
        try { await bot.deleteMessage(chatId, messageId); } catch (e) {}
        await sendAdminMenu(chatId);
        break;

      case 'stats_admin':
        bot.emit('text', { chat: { id: chatId }, text: '/stats', message_id: messageId });
        break;

      case 'panel_admin':
        bot.emit('text', { chat: { id: chatId }, text: '/admin', message_id: messageId });
        break;

      case 'descargar_usuarios':
        try {
          await bot.sendDocument(chatId, path.join(__dirname, 'lib', 'users.json'));
        } catch (e) {
          await bot.sendMessage(chatId, '❌ Error al enviar el archivo.');
        }
        break;
    }
  });

  // Manejador de mensajes de texto (para recibir el número de teléfono o soporte)
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    // --- Soporte: si el usuario está en modo soporte, procesa el mensaje y notifícalo a los admins ---
    if (userStates[chatId]?.awaitingSupport && msg.text) {
      // Borra el mensaje de instrucción si existe
      if (userStates[chatId].supportMsgId) {
        try { await bot.deleteMessage(chatId, userStates[chatId].supportMsgId); } catch (e) {}
      }
      delete userStates[chatId];

      // Envía confirmación al usuario
      await bot.sendMessage(chatId, '✅ Tu mensaje de soporte ha sido enviado. El equipo te responderá pronto.');

      // Reenvía el mensaje a los administradores
      const soporteTexto =
        `🆘 *Nuevo mensaje de soporte*\n` +
        `*Usuario:* ${msg.from.first_name || ''} (${chatId})\n` +
        `*Mensaje:*\n${msg.text}`;
      for (const adminId of config.ADMIN_IDS) {
        try {
          await bot.sendMessage(adminId, soporteTexto, { parse_mode: 'Markdown' });
        } catch (e) {}
      }
      return;
    }

    // Manejador del número de teléfono (proceso de emparejamiento)
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
      const startpairingModule = await import('./bot.js');
      const startpairing = startpairingModule.default || startpairingModule;
      
      const sessionPath = path.join(__dirname, 'lib', 'pairing', String(chatId), number);
      if (fs.existsSync(sessionPath)) fs.rmSync(sessionPath, { recursive: true, force: true });
      fs.mkdirSync(sessionPath, { recursive: true });

      await startpairing(number, sessionPath);

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

  // Panel de administración solo para admin
  bot.onText(/\/admin/, async (msg) => {
    if (!isAdmin(msg.chat.id)) return;
    await sendAdminMenu(msg.chat.id);
  });

  // Menú especial para admins con todos los comandos de administración
  bot.onText(/\/adminmenu/, async (msg) => {
    if (!isAdmin(msg.chat.id)) return;
    await sendAdminMenu(msg.chat.id);
  });

  // Menú admin interactivo (agrega botones para activar/desactivar free)
  async function sendAdminMenu(chatId) {
    const texto =
      `🛠️ <b>Menú Especial Admin</b>\n\n` +
      `Gestiona usuarios VIP, notificaciones y modo FREE:\n\n` +
      `• <b>Agregar VIP</b>\n` +
      `• <b>Notificar a VIPs</b>\n` +
      `• <b>Ver estadísticas</b>\n` +
      `• <b>Ver panel</b>\n` +
      `• <b>Descargar usuarios</b>\n` +
      `• <b>Activar/Desactivar FREE</b>\n`;

    bot.sendMessage(chatId, texto, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '➕ Agregar VIP', callback_data: 'admin_addvip' }],
          [{ text: '📢 Notificar VIPs', callback_data: 'admin_notificar' }],
          [{ text: '📊 Estadísticas', callback_data: 'admin_stats' }],
          [{ text: '👑 Panel', callback_data: 'admin_panel' }],
          [{ text: '⬇️ Descargar usuarios', callback_data: 'admin_descargar_usuarios' }],
          [
            { text: '🟢 Activar FREE', callback_data: 'admin_free_on' },
            { text: '🔴 Desactivar FREE', callback_data: 'admin_free_off' }
          ]
        ]
      }
    });
  }

  // Listener único para todos los botones admin (agrega lógica para free)
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const data = query.data;

    // Solo admins pueden usar el menú admin
    if (data.startsWith('admin_') && !isAdmin(chatId)) return;

    // Borra el mensaje del menú anterior para mantener limpio el chat
    if (data.startsWith('admin_')) {
      try { await bot.deleteMessage(chatId, messageId); } catch (e) {}
    }

    switch (data) {
      case 'admin_addvip':
        userStates[chatId] = { adminAddVipStep: 1 };
        await bot.sendMessage(chatId, '🔢 Envía el <b>ID de Telegram</b> del usuario al que deseas agregar VIP:', { parse_mode: 'HTML' });
        break;

      case 'admin_notificar':
        userStates[chatId] = { adminNotifyStep: 1, notifyType: null };
        await bot.sendMessage(chatId, '📢 ¿Qué tipo de mensaje quieres enviar a los VIPs?', {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Texto', callback_data: 'admin_notify_text' }],
              [{ text: 'Soporte multimedia (foto, video, audio, etc.)', callback_data: 'admin_notify_media' }]
            ]
          }
        });
        break;

      case 'admin_stats':
        await sendAdminStats(chatId);
        break;

      case 'admin_panel':
        await sendAdminPanel(chatId);
        break;

      case 'admin_descargar_usuarios':
        // Solo envía el archivo al admin que lo solicita
        if (isAdmin(chatId)) {
          try {
            await bot.sendDocument(chatId, path.join(__dirname, 'lib', 'users.json'));
          } catch (e) {
            await bot.sendMessage(chatId, '❌ Error al enviar el archivo.');
          }
        }
        break;

      case 'admin_free_on':
        if (!isAdmin(chatId)) return;
        free.setFreeMode(true);
        await bot.sendMessage(chatId, '✅ Modo FREE activado. Todos los usuarios pueden usar el bot temporalmente.');
        break;
      case 'admin_free_off':
        if (!isAdmin(chatId)) return;
        free.setFreeMode(false);
        const freePairingDir = path.join(__dirname, 'lib', 'pairing', 'free');
        if (fs.existsSync(freePairingDir)) {
          // Borra todos los subdirectorios y archivos dentro de pairing/free
          fs.rmSync(freePairingDir, { recursive: true, force: true });
        }
        await bot.sendMessage(chatId, '⛔ Modo FREE desactivado y todas las sesiones FREE eliminadas. Solo usuarios VIP pueden usar el bot.');
        break;

      case 'admin_notify_text':
        userStates[chatId] = { adminNotifyStep: 2, notifyType: 'text' };
        await bot.sendMessage(chatId, '✏️ Escribe el mensaje de texto que se enviará a todos los VIPs activos:');
        break;

      case 'admin_notify_media':
        userStates[chatId] = { adminNotifyStep: 2, notifyType: 'media' };
        await bot.sendMessage(chatId, '📎 Envía el archivo multimedia (foto, video, audio, documento, etc.) y/o texto que se notificará a todos los VIPs activos:');
        break;
    }
  });

  // Procesos interactivos para agregar VIP y notificar
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    // --- Agregar VIP paso a paso ---
    if (userStates[chatId]?.adminAddVipStep === 1 && isAdmin(chatId)) {
      const id = parseInt(msg.text);
      if (!id) {
        await bot.sendMessage(chatId, '❌ ID inválido. Intenta de nuevo.');
        return;
      }
      userStates[chatId] = { adminAddVipStep: 2, vipId: id };
      await bot.sendMessage(chatId, '🗓️ ¿Cuántos días VIP deseas agregar? (envía solo el número de días)');
      return;
    }
    if (userStates[chatId]?.adminAddVipStep === 2 && isAdmin(chatId)) {
      const days = parseInt(msg.text);
      if (!days || days < 1) {
        await bot.sendMessage(chatId, '❌ Número de días inválido. Intenta de nuevo.');
        return;
      }
      const vipId = userStates[chatId].vipId;
      await addOrUpdateVip(vipId, days);
      const user = await getUser(vipId);
      await bot.sendMessage(chatId, `✅ Se otorgaron ${days} días VIP al usuario ${vipId}.`);
      try {
        const message = user && isActive(user)
          ? `🎉 ¡Has recibido ${days} días VIP! Ya puedes usar el bot.`
          : `🎉 ¡Has recibido ${days} días VIP! Si no puedes acceder, espera unos segundos y usa /start.`;
        await bot.sendMessage(vipId, message);
      } catch (e) {}
      delete userStates[chatId];
      return;
    }

    // --- Notificar a VIPs: texto ---
    if (userStates[chatId]?.adminNotifyStep === 2 && userStates[chatId].notifyType === 'text' && isAdmin(chatId)) {
      const texto = msg.text;
      if (!texto) {
        await bot.sendMessage(chatId, '❌ El mensaje no puede estar vacío.');
        return;
      }
      const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'lib', 'users.json'), 'utf8'));
      const now = new Date();
      let enviados = 0;
      for (const user of users) {
        if (user.expires && new Date(user.expires) > now) {
          try {
            await bot.sendMessage(user.telegram_id, `📢 *AVISO IMPORTANTE:*\n\n${texto}`, { parse_mode: 'Markdown' });
            enviados++;
          } catch (e) {}
        }
      }
      await bot.sendMessage(chatId, `✅ Notificación enviada a ${enviados} usuarios VIP activos.`);
      delete userStates[chatId];
      return;
    }

    // --- Notificar a VIPs: multimedia ---
    if (userStates[chatId]?.adminNotifyStep === 2 && userStates[chatId].notifyType === 'media' && isAdmin(chatId)) {
      // Permite cualquier tipo de mensaje (texto, foto, video, audio, documento, etc.)
      const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'lib', 'users.json'), 'utf8'));
      const now = new Date();
      let enviados = 0;
      for (const user of users) {
        if (user.expires && new Date(user.expires) > now) {
          try {
            // Reenvía el mensaje recibido (cualquier tipo)
            await bot.copyMessage(user.telegram_id, chatId, msg.message_id);
            enviados++;
          } catch (e) {}
        }
      }
      await bot.sendMessage(chatId, `✅ Notificación multimedia enviada a ${enviados} usuarios VIP activos.`);
      delete userStates[chatId];
      return;
    }

    // --- Soporte: si el usuario está en modo soporte, procesa el mensaje y notifícalo a los admins ---
    if (userStates[chatId]?.awaitingSupport && msg.text) {
      // Borra el mensaje de instrucción si existe
      if (userStates[chatId].supportMsgId) {
        try { await bot.deleteMessage(chatId, userStates[chatId].supportMsgId); } catch (e) {}
      }
      delete userStates[chatId];

      // Envía confirmación al usuario
      await bot.sendMessage(chatId, '✅ Tu mensaje de soporte ha sido enviado. El equipo te responderá pronto.');

      // Reenvía el mensaje a los administradores
      const soporteTexto =
        `🆘 *Nuevo mensaje de soporte*\n` +
        `*Usuario:* ${msg.from.first_name || ''} (${chatId})\n` +
        `*Mensaje:*\n${msg.text}`;
      for (const adminId of config.ADMIN_IDS) {
        try {
          await bot.sendMessage(adminId, soporteTexto, { parse_mode: 'Markdown' });
        } catch (e) {}
      }
      return;
    }

    // pairing para free
    if ((userStates[chatId]?.awaitingPairingNumber && msg.text) && (free.isFreeMode() && !isAdmin(chatId) && !(await getUser(chatId)).expires)) {
      // ...borrar mensajes como siempre...
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
      delete userStates[chatId];
      const processingMsg = await bot.sendMessage(chatId, '🔄 Generando código de conexión, por favor espera...');
      try {
        const startpairingModule = await import('./bot.js');
        const startpairing = startpairingModule.default || startpairingModule;
        const sessionPath = path.join(__dirname, 'lib', 'pairing', 'free', String(chatId), number);
        if (fs.existsSync(sessionPath)) fs.rmSync(sessionPath, { recursive: true, force: true });
        fs.mkdirSync(sessionPath, { recursive: true });
        await startpairing(number, sessionPath);

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
      return;
    }
  });

  // Comando para activar/desactivar modo free (solo admins)
  bot.onText(/\/free_on/, async (msg) => {
    if (!isAdmin(msg.chat.id)) return;
    free.setFreeMode(true);
    await bot.sendMessage(msg.chat.id, '✅ Modo FREE activado. Todos los usuarios pueden usar el bot temporalmente.');
  });
  bot.onText(/\/free_off/, async (msg) => {
    if (!isAdmin(msg.chat.id)) return;
    free.setFreeMode(false);
    // Borra todas las sesiones pairing de usuarios free
    const freePairingDir = path.join(__dirname, 'lib', 'pairing', 'free');
    if (fs.existsSync(freePairingDir)) {
      fs.rmSync(freePairingDir, { recursive: true, force: true });
    }
    await bot.sendMessage(msg.chat.id, '⛔ Modo FREE desactivado y todas las sesiones FREE eliminadas. Solo usuarios VIP pueden usar el bot.');
  });

  // Botón de estadísticas
  async function sendAdminStats(chatId) {
    const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'lib', 'users.json'), 'utf8'));
    const now = new Date();
    const vipActivos = users.filter(u => u.expires && new Date(u.expires) > now).length;
    const total = users.length;
    const sesionesWA = users.filter(u => u.whatsapp_number && u.whatsapp_number !== '').length;
    let texto = `📊 <b>Estadísticas del Bot</b>\n\n`;
    texto += `<b>Usuarios totales:</b> ${total}\n`;
    texto += `<b>VIP activos:</b> ${vipActivos}\n`;
    texto += `<b>Sesiones WhatsApp activas:</b> ${sesionesWA}\n`;
    await bot.sendMessage(chatId, texto, { parse_mode: 'HTML' });
  }

  // Botón de panel
  async function sendAdminPanel(chatId) {
    const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'lib', 'users.json'), 'utf8'));
    let texto = `👑 <b>Panel Admin</b>\n\n<b>Usuarios VIP:</b> ${users.length}\n`;
    texto += users.map(u => `• <b>ID:</b> <code>${u.telegram_id}</code> | <b>Expira:</b> ${u.expires ? u.expires.split('T')[0] : 'N/A'} | <b>WA:</b> ${u.whatsapp_number || 'No vinculado'}`).join('\n');
    await bot.sendMessage(chatId, texto, { parse_mode: 'HTML' });
  }

  // Elimina los comandos antiguos de admin: /addvip, /notificar, /stats, /adminmenu, /descargar_usuarios
  // ...existing code...
}
  // Elimina los comandos antiguos de admin: /addvip, /notificar, /stats, /adminmenu, /descargar_usuarios
  // ...existing code...

