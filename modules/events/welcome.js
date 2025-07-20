module.exports = {
  config: {
    name: "welcome",
    version: "2.0",
    author: "Your Name",
    eventType: ["log:subscribe"],
    description: "Automatically welcome new members",
    dependencies: {
      "delay": ""
    }
  },

  onChat: async function({ api, event }) {
    const { threadID, logMessageType, logMessageData } = event;
    
    if (logMessageType === "log:subscribe") {
      try {
        // Get bot ID and check if it was added
        const botID = api.getCurrentUserID();
        const addedUsers = logMessageData.addedParticipants;
        
        // Skip if bot was added
        if (addedUsers.some(user => user.userFbId === botID)) {
          return console.log("Bot was added to group, skipping welcome message");
        }

        // Get group info
        const threadInfo = await api.getThreadInfo(threadID);
        const groupName = threadInfo.threadName || "the group";
        
        // Create welcome message
        const welcomeMessage = `👋 Hello ${addedUsers.map(user => user.fullName).join(', ')}!\n\n` +
                              `Welcome to: ${groupName}\n` +
                              `Enjoy your stay! 😊`;
        
        // Add delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Send message
        await api.sendMessage(welcomeMessage, threadID);
        
        console.log(`Sent welcome message in ${threadID}`);
      } catch (error) {
        console.error("Welcome error:", error);
      }
    }
  }
};
