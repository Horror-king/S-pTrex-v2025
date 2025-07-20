module.exports = {
  config: {
    name: "welcome",
    version: "1.0",
    author: "Hassan",
    eventType: ["log:subscribe"],
    description: "Welcome new group members with dynamic group name",
    dependencies: {
      "fs-extra": ""
    }
  },

  onChat: async function({ api, event }) {
    const { threadID, logMessageType, logMessageData } = event;
    
    if (logMessageType === "log:subscribe") {
      try {
        // Get the list of added participants
        const addedParticipants = logMessageData.addedParticipants;
        
        // Check if the bot was added (we don't want to welcome itself)
        const botID = api.getCurrentUserID();
        if (addedParticipants.some(p => p.userFbId === botID)) {
          return;
        }
        
        // Get the group's name dynamically
        const threadInfo = await api.getThreadInfo(threadID);
        const groupName = threadInfo.threadName || "this group";
        
        // Create welcome message
        const welcomeMessage = `Hello ${addedParticipants.map(p => p.fullName).join(', ')}!\n\n` +
                              `Welcome you to the chat group: ${groupName}\n` +
                              `Have a nice morning 😊`;
        
        // Send welcome message
        await api.sendMessage(welcomeMessage, threadID);
      } catch (error) {
        console.error("Error in welcome event:", error);
      }
    }
  }
};
