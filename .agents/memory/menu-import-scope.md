---
name: Menu import scope
description: Keep menu design imports separate from the bot's command library.
---

When porting menu designs into Madara-X-MD, import only the menu presentation/rendering logic and wire it to the existing command/category loader. Do not copy, dump, or merge command implementations from the source bot. Only modify existing command files when needed to expose or select a menu design.

**Why:** The project already has its own large command library, and mixing a source bot's commands into a menu-design port risks duplicated or unintended commands.

**How to apply:** Before syncing or pushing a menu port, compare command paths and contents against the pre-change branch; investigate any command additions beyond the menu selector before proceeding.
