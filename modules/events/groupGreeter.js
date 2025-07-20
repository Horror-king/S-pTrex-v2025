module.exports = {
  config: {
    name: "groupGreeter", // Changed from "welcome"
    version: "1.0",
    author: "Your Name",
    eventType: ["log:subscribe"],
    description: "Custom greeting when new members join",
    dependencies: {}
  },

  onChat: async function({ api, event }) {
    // 🌟 CUSTOMIZE THESE VALUES 🌟
    const settings = {
      greetingWord: "Hello",    // Change to "Hi", "Welcome", etc.
      groupTitle: "the family", // Default if can't get group name
      mainMessage: "We're glad you're here!",
      signature: "Enjoy your stay! 😊",
      delay: 1500 // Anti-flood delay in ms
    };
    // 🌟 END OF CUSTOMIZATION 🌟

    try {
      // Only handle join events
      if (event.logMessageType !== "log:subscribe") return;

      // Skip if bot was added
      const botID = api.getCurrentUserID();
      const newMembers = event.logMessageData.addedParticipants
        .filter(user => user.userFbId !== botID);
      if (newMembers.length === 0) return;

      // Get actual group name
      let groupName = settings.groupTitle;
      try {
        const info = await api.getThreadInfo(event.threadID);
        if (info.threadName) groupName = info.threadName;
      } catch (e) {}

      // Prepare mentions
      const mentions = newMembers.map(user => ({
        id: user.userFbId,
        tag: user.fullName || "friend"
      }));

      // Construct message
      const message = `
${settings.greetingWord} ${mentions.map(m => `@${m.tag}`).join(', ')}!

You've joined ${groupName}
${settings.mainMessage}

${settings.signature}
      `.trim();

      // Send with delay
      await new Promise(resolve => setTimeout(resolve, settings.delay));
      await api.sendMessage({
        body: message,
        mentions: mentions
      }, event.threadID);

    } catch (error) {
      console.error("Greeter Error:", error);
    }
  }
};
