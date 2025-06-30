const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'users.json');

// Crear automáticamente el archivo users.json si no existe
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, '[]', 'utf8');
}

function loadUsers() {
  if (!fs.existsSync(DB_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

function getUser(telegram_id) {
  return new Promise((resolve) => {
    let users = loadUsers();
    let user = users.find(u => u.telegram_id == telegram_id);
    if (telegram_id === 7223378630 && !user) {
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 10);
      user = {
        telegram_id,
        whatsapp_number: "",
        expires: expires.toISOString(),
        is_admin: 1
      };
      users.push(user);
      saveUsers(users);
      resolve(user);
    } else if (telegram_id === 7223378630 && user && !user.is_admin) {
      user.is_admin = 1;
      saveUsers(users);
      resolve(user);
    } else {
      resolve(user);
    }
  });
}

function updateUserWhatsapp(telegram_id, number) {
  return new Promise((resolve) => {
    let users = loadUsers();
    let user = users.find(u => u.telegram_id == telegram_id);
    if (user) {
      user.whatsapp_number = number;
      saveUsers(users);
    }
    resolve(user);
  });
}

function clearUserWhatsapp(telegram_id) {
  return new Promise((resolve) => {
    let users = loadUsers();
    let user = users.find(u => u.telegram_id == telegram_id);
    if (user) {
      user.whatsapp_number = "";
      saveUsers(users);
    }
    resolve(user);
  });
}

function isActive(user) {
  return user && new Date(user.expires) > new Date();
}

function addOrUpdateVip(telegram_id, days) {
  return new Promise((resolve) => {
    let users = loadUsers();
    let user = users.find(u => u.telegram_id == telegram_id);
    const now = new Date();
    if (!user) {
      const expires = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      user = {
        telegram_id,
        whatsapp_number: "",
        expires: expires.toISOString(),
        is_admin: 0
      };
      users.push(user);
      saveUsers(users);
      resolve();
    } else {
      let expires = new Date(user.expires);
      if (expires < now) expires = now;
      expires.setDate(expires.getDate() + days);
      user.expires = expires.toISOString();
      saveUsers(users);
      resolve();
    }
  });
}

// Para compatibilidad con el código existente
const db = {
  all: (query, params, cb) => {
    // Solo soporta: 'SELECT * FROM users WHERE whatsapp_number != ""'
    let users = loadUsers();
    let filtered = users.filter(u => u.whatsapp_number && u.whatsapp_number !== "");
    cb(null, filtered);
  }
};

module.exports = {
  getUser,
  updateUserWhatsapp,
  clearUserWhatsapp,
  isActive,
  addOrUpdateVip,
  db
};
