const { getTime } = global.utils;

module.exports = {
  config: {
    name: "welcome",
    version: "2.0",
    author: "NTKhang & Modified by Assistant",
    category: "events",
    eventType: ["log:subscribe"]
  },

  langs: {
    en: {
      session1: "morning",
      session2: "noon",
      session3: "afternoon",
      session4: "evening",
      welcomeMessage: "Thank you for adding me to the group!\nMy prefix is: %1\nType %1help to see commands",
      defaultWelcomeMessage: "👋 Hello {userName}!\nWelcome to {boxName}\nHave a nice {session}! 😊",
      multiple1: "you",
      multiple2: "you all"
    }
  },

  onStart: async ({ threadsData, message, event, api, getLang }) => {
    if (event.logMessageType !== "log:subscribe") return;

    try {
      const { threadID } = event;
      const dataAddedParticipants = event.logMessageData.addedParticipants;
      
      // Check if bot was added
      if (dataAddedParticipants.some(item => item.userFbId == api.getCurrentUserID())) {
        const prefix = global.utils.getPrefix(threadID);
        return message.send(getLang("welcomeMessage", prefix));
      }

      // Process new members
      const threadData = await threadsData.get(threadID);
      if (threadData.settings?.sendWelcomeMessage === false) return;

      const bannedUsers = threadData.data?.banned_ban || [];
      const validUsers = dataAddedParticipants.filter(user => 
        !bannedUsers.some(banned => banned.id == user.userFbId)
      );

      if (validUsers.length === 0) return;

      const now = new Date();
      const hours = now.getHours();
      const session = hours <= 10 ? getLang("session1") :
                     hours <= 12 ? getLang("session2") :
                     hours <= 18 ? getLang("session3") : 
                     getLang("session4");

      const mentions = validUsers.map(user => ({
        tag: user.fullName || "New Member",
        id: user.userFbId
      }));

      const welcomeMessage = (threadData.data?.welcomeMessage || getLang("defaultWelcomeMessage"))
        .replace(/\{userName\}/g, mentions.map(m => m.tag).join(", "))
        .replace(/\{boxName\}/g, threadData.threadName || "the group")
        .replace(/\{session\}/g, session)
        .replace(/\{multiple\}/g, 
          validUsers.length > 1 ? getLang("multiple2") : getLang("multiple1"));

      await message.send({
        body: welcomeMessage,
        mentions: mentions
      });

    } catch (err) {
      console.error("Welcome error:", err);
    }
  }
};
