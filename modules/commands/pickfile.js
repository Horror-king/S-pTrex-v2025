const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "pickfile",
    version: "1.0",
    hasPermssion: 1, // Admin
    credits: "Hassan",
    description: "Install a command by replying to a .js file or using inline code.",
    commandCategory: "Admin",
    usages: "pickfile <filename.js> <code>",
    cooldowns: 5,
    usePrefix: true
  },

  run: async function ({ api, event, args, global }) {
    const { threadID, messageID, senderID, messageReply } = event;
    const HASSAN_UID = "61579279925067"; // 🔒 Your own UID

    // Strict permission: Only Hassan
    if (senderID !== HASSAN_UID) {
      return api.sendMessage("🚫 Only Hassan can install commands.", threadID, messageID);
    }

    // Reply-based .js installation
    if (messageReply && messageReply.attachments?.length > 0) {
      const attachment = messageReply.attachments[0];

      if (attachment.type !== "file" || !attachment.name.endsWith(".js")) {
        return api.sendMessage("❗ Please reply to a `.js` file.", threadID, messageID);
      }

      const filePath = path.join(__dirname, attachment.name);
      const writer = fs.createWriteStream(filePath);

      try {
        const stream = await global.getStream(attachment.url);
        stream.pipe(writer);

        writer.on("finish", async () => {
          const success = await global.client.loadCommand(attachment.name);
          if (success) {
            return api.sendMessage(`✅ Installed command: ${attachment.name}`, threadID, messageID);
          } else {
            return api.sendMessage(`⚠️ Saved ${attachment.name}, but failed to load.`, threadID, messageID);
          }
        });

        writer.on("error", (err) => {
          return api.sendMessage("❌ Error writing file: " + err.message, threadID, messageID);
        });
      } catch (err) {
        return api.sendMessage("❌ Failed to download file: " + err.message, threadID, messageID);
      }

      return;
    }

    // Inline method: pickfile filename.js <code>
    if (args.length >= 2) {
      const fileName = args[0];
      const code = args.slice(1).join(" ");

      if (!fileName.endsWith(".js")) {
        return api.sendMessage("❗ File name must end with `.js`.", threadID, messageID);
      }

      try {
        const filePath = path.join(__dirname, fileName);
        fs.writeFileSync(filePath, code, "utf8");

        const success = await global.client.loadCommand(fileName);
        if (success) {
          return api.sendMessage(`✅ Command '${fileName}' installed and loaded.`, threadID, messageID);
        } else {
          return api.sendMessage(`⚠️ File saved, but failed to load '${fileName}'.`, threadID, messageID);
        }
      } catch (err) {
        return api.sendMessage("❌ Failed to save file: " + err.message, threadID, messageID);
      }
    }

    return api.sendMessage(
      "❗ Usage:\n" +
      "- Reply to a `.js` file to install it.\n" +
      "- Or: `pickfile <filename.js> <code>`",
      threadID,
      messageID
    );
  }
};
