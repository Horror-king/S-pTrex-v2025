module.exports = {
  config: {
    name: "groupGreeter",
    version: "5.1",
    author: "Your Name",
    eventType: ["log:subscribe"],
    description: "Working welcome message for new members",
    dependencies: {}
  },

  onChat: async function({ api, event }) {
    try {
      // 1. Only handle subscribe events
      if (event.logMessageType !== "log:subscribe") return;
      
      console.log('[GREETER] New member event detected:', JSON.stringify(event, null, 2));

      // 2. Get bot ID and filter out bot addition
      const botID = api.getCurrentUserID();
      const addedUsers = event.logMessageData.addedParticipants || [];
      const newMembers = addedUsers.filter(user => user.userFbId !== botID);
      
      if (newMembers.length === 0) {
        return console.log('[GREETER] No real users added');
      }

      // 3. Get group name with error handling
      let groupName = "this group";
      try {
        const threadInfo = await api.getThreadInfo(event.threadID);
        groupName = threadInfo.threadName || groupName;
      } catch (e) {
        console.error('[GREETER] Error getting thread info:', e);
      }

      // 4. Prepare mentions
      const mentions = newMembers.map(user => ({
        id: user.userFbId,
        tag: user.fullName || "New Member"
      }));

      // 5. Create message
      const welcomeMsg = `👋 Hello ${mentions.map(m => `@${m.tag}`).join(', ')}!\n\n` +
                       `Welcome to ${groupName}\n` +
                       `Enjoy your stay! 😊`;

      // 6. Send with delay and mentions
      await new Promise(resolve => setTimeout(resolve, 2000));
      await api.sendMessage({
        body: welcomeMsg,
        mentions: mentions
      }, event.threadID);
      
      console.log('[GREETER] Welcome message sent successfully');

    } catch (error) {
      console.error('[GREETER ERROR]', error);
    }
  }
};
