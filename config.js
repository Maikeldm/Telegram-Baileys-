require('dotenv').config();

const fs = require('fs')
const file = require.resolve(__filename)

global.prefa = ['','!','.',',',';'] 

fs.watchFile(file, () => {
fs.unwatchFile(file)
console.log(`Update ${__filename}`)
delete require.cache[file]
require(file)
})

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN, // Debe estar definido en .env
  ADMIN_IDS: process.env.ADMIN_IDS
    ? process.env.ADMIN_IDS.split(',').map(id => Number(id.trim()))
    : [7223378630, 7046308321,7867614420] // Puedes poner más IDs aquí
};