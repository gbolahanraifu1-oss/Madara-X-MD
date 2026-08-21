'use strict';
const axios = require('axios');
const { menuBox } = require('../../lib/menuBox');

// Sends the ACTUAL .apk file, not a link — but only works for F-Droid's
// catalog (open-source apps). Proprietary apps (WhatsApp, Instagram, etc.)
// aren't on F-Droid at all; there's no free, stable, non-anti-bot-protected
// way to fetch and re-send *those* binaries (tried api.dreaded.site — dead;
// tried scraping APKMirror/APKPure — anti-bot walls + broken search).
// F-Droid's own JSON APIs are real, documented, and stable:
//   search: https://search.f-droid.org/api/search_apps?q=<query>
//   version lookup: https://f-droid.org/api/v1/packages/<packageName>
//   direct APK: https://f-droid.org/repo/<packageName>_<versionCode>.apk
module.exports = {
    name: 'apk', aliases: ['apkdl', 'apkdownload'],
    category: 'misc', desc: 'ᴅᴏᴡɴʟᴏᴀᴅ ᴀᴘᴋ (ᴏᴘᴇɴ-sᴏᴜʀᴄᴇ ᴀᴘᴘs ᴠɪᴀ ғ-ᴅʀᴏɪᴅ)',
    usage: '†apk <app name>',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const q = args.join(' ');
        if (!q) return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}apk Fennec${s.FOOTER}`);

        await ctx.react('📦');

        // 1. Search F-Droid
        let hit;
        try {
            const searchRes = await axios.get('https://search.f-droid.org/api/search_apps', {
                params: { q }, timeout: 15000,
            });
            hit = searchRes.data?.apps?.[0];
        } catch (e) {
            return ctx.reply(`❌ F-Droid search failed: ${e.message}${s.FOOTER}`);
        }

        if (!hit) {
            return ctx.reply(
                menuBox('📦', 'ᴀᴘᴋ ɴᴏᴛ ғᴏᴜɴᴅ', [
                    `No open-source match for *${q}* on F-Droid.`,
                    ``,
                    `_This only covers F-Droid's open-source catalog —_`,
                    `_proprietary apps (WhatsApp, Instagram, etc.) aren't_`,
                    `_available here._`,
                ]) + s.FOOTER
            );
        }

        const packageName = hit.url.split('/').filter(Boolean).pop();

        // 2. Resolve a version that's actually published in the repo.
        // suggestedVersionCode isn't guaranteed to be in the packages list —
        // F-Droid's own build pipeline can mark a version "suggested" before
        // it's actually finished publishing (confirmed via a real F-Droid
        // bug report). Trust it only if it's confirmed present; otherwise
        // fall back to the highest versionCode that IS in the list.
        let versionCode, versionName;
        try {
            const pkgRes = await axios.get(`https://f-droid.org/api/v1/packages/${packageName}`, { timeout: 15000 });
            const suggested = pkgRes.data?.suggestedVersionCode;
            const packages  = pkgRes.data?.packages || [];
            const confirmed = packages.find(p => p.versionCode === suggested);

            const chosen = confirmed || packages.slice().sort((a, b) => b.versionCode - a.versionCode)[0];
            if (!chosen) throw new Error('No published version found for this package');

            versionCode = chosen.versionCode;
            versionName = chosen.versionName;
        } catch (e) {
            return ctx.reply(`❌ Could not resolve a version for *${hit.name}*: ${e.message}${s.FOOTER}`);
        }

        const apkUrl = `https://f-droid.org/repo/${packageName}_${versionCode}.apk`;

        // 3. Download and send the actual APK file
        await ctx.reply(
            menuBox('📦', hit.name, [
                `*Version:* ${versionName || versionCode}`,
                `*Source:* F-Droid (open-source)`,
                `⬇️ Downloading and sending the file...`,
            ]) + s.FOOTER
        );

        try {
            const fileRes = await axios.get(apkUrl, {
                responseType: 'arraybuffer',
                timeout: 120000,
                maxContentLength: 200 * 1024 * 1024, // 200MB safety ceiling
            });
            const buffer   = Buffer.from(fileRes.data);
            const fileName = `${hit.name.replace(/[^a-z0-9]+/gi, '_')}_${versionName || versionCode}.apk`;

            await sock.sendMessage(ctx.from, {
                document:  buffer,
                mimetype:  'application/vnd.android.package-archive',
                fileName,
                caption:   menuBox('✅', hit.name, [
                    `*Version:* ${versionName || versionCode}`,
                    `*Size:* ${(buffer.length / 1024 / 1024).toFixed(1)} MB`,
                ]) + s.FOOTER,
            }, { quoted: msg });
        } catch (e) {
            return ctx.reply(
                `❌ Downloaded search result but failed to fetch/send the APK file itself: ${e.message}\n` +
                `_Direct link: ${apkUrl}_${s.FOOTER}`
            );
        }
    }
};
