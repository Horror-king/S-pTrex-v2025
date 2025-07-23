const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "autorestart",
    version: "1.1",
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
      
      // Validate input
      if (!action || !["on", "off", "status"].includes(action)) {
        return api.sendMessage(
          `Invalid command usage. Please use one of these:\n` +
          `› ${config.PREFIX}autorestart on - Enable auto-restart\n` +
          `› ${config.PREFIX}autorestart off - Disable auto-restart\n` +
          `› ${config.PREFIX}autorestart status - Check current status`,
          event.threadID,
          event.messageID
        );
      }

      // Handle status check
      if (action === "status") {
        const status = global.config.autoRestart?.enabled ? "🟢 ON" : "🔴 OFF";
        const schedule = global.config.autoRestart?.schedule || "Not set";
        const notify = global.config.autoRestart?.notifyAdmins ? "ON" : "OFF";
        
        return api.sendMessage(
          `⚙️ Auto-Restart Status:\n\n` +
          `Status: ${status}\n` +
          `Schedule: ${schedule}\n` +
          `Admin Notifications: ${notify}`,
          event.threadID,
          event.messageID
        );
      }

      // Update the config
      const newStatus = action === "on";
      
      // Make sure autoRestart object exists
      if (!global.config.autoRestart) {
        global.config.autoRestart = {
          enabled: newStatus,
          schedule: "0 */6 * * *",
          notifyAdmins: true
        };
      } else {
        global.config.autoRestart.enabled = newStatus;
      }

      // Save to config file
      try {
        const configPath = path.join(global.client.mainPath, global.client.configPath);
        await fs.writeFile(configPath, JSON.stringify(global.config, null, 2));
        
        // Confirm update
        const successMessage = `✅ Auto-restart has been ${newStatus ? "ENABLED" : "DISABLED"}`;
        
        // Notify admins if enabled
        if (global.config.autoRestart.notifyAdmins && global.config.ADMINBOT?.length > 0) {
          const adminMessage = `⚙️ System Update:\n${successMessage}\nChanged by: ${event.senderID}`;
          
          for (const adminID of global.config.ADMINBOT) {
            if (adminID !== event.senderID) { // Don't notify the person who made the change
              try {
                await api.sendMessage(adminMessage, adminID);
              } catch (e) {
                console.error("Failed to notify admin:", e);
              }
            }
          }
        }

        return api.sendMessage(successMessage, event.threadID, event.messageID);

      } catch (saveError) {
        console.error("Failed to save config:", saveError);
        return api.sendMessage(
          "❌ Failed to save configuration changes. Please check the bot's permissions.",
          event.threadID,
          event.messageID
        );
      }

    } catch (error) {
      console.error("Error in autorestart command:", error);
      return api.sendMessage(
        "❌ An unexpected error occurred. Please check the console for details.",
        event.threadID,
        event.messageID
      );
    }
  }
};
