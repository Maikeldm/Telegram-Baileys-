# Zetas-Bot V4

Bot de WhatsApp multiusuario con control desde Telegram.

## Características principales
- Vinculación de WhatsApp por usuario VIP
- Panel de administración para ver usuarios y sesiones
- Backups automáticos de usuarios y sesiones cada 6 horas
- Recarga automática si se modifica main.js o config.js
- Menú con foto, tiempo VIP y comandos exclusivos

## Estructura de carpetas
- `main.js`: Lógica principal del bot
- `config.js`: Configuración 
- `lib/pairing/<id>/<numero>`: Sesiones de WhatsApp por usuario y número
- `backups/`: Copias de seguridad automáticas

## Comandos principales
- `/start`: Inicia el bot y muestra opciones
- `/menu`: Muestra el menú de comandos
- `/admin`: Panel solo para admin (ver usuarios y sesiones)
- `/addvip <id> <días>`: Otorga días VIP a un usuario (solo admin)

## Requisitos
- Node.js 18+
- Archivo users.db (se crea automáticamente)

## Notas
- El bot se reinicia automáticamente si editas main.js o config.js
- Los backups se guardan en la carpeta backups/

---

¿Dudas? Contacta al admin en Telegram.


By : 𝕮𝖍𝖔𝖈𝖔𝖕𝖑𝖚𝖘 & 『0x48𝙴𝚡𝙼𝚊𝚜𝚝𝚎𝚛』