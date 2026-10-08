'use strict';
const { runAction } = require('../../utils/madaraStore');
module.exports = {
    name: 'apkscan',
    aliases: ['apkchecker', 'apkintel', 'filecheck'],
    description: 'Static-scan a replied-to APK for basic safety indicators',
    category: 'store',
    async execute(context) { return runAction('apkscan', context); },
};
