const fs   = require('fs');
const path = require('path');
const { sendImageCarousel } = require('./mediaCarousel');

const commands   = new Map();
const plugins    = new Map();
const categories = new Map();
const COMMANDS_DIR = path.join(process.cwd(), 'commands');

// Imported command packs use a few more folder names than Madara's menu.
// Keep those commands in the existing Madara navigation instead of exposing
// a second menu taxonomy.
const CATEGORY_MAP = {
    admin: 'owner',
    moderation: 'group',
    downloader: 'media',
    expansion: 'utility',
    games: 'fun',
    general: 'misc',
    store: 'finance',
    textmaker: 'converter',
    unicode: 'language',
    wow: 'fun',
    '18plus': 'fun',
    'anime-nsfw': 'fun',
};

const IMAGE_COMMANDS = new Set([
    'aiimage', 'aiart', 'dalle', 'dream', 'generate', 'imagine',
    'geminiimg', 'gptimg', 'lexica', 'editimage', 'pixelart', 'logomaker',
]);

function isImageCommand(plugin) {
    const name = String(plugin?.name || '').toLowerCase();
    return plugin?.imageCommand === true || IMAGE_COMMANDS.has(name);
}

function adaptCommand(plugin) {
    if (!plugin || typeof plugin !== 'object') return plugin;

    plugin.desc = plugin.desc || plugin.description || 'Madara command';
    plugin.category = CATEGORY_MAP[plugin.category] || plugin.category;

    // Madara plugins receive (sock, msg, args, ctx). The imported command
    // collection uses one context object. Normalize that shape at load time
    // so both command families share the same handler and session features.
    if (typeof plugin.execute === 'function' && plugin.execute.length <= 1 && !plugin.__madaraAdapted) {
        const execute = plugin.execute;
        plugin.execute = (sock, msg, args, ctx) => execute({
            ...ctx,
            sock,
            msg,
            args,
            from: ctx.from,
            sender: ctx.sender,
            prefix: ctx.prefix,
            isGroup: ctx.isGroup,
            isPrivate: ctx.isPrivate,
            isOwner: ctx.isOwner,
            isAdmin: ctx.isSenderAdmin,
            isSenderAdmin: ctx.isSenderAdmin,
            isBotAdmin: ctx.isBotAdmin,
            phoneNumber: ctx.sessionPhone,
            reply: ctx.reply,
            send: ctx.send,
            react: ctx.react,
            quoted: ctx.quoted,
            quotedText: ctx.getQuotedText?.() || '',
            downloadMedia: ctx.downloadMedia,
            getMentions: ctx.getMentions,
            database: ctx.database || require('../utils/database'),
            settings: ctx.settings,
        });
        plugin.__madaraAdapted = true;
    }

    // Imported image commands traditionally call sock.sendMessage({ image })
    // directly. Give every image-generation command the same Madara carousel
    // transport without changing each imported command individually.
    if (isImageCommand(plugin) && typeof plugin.execute === 'function' && !plugin.__madaraCarouselAdapted) {
        const execute = plugin.execute;
        plugin.execute = (sock, msg, args, ctx) => {
            const carouselSock = new Proxy(sock, {
                get(target, prop, receiver) {
                    if (prop !== 'sendMessage') return Reflect.get(target, prop, receiver);
                    return async (jid, content, options) => {
                        if (content?.image) {
                            return sendImageCarousel({
                                sock: target,
                                msg,
                                from: jid || ctx.from,
                                images: [content.image],
                                title: `${String(plugin.name).toUpperCase()} · MADARA IMAGE STUDIO`,
                                caption: content.caption || `🎨 Generated with ${plugin.name}.`,
                            });
                        }
                        return target.sendMessage(jid, content, options);
                    };
                },
            });
            return execute(carouselSock, msg, args, ctx);
        };
        plugin.__madaraCarouselAdapted = true;
    }

    return plugin;
}

function loadCommands() {
    commands.clear(); plugins.clear(); categories.clear();
    let count = 0;
    const loadedPlugins = [];
    const seenPluginObjects = new WeakSet();
    let dirs;
    try {
        dirs = fs.readdirSync(COMMANDS_DIR).filter(d => {
            if (/[{},]/.test(d)) return false;
            try { return fs.statSync(path.join(COMMANDS_DIR, d)).isDirectory(); } catch { return false; }
        });
    } catch (e) { console.error('[Loader] Cannot read commands dir:', e.message); return 0; }

    for (const dir of dirs) {
        let files;
        try { files = fs.readdirSync(path.join(COMMANDS_DIR, dir)).filter(f => f.endsWith('.js')); }
        catch { continue; }

        for (const file of files) {
            const filePath = path.join(COMMANDS_DIR, dir, file);
            try {
                delete require.cache[require.resolve(filePath)];
                const raw = require(filePath);
                // Support both single-plugin and array-of-plugins exports
                const pluginList = Array.isArray(raw) ? raw : [raw];
                for (const plugin of pluginList) {
                    if (!plugin || typeof plugin !== 'object' || !plugin.name || seenPluginObjects.has(plugin)) continue;
                    seenPluginObjects.add(plugin);
                    adaptCommand(plugin);
                    loadedPlugins.push({ plugin, dir, file });
                    count++;
                }
            } catch (e) { console.error(`[Loader] Failed ${dir}/${file}:`, e.message); }
        }
    }

    // Resolve every primary name before aliases so an alias can never hijack a
    // command name. Duplicate primary names are kept under a category-scoped
    // name; duplicate or conflicting aliases are removed from later commands.
    const orderedPlugins = loadedPlugins.sort((a, b) =>
        `${a.dir}/${a.file}`.localeCompare(`${b.dir}/${b.file}`)
    );
    const primaryOwners = new Map();
    let renamedPrimaries = 0;
    for (const entry of orderedPlugins) {
        const { plugin, dir, file } = entry;
        plugin.name = String(plugin.name).trim();
        const originalName = plugin.name.toLowerCase();
        let resolvedName = originalName;
        if (primaryOwners.has(resolvedName)) {
            const stem = path.basename(file, '.js').toLowerCase();
            const suffix = stem === originalName ? dir : `${dir}-${stem}`;
            resolvedName = `${originalName}-${suffix}`;
            let index = 2;
            while (primaryOwners.has(resolvedName)) resolvedName = `${originalName}-${suffix}-${index++}`;
            plugin.name = resolvedName;
            renamedPrimaries++;
        }
        primaryOwners.set(resolvedName, plugin);
    }

    const claimedNames = new Set(primaryOwners.keys());
    let removedAliases = 0;
    for (const { plugin, dir, file } of orderedPlugins) {
        const primary = String(plugin.name).toLowerCase();
        plugins.set(primary, plugin);
        commands.set(primary, plugin);

        if (Array.isArray(plugin.aliases)) {
            const keptAliases = [];
            for (const rawAlias of plugin.aliases) {
                const alias = String(rawAlias).trim().toLowerCase();
                if (!alias || alias === primary || claimedNames.has(alias)) {
                    removedAliases++;
                    continue;
                }
                claimedNames.add(alias);
                keptAliases.push(rawAlias);
                commands.set(alias, plugin);
            }
            plugin.aliases = keptAliases;
        }

        const cat = plugin.category || CATEGORY_MAP[dir] || dir;
        if (!categories.has(cat)) categories.set(cat, []);
        categories.get(cat).push(plugin);
    }
    if (renamedPrimaries || removedAliases) {
        console.warn(`[Loader] Normalized command names: ${renamedPrimaries} duplicate primary names renamed; ${removedAliases} conflicting aliases removed.`);
    }
    return count;
}

function getCommand(name) { return commands.get(name?.toLowerCase()); }
function getAllCommands() { return plugins; }
function getCategories() { return categories; }
function reloadCommands() { return loadCommands(); }

module.exports = { loadCommands, getCommand, getAllCommands, getCategories, reloadCommands };
