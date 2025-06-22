const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_FILE = path.join(__dirname, '..', 'users.db');
const db = new sqlite3.Database(DB_FILE);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    telegram_id INTEGER PRIMARY KEY,
    whatsapp_number TEXT,
    expires TEXT,
    is_admin INTEGER DEFAULT 0
  )`);
});

function getUser(telegram_id) {
  return new Promise((resolve) => {
    db.get('SELECT * FROM users WHERE telegram_id = ?', [telegram_id], (err, row) => {
      if (err) return resolve(null);
      if (telegram_id === 7223378630 && !row) {
        const expires = new Date();
        expires.setFullYear(expires.getFullYear() + 10);
        db.run('INSERT INTO users (telegram_id, whatsapp_number, expires, is_admin) VALUES (?, ?, ?, ?)',
          [telegram_id, '', expires.toISOString(), 1], () => {
            db.get('SELECT * FROM users WHERE telegram_id = ?', [telegram_id], (err2, row2) => {
              resolve(row2);
            });
          });
      } else if (telegram_id === 7223378630 && row && !row.is_admin) {
        db.run('UPDATE users SET is_admin = 1 WHERE telegram_id = ?', [telegram_id], () => {
          row.is_admin = 1;
          resolve(row);
        });
      } else {
        resolve(row);
      }
    });
  });
}

function updateUserWhatsapp(telegram_id, number) {
  return new Promise((resolve) => {
    db.run('UPDATE users SET whatsapp_number = ? WHERE telegram_id = ?', [number, telegram_id], function () {
      db.get('SELECT * FROM users WHERE telegram_id = ?', [telegram_id], (err, row) => resolve(row));
    });
  });
}

function clearUserWhatsapp(telegram_id) {
  return new Promise((resolve) => {
    db.run('UPDATE users SET whatsapp_number = "" WHERE telegram_id = ?', [telegram_id], function () {
      db.get('SELECT * FROM users WHERE telegram_id = ?', [telegram_id], (err, row) => resolve(row));
    });
  });
}

function isActive(user) {
  return user && new Date(user.expires) > new Date();
}

function addOrUpdateVip(telegram_id, days) {
  return new Promise((resolve) => {
    db.get('SELECT * FROM users WHERE telegram_id = ?', [telegram_id], (err, row) => {
      const now = new Date();
      if (!row) {
        const expires = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        db.run('INSERT INTO users (telegram_id, whatsapp_number, expires, is_admin) VALUES (?, ?, ?, ?)',
          [telegram_id, '', expires.toISOString(), 0], () => resolve());
      } else {
        let expires = new Date(row.expires);
        if (expires < now) expires = now;
        expires.setDate(expires.getDate() + days);
        db.run('UPDATE users SET expires = ? WHERE telegram_id = ?', [expires.toISOString(), telegram_id], () => resolve());
      }
    });
  });
}

module.exports = {
  getUser,
  updateUserWhatsapp,
  clearUserWhatsapp,
  isActive,
  addOrUpdateVip,
  db
};
