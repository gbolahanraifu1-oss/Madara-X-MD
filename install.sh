#!/bin/bash
# ╔══════════════════════════════════════════════════════╗
# ║   MADARA X-MD — Installer Script                  ║
# ║   © 2026 MADARA X-MD INC. | GBEXCHANGE †                  ║
# ╚══════════════════════════════════════════════════════╝

set -e

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   💣 MADARA X-MD — Installing...              ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &>/dev/null; then
    echo "❌ Node.js not found. Install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Create required dirs
mkdir -p sessions data temp assets logs
echo "✅ Directories created"

# Install dependencies
# --legacy-peer-deps is required because Baileys v7 has strict peer deps
# that conflict with jimp and other packages
echo ""
echo "📦 Installing dependencies (this may take 2-3 minutes)..."
npm install --legacy-peer-deps 2>&1 | tail -8

# Check ffmpeg
echo ""
if command -v ffmpeg &>/dev/null; then
    echo "✅ ffmpeg: $(ffmpeg -version 2>&1 | head -1 | cut -d' ' -f3)"
else
    echo "⚠️  ffmpeg not found — install it:"
    echo "   Ubuntu/Debian: sudo apt-get install ffmpeg -y"
    echo "   Termux: pkg install ffmpeg"
fi

# .env setup
if [ ! -f .env ]; then
    cp .env.example .env
    echo ""
    echo "📋 .env created — EDIT IT before starting!"
    echo "   Minimum required: TELEGRAM_BOT_TOKEN"
else
    echo "✅ .env already exists"
fi

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   ✅ Installation complete!                      ║"
echo "║                                                  ║"
echo "║   1. Edit .env with your values                 ║"
echo "║   2. Start with pm2 (recommended):              ║"
echo "║      pm2 start index.js --name madara-xmd       ║"
echo "║      pm2 save                                   ║"
echo "║      pm2 startup                                ║"
echo "║                                                  ║"
echo "║   Or plain node (no auto-restart):              ║"
echo "║      npm start                                  ║"
echo "║                                                  ║"
echo "║   3. Open Telegram bot → Pair WhatsApp          ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── pm2 setup (optional but recommended) ─────────────────────────────────
echo "🔍 Checking for pm2..."
if command -v pm2 &>/dev/null; then
    echo "✅ pm2 found: $(pm2 -v)"
    echo ""
    echo "👉 To start with pm2 now:"
    echo "   pm2 start index.js --name madara-xmd"
    echo "   pm2 save && pm2 startup"
else
    echo "⚠️  pm2 not found — installing globally..."
    npm install -g pm2 2>&1 | tail -3
    if command -v pm2 &>/dev/null; then
        echo "✅ pm2 installed: $(pm2 -v)"
        echo ""
        echo "👉 To start with pm2:"
        echo "   pm2 start index.js --name madara-xmd"
        echo "   pm2 save && pm2 startup"
    else
        echo "⚠️  pm2 install failed — you can still run: npm start"
    fi
fi
echo ""
