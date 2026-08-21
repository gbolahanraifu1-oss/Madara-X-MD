'use strict';
const { execSync, spawn } = require('child_process');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const StickerTypes = { DEFAULT:'default', ANIMATED:'animated', CIRCLE:'circle', FULL:'full' };

// NOTE: this used to hand-roll WhatsApp sticker-pack EXIF injection here
// (pure-JS RIFF/WebP chunk manipulation). Removed — it technically
// produced a "valid" WebP (ffprobe/file were satisfied) but WhatsApp's
// own sticker validator was still rejecting the result ("can't view
// sticker info"). stickerpack.js, which uses Baileys' own NATIVE
// `stickerMetadata` option on sendMessage instead, works reliably — so
// pack/author now flow through Sticker.metadata() for callers to pass
// to sendMessage themselves instead.

class Sticker {
    constructor(data, opts={}) {
        this.data = data;
        this.pack = opts.pack||'MADARA X-MD';
        this.author = opts.author||'Madara';
        this.type = opts.type||StickerTypes.DEFAULT;
        this.quality = opts.quality||70;
    }
    async toBuffer() {
        const tmp = path.join(os.tmpdir(), `stk_${Date.now()}`);
        const inp = tmp + '_in';
        const out = tmp + '_out.webp';
        let buf;
        if (Buffer.isBuffer(this.data)) {
            buf = this.data;
        } else if (typeof this.data === 'string' && this.data.startsWith('http')) {
            const axios = require('axios');
            const res = await axios.get(this.data, { responseType:'arraybuffer' });
            buf = Buffer.from(res.data);
        } else {
            buf = fs.readFileSync(this.data);
        }
        fs.writeFileSync(inp, buf);
        // Was missing the pad=512:512:... step — scale-only with
        // force_original_aspect_ratio=decrease produces a non-square
        // frame for any non-square source (e.g. 512x288 for 16:9 media),
        // but WhatsApp strictly requires an exact 512x512 canvas for
        // stickers and silently refuses to render anything else. This
        // matches the pad filter the original working commands/converter/
        // sticker.js always had. Also added the 8s duration cap animated
        // stickers need — WhatsApp rejects oversized/overlong ones too.
        // scale+pad to exact 512x512 (WhatsApp's hard requirement), and
        // explicitly carry alpha through as rgba with a transparent pad
        // fill — without this, ffmpeg was defaulting to an opaque black
        // pad and encoding as yuv420p (NO alpha channel at all), so every
        // sticker came out as a solid opaque square instead of a proper
        // transparent one. -lossless 1 is required too: the lossy VP8
        // path here doesn't reliably keep alpha, only lossless VP8L does.
        const scalePad = 'scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0.0';
        const args = this.type === StickerTypes.ANIMATED
            ? ['-y','-i',inp,'-vf',`${scalePad},fps=15`,'-vcodec','libwebp','-lossless','1','-compression_level','6','-q:v',String(this.quality),'-loop','0','-ss','0','-t','00:00:08','-preset','default','-an','-vsync','0',out]
            : ['-y','-i',inp,'-vf',scalePad,'-vcodec','libwebp','-lossless','1','-compression_level','6','-q:v',String(this.quality),out];
        await new Promise((res,rej)=>{
            const p=spawn('ffmpeg',args);
            p.on('error',rej);
            p.on('close',code=>code===0?res():rej(new Error('ffmpeg '+code)));
        });
        let result = fs.readFileSync(out);
        try{fs.unlinkSync(inp);fs.unlinkSync(out);}catch{}
        // Pack/author metadata is NO LONGER injected here — that hand-rolled
        // EXIF chunk technically produced a "valid" WebP (ffprobe/file were
        // happy with it) but WhatsApp's own sticker validator was still
        // rejecting it ("can't view sticker info"). stickerpack.js, which
        // uses Baileys' own NATIVE `stickerMetadata` option on sendMessage
        // instead of hand-rolling the EXIF chunk, works fine — so callers
        // should pass `stickerMetadata: stk.metadata()` alongside `sticker:`
        // in their sendMessage call instead of relying on this buffer to
        // already carry pack info.
        return result;
    }
    metadata() {
        return { packname: this.pack, author: this.author };
    }
}
module.exports = { Sticker, StickerTypes };
