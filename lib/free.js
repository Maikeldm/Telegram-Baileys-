const fs = require('fs');
const path = require('path');

const FREE_FILE = path.join(__dirname, 'free.json');
const FREE_STATE_FILE = path.join(__dirname, 'free_state.json');

// Inicializa archivos si no existen
if (!fs.existsSync(FREE_FILE)) fs.writeFileSync(FREE_FILE, '[]', 'utf8');
if (!fs.existsSync(FREE_STATE_FILE)) fs.writeFileSync(FREE_STATE_FILE, '{"active":false}', 'utf8');

function getFreeUsers() {
  return JSON.parse(fs.readFileSync(FREE_FILE, 'utf8'));
}

function addFreeUser(telegram_id) {
  let users = getFreeUsers();
  if (!users.includes(telegram_id)) {
    users.push(telegram_id);
    fs.writeFileSync(FREE_FILE, JSON.stringify(users, null, 2));
  }
}

function removeFreeUser(telegram_id) {
  let users = getFreeUsers();
  users = users.filter(id => id != telegram_id);
  fs.writeFileSync(FREE_FILE, JSON.stringify(users, null, 2));
}

function isFreeUser(telegram_id) {
  return getFreeUsers().includes(telegram_id);
}

function setFreeMode(active) {
  fs.writeFileSync(FREE_STATE_FILE, JSON.stringify({ active: !!active }, null, 2));
}

function isFreeMode() {
  try {
    return JSON.parse(fs.readFileSync(FREE_STATE_FILE, 'utf8')).active;
  } catch {
    return false;
  }
}

module.exports = {
  getFreeUsers,
  addFreeUser,
  removeFreeUser,
  isFreeUser,
  setFreeMode,
  isFreeMode
};
