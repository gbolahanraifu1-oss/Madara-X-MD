These 4 legacy plugins have been rebuilt for this bot's actual architecture
(Baileys + module.exports={name,execute(sock,msg,args,ctx)} + lib/db.js)
and now live as real commands:

  antiBadword.js  -> commands/group/antibadword.js   (.antibadword on/off/add/list)
                      + checkBadWord() wired into lib/handler.js
  antispam.js     -> commands/group/spamcooldown.js  (.spamcooldown on/off)
                      + checkSpamCooldown() wired into lib/handler.js
                      (kept separate from the existing kick-based .antispam
                      and warn-based .santigroupspam — this one mutes)
  checklang.js    -> commands/language/setlang.js    (.setlang <code>)
                      + lib/autotranslate.js, auto-translates plain short
                      DM replies only (never group chats or stylized cards
                      like .menu, to avoid wrecking box-drawing layouts)
  santicall.js    -> commands/owner/anticall.js       (.anticall on/off/silent/msg)
                      + handleCall() in lib/madaraFeatures.js now reads the
                      runtime db setting first, falls back to ANTI_CALL env var

This folder can be deleted — nothing in it is loaded or required anywhere
anymore. Left in place only as a changelog note.
