const fetch = require('node-fetch');
const { FormData, Blob } = require('formdata-node');
const { fileTypeFromBuffer } = require('file-type');

/**
 * Upload ephemeral file to file.io (expires in 1 day, max 100MB)
 * @param {Buffer} buffer
 */
const fileIO = async (buffer) => {
  const { ext, mime } = await fileTypeFromBuffer(buffer) || {};
  const form = new FormData();
  const blob = new Blob([buffer], { type: mime }); // no .toArrayBuffer() en CommonJS
  form.append('file', blob, 'tmp.' + ext);

  const res = await fetch('https://file.io/?expires=1d', {
    method: 'POST',
    body: form,
  });

  const json = await res.json();
  if (!json.success) throw json;
  return json.link;
};

/**
 * Upload file to RESTfulAPI
 * @param {Buffer|Buffer[]} inp
 */
const RESTfulAPI = async (inp) => {
  const form = new FormData();
  const buffers = Array.isArray(inp) ? inp : [inp];
  for (const buffer of buffers) {
    const blob = new Blob([buffer]); // no .toArrayBuffer() en CommonJS
    form.append('file', blob);
  }

  const res = await fetch('https://storage.restfulapi.my.id/upload', {
    method: 'POST',
    body: form,
  });

  let json = await res.text();
  try {
    json = JSON.parse(json);
    if (!Array.isArray(inp)) return json.files[0].url;
    return json.files.map((res) => res.url);
  } catch (e) {
    throw json;
  }
};

/**
 * Manejador principal que prueba ambos servicios
 * @param {Buffer} inp
 * @returns {Promise<string>}
 */
const upload = async (inp) => {
  let err = false;
  for (const uploadMethod of [RESTfulAPI, fileIO]) {
    try {
      return await uploadMethod(inp);
    } catch (e) {
      err = e;
    }
  }
  if (err) throw err;
};

module.exports = upload;