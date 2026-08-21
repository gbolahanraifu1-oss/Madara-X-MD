const fs   = require('fs');
const path = require('path');

const commands   = new Map();
const plugins    = new Map();
const categories = new Map();
const COMMANDS_DIR = path.join(process.cwd(), 'commands');

function loadCommands() {
    commands.clear(); plugins.clear(); categories.clear();
    let count = 0;
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
                    if (!plugin?.name) continue;
                    commands.set(plugin.name.toLowerCase(), plugin);
                    plugins.set(plugin.name.toLowerCase(), plugin);
                    if (Array.isArray(plugin.aliases)) plugin.aliases.forEach(a => commands.set(a.toLowerCase(), plugin));
                    const cat = plugin.category || dir;
                    if (!categories.has(cat)) categories.set(cat, []);
                    categories.get(cat).push(plugin);
                    count++;
                }
            } catch (e) { console.error(`[Loader] Failed ${dir}/${file}:`, e.message); }
        }
    }
    return count;
}

function getCommand(name) { return commands.get(name?.toLowerCase()); }
function getAllCommands() { return plugins; }
function getCategories() { return categories; }
function reloadCommands() { return loadCommands(); }

module.exports = { loadCommands, getCommand, getAllCommands, getCategories, reloadCommands };
