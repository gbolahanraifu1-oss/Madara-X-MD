---
name: Menu import scope
description: Keep menu design imports separate from the bot's command library.
---

Madara-X-MD is not a collaboration project: do not add another bot's command implementations, images, branding, or source-specific naming unless the user explicitly asks. When porting a menu design, import only the requested presentation/rendering logic and wire it to Madara's existing command/category loader; preserve Madara's own assets.

**Why:** The user wants this bot's assets and identity kept distinct; importing another bot's content can imply an unwanted collaboration and add duplicate or unrelated commands.

**How to apply:** Before syncing or pushing a port, inspect asset names, image contents, references, and command paths. Exclude source-bot assets/naming and command implementations unless expressly requested; compare command paths with the pre-change branch. Then load the command registry and check transitive imports: dynamically assembled module paths can evade plain-text name searches and deleting a duplicate command file can break helpers imported by other commands.
