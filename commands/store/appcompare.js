'use strict';
const { runAction } = require('../../utils/madaraStore');
module.exports = {
    name: 'appcompare',
    aliases: ['compareapps', 'appvs'],
    description: 'Compare two Google Play apps',
    category: 'store',
    async execute(context) { return runAction('compare', context); },
};
