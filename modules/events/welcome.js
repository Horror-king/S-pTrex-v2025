module.exports = {
  config: {
    name: "welcome",
    version: "3.0",
    author: "Your Name",
    eventType: ["log:subscribe"],
    description: "Guaranteed welcome message for new members",
    dependencies: {
      "delay": ""
    }
  },

  onChat: async function({ api, event }) {
    const { threadID, logMessageType, logMessageData } = event;
    
    if (logMessageType === "log:subscribe") {
      try {
        console.log('[WELCOME] New member event detected'); // Debug log
        
        // 1. Get bot ID
        const botID = api.getCurrentUserID();
        
        // 2. Filter out bot addition
        const newMembers = logMessageData.addedParticipants.filter(
          user => user.userFbId !== botID
        );
        
        if (newMembers.length === 0) {
          return console.log('[WELCOME] No real users added, skipping');
        }
        
        // 3. Get group name with error fallback
        let groupName = "the group";
        try {
          const threadInfo = await api.getThreadInfo(threadID);
          groupName = threadInfo.threadName || groupName;
        } catch (e) {
          console.log('[WELCOME] Could not fetch group name, using default');
        }
        
        // 4. Create personalized message
        const nameList = newMembers.map(user => 
          user.fullName || `user-${user.userFbId}`
        ).join(', ');
        
        const welcomeMessage = `👋 Hello ${nameList}!\n\n` +
                              `Welcome to: ${groupName}\n` +
                              `Enjoy your stay! 😊`;
        
        // 5. Add delay to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 6. Send with error handling
        await api.sendMessage({
          body: welcomeMessage,
          mentions: newMembers.map(user => ({
            tag: user.fullName || '',
            id: user.userFbId
          }))
        }, threadID);
        
        console.log(`[WELCOME] Message sent successfully to ${threadID}`);
        
      } catch (error) {
        console.error('[WELCOME ERROR]', error);
      }
    }
  }
};
