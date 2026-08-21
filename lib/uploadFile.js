'use strict';
const axios = require('axios');
const FormData = require('form-data');
async function uploadFile(buffer, filename='file.bin', mimetype='application/octet-stream') {
    const form = new FormData();
    form.append('file', buffer, { filename, contentType: mimetype });
    const res = await axios.post('https://telegra.ph/upload', form, { headers: form.getHeaders() });
    return 'https://telegra.ph' + res.data?.[0]?.src;
}
module.exports = uploadFile;
module.exports.default = uploadFile;
