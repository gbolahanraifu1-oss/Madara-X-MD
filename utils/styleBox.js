function boxify(text, title = 'MADARA X-MD') {
    const raw = String(text == null ? '' : text);
    const trimmed = raw.trim();
    if (!trimmed) return raw;
    if (trimmed.startsWith('╭') || trimmed.startsWith('╔') || trimmed.startsWith('┌')) return raw;

    const lines = raw.split('\n');
    let out = `╭═══『 ${boldItalic(title)} 』═══╮\n`;
    out += `│  ◈ ＲＩＮＮＥＧＡＮ ＡＣＴＩＶＥ ◈\n`;
    out += `├──────────────────┤\n`;
    for (const line of lines) {
        if (line.trim() === '') { out += `│\n`; continue; }
        out += `│  ${line}\n`;
    }
    out += `╰══════════════════╯\n`;
    out += `     ╰─⟪ ${boldItalic('Madara X-MD')} ⟫─╯`;
    return out;
}