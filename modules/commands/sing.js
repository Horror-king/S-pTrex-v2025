const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "sing",
    version: "1.0",
    author: "Aryan Chauhan",
    countDown: 5,
    role: 0,
    shortDescription: "Sing with YouTube2 API",
    longDescription: "Play music from YouTube by searching with a query, using YouTube2 API.",
    category: "music",
    guide: {
      en: "{pn} <song name>\nExample: {pn} apt"
    }
  },

  onStart: async function ({ api, event, args }) {
    const query = args.join(" ");
    if (!query) {
      return api.sendMessage(
        "⚠️ Please provide a song name!\nExample: sing apt",
        event.threadID,
        event.messageID
      );
    }

    const tid = event.threadID;
    const filePath = path.join(__dirname, "sing.mp3");

    api.sendMessage(
      `🎤 Fetching YouTube song...\n🔍 Query: ${query}`,
      tid,
      async (err, info) => {
        if (err) return;
        const genMsgID = info.messageID;

        try {
    const { data } = await axios.get(
            `https://aryapio.onrender.com/play/youtube2?q=${encodeURIComponent(query)}&apikey=aryan123`
          );

          if (!data?.status || !data?.data?.audio) {
            api.sendMessage("❌ Failed to get audio link.", tid, event.messageID);
            return api.unsendMessage(genMsgID);
          }

          const response = await axios({
            method: "GET",
            url: data.data.audio,
            responseType: "stream"
          });

          const writer = fs.createWriteStream(filePath);
          response.data.pipe(writer);

          writer.on("finish", () => {
            api.sendMessage(
              {
                body: `✅ Here is your song!\n🎶 ${query}`,
                attachment: fs.createReadStream(filePath)
              },
              tid,
              () => {
                fs.unlinkSync(filePath);
                api.unsendMessage(genMsgID);
              },
              event.messageID
            );
          });

          writer.on("error", () => {
            api.sendMessage("❌ Failed to save audio file.", tid, event.messageID);
            api.unsendMessage(genMsgID);
          });

        } catch (err) {
          console.error(err);
          api.sendMessage("❌ Error: Unable to fetch song. Please try again later.", tid, event.messageID);
          api.unsendMessage(genMsgID);
        }
      }
    );
  }
};
