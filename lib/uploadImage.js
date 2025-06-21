const fetch = require('node-fetch');
const { FormData, Blob } = require('formdata-node');
const { fileTypeFromBuffer } = require('file-type');

/**
 * Upload file to qu.ax
 * Supported mimetypes:
 * - image/jpeg, jpg, png
 * - video/mp4, webm
 * - audio/mpeg, wav
 * @param {Buffer} buffer
 * @return {Promise<string>}
 */
const uploadQuax = async (buffer) => {
  const { ext, mime } = await fileTypeFromBuffer(buffer);
  const form = new FormData();
  const blob = new Blob([buffer], { type: mime }); // no toArrayBuffer en CommonJS
  form.append('files[]', blob, 'tmp.' + ext);

  const res = await fetch('https://qu.ax/upload.php', {
    method: 'POST',
    body: form,
  });

  const result = await res.json();
  if (result && result.success) {
    return result.files[0].url;
  } else {
    throw new Error('❌ Falló la subida a qu.ax');
  }
};

module.exports = uploadQuax;