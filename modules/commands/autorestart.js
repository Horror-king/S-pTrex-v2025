module.exports = {
  config: {
    name: "autorestart",
    version: "1.0",
    author: "Hassan",
    role: 1, 
    shortDescription: "Toggle auto-restart feature",
    longDescription: "Enable or disable the bot's automatic restart feature",
    category: "system",
    guide: {
      en: "{p}autorestart [on|off|status]"
    }
  },

  onStart: async function ({ args, api, event, config, threadsData }) {
    try {
      const action = args[0]?.toLowerCase();
      
      if (!action || (action !== "on" && action !== "off" && action !== "status")) {
        return api.sendMessage(
          `Invalid usage. Please use:\n` +
          `• ${config.PREFIX}autorestart on - Enable auto-restart\n` +
          `• ${config.PREFIX}autorestart off - Disable auto-restart\n` +
          `• ${config.PREFIX}autorestart status - Check current status`,
          event.threadID,
          event.messageID
        );
      }

      if (action === "status") {
        const status = global.config.autoRestart.enabled ? "🟢 ON" : "🔴 OFF";
        const nextRestart = global.config.autoRestart.schedule;
        return api.sendMessage(
          `🔄 Auto-restart status: ${status}\n` +
          `⏰ Schedule: ${nextRestart}\n` +
          `👑 Admin notifications: ${global.config.autoRestart.notifyAdmins ? "ON" : "OFF"}`,
          event.threadID,
          event.messageID
        );
      }

      // Update the config
      global.config.autoRestart.enabled = action === "on";
      
      // Save to config file
      const configPath = path.join(global.client.mainPath, global.client.configPath);
      fs.writeFileSync(configPath, JSON.stringify(global.config, null, 2));
      
      // Notify admins if enabled
      if (global.config.autoRestart.notifyAdmins && global.config.ADMINBOT && global.config.ADMINBOT.length > 0) {
        const adminMessage = `⚙️ Auto-restart has been ${action === "on" ? "ENABLED" : "DISABLED"} by ${event.senderID}`;
        for (const adminID of global.config.ADMINBOT) {
          try {
            await api.sendMessage(adminMessage, adminID);
          } catch (e) {
            console.error(`Failed to notify admin ${adminID}:`, e);
          }
        }
      }

      return api.sendMessage(
        `✅ Auto-restart has been ${action === "on" ? "ENABLED" : "DISABLED"}`,
        event.threadID,
        event.messageID
      );

    } catch (error) {
      console.error("Error in autorestart command:", error);
      return api.sendMessage(
        "❌ An error occurred while updating auto-restart settings. Please try again.",
        event.threadID,
        event.messageID
      );
    }
  }
};
