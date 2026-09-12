'use strict';

/*
 * MADARA X-MD v1.2 — custom pairing
 *
 * Based on the OctopusV7 pairing flow:
 *   - ask for the phone number at runtime
 *   - strip non-digits
 *   - call requestPairingCode(phone, 'MADARAMD')
 *   - display the returned code grouped as XXXX-XXXX
 *
 * IMPORTANT:
 * 'MADARAMD' is the custom pairing-code value; it is NOT a phone number.
 */

const readline = require('readline');

function ask(questionText) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => {
        rl.question(questionText, answer => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

function formatPairingCode(code) {
    const clean = String(code || '').replace(/[^A-Za-z0-9]/g, '');
    return clean.match(/.{1,4}/g)?.join('-') || clean;
}

/**
 * Request a custom MADARAMD pairing code.
 *
 * sock: connected Baileys socket with requestPairingCode()
 * phoneNumber: optional. If omitted, terminal asks for it.
 */
async function requestMadaraPairingCode(sock, phoneNumber) {
    if (!sock || typeof sock.requestPairingCode !== 'function') {
        throw new Error(
            'This Baileys build does not expose requestPairingCode().'
        );
    }

    let number = phoneNumber;

    if (!number) {
        number = await ask(
            '\n📱 Enter WhatsApp number (international format, no +): '
        );
    }

    number = String(number).replace(/[^\d]/g, '');

    if (!number) {
        throw new Error('A valid WhatsApp phone number is required.');
    }

    // Exact custom pairing value used by the Madara v1.2 implementation.
    const rawCode = await sock.requestPairingCode(number, 'MADARAMD');
    const code = formatPairingCode(rawCode);

    console.log('\n╔════════════════════════════════════╗');
    console.log('║     🔥 MADARA X-MD PAIRING         ║');
    console.log('╠════════════════════════════════════╣');
    console.log(`║  Code: ${code.padEnd(26)}║`);
    console.log('║                                    ║');
    console.log('║  WhatsApp → Linked devices →       ║');
    console.log('║  Link with phone number instead    ║');
    console.log('╚════════════════════════════════════╝\n');

    return {
        phoneNumber: number,
        code,
        rawCode
    };
}

module.exports = {
    requestMadaraPairingCode,
    formatPairingCode
};
