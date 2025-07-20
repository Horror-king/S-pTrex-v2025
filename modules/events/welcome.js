module.exports = {
  config: {
    name: "welcome",
    version: "4.0",
    author: "Your Name",
    eventType: ["log:subscribe"],
    description: "100% Working Welcome Message",
    dependencies: {
      "fs-extra": "",
      "delay": ""
    }
  },

  onChat: async function({ api, event }) {
    try {
      console.log('\n[WELCOME DEBUG] Raw event:', JSON.stringify(event, null, 2));
      
      // 1. Only process subscribe events
      if (event.logMessageType !== "log:subscribe") return;
      
      console.log('[WELCOME] New member detected');
      
      // 2. Get added users (skip bot)
      const botID = api.getCurrentUserID();
      const addedUsers = event.logMessageData.addedParticipants
        .filter(user => user.userFbId !== botID);
      
      if (addedUsers.length === 0) {
        return console.log('[WELCOME] Only bot was added');
      }
      
      // 3. Get group name (with fallback)
      let groupName = "our group";
      try {
        const threadInfo = await api.getThreadInfo(event.threadID);
        groupName = threadInfo.threadName || groupName;
      } catch (e) {
        console.log('[WELCOME] Using default group name');
      }
      
      // 4. Create message
      const names = addedUsers.map(u => u.fullName).join(', ');
      const welcomeMsg = `🎉 Hello ${names}!\n\n` +
                        `Welcome to ${groupName}\n` +
                        `Enjoy your stay! 😊`;
      
      // 5. Send with delay and mentions
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await api.sendMessage({
        body: welcomeMsg,
        mentions: addedUsers.map(user => ({
          tag: user.fullName,
          id: user.userFbId
        }))
      }, event.threadID);
      
      console.log('[WELCOME] Message sent successfully!');
      
    } catch (error) {
      console.error('[WELCOME CRITICAL ERROR]', error);
    }
  }
};
