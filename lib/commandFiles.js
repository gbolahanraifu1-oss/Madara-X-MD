'use strict';

const fs = require('fs');
const path = require('path');

function listCommandFiles(commandsRoot) {
    const root = path.resolve(commandsRoot);
    const result = [];

    function walk(directory, rootCategory) {
        let entries;
        try {
            entries = fs.readdirSync(directory, { withFileTypes: true })
                .sort((a, b) => a.name.localeCompare(b.name));
        } catch {
            return;
        }

        for (const entry of entries) {
            if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
            const absolutePath = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                walk(absolutePath, rootCategory);
                continue;
            }
            if (!entry.isFile() || !entry.name.endsWith('.js')) continue;

            const relativePath = path.relative(root, absolutePath);
            const relativeDirectory = path.dirname(relativePath);
            const folderParts = relativeDirectory === '.'
                ? []
                : relativeDirectory.split(path.sep);
            if (!rootCategory && folderParts.length === 0) continue;

            result.push({
                absolutePath,
                relativePath,
                namespace: folderParts.join('-'),
                fallbackCategory: folderParts.length > 1
                    ? folderParts.slice(1).join('-')
                    : folderParts[0] || rootCategory,
                file: entry.name,
            });
        }
    }

    let rootEntries;
    try {
        rootEntries = fs.readdirSync(root, { withFileTypes: true })
            .filter(entry => entry.isDirectory() && !entry.name.startsWith('.') &&
                entry.name !== 'node_modules' && !/[{},]/.test(entry.name))
            .sort((a, b) => a.name.localeCompare(b.name));
    } catch {
        return result;
    }

    for (const entry of rootEntries) {
        walk(path.join(root, entry.name), entry.name);
    }
    return result;
}

module.exports = { listCommandFiles };
