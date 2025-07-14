const Groq = require("groq-sdk");
const fs = require("fs");
const path = require("path");
const tmp = require("tmp");
const axios = require("axios");

const apiKey = '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';

if (!apiKey) {
  console.error("Groq API key is missing. Please set it in the transcribe.js file.");
}

const groq = new Groq({ apiKey });

module.exports = {
  config: {
    name: "transcribe",
    aliases: ["t"],
    version: "1.2.0",
    author: "Shikaki/Hassan",
    countDown: 10,
    role: 0,
    description: {
      en: "Extract words from audio (Uses openai's whisper v3 large hosted ....)"
    },
    guide: {
      en: "{pn}\n\nReply to an audio message to transcribe it."
    },
    category: "ai",
  },
  onStart: async function ({ api, message, event }) {
    try {
      // React with wait emoji
      api.setMessageReaction("⌛", event.messageID, (err) => {
        if (err) console.error("Error setting reaction:", err);
      }, true);

      // Check if the message is a reply and has an audio attachment
      if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments[0]?.type !== "audio") {
        return message.reply("Please reply to an audio message to transcribe it.");
      }

      const att = event.messageReply.attachments[0];
      const tmpDir = tmp.dirSync({ unsafeCleanup: true });
      const extension = att.original_extension || "mp3";
      const inputPath = path.join(tmpDir.name, `audio.${extension}`);

      try {
        console.log("Downloading audio file...");
        const response = await axios.get(att.url, { responseType: 'arraybuffer' });
        fs.writeFileSync(inputPath, Buffer.from(response.data));

        console.log("Transcribing audio...");
        const transcription = await groq.audio.transcriptions.create({
          file: fs.createReadStream(inputPath),
          model: "whisper-large-v3",
        });

        console.log("Transcription successful.");
        await message.reply(transcription.text);
        api.setMessageReaction("✅", event.messageID, (err) => {
          if (err) console.error("Error setting reaction:", err);
        }, true);
      } catch (error) {
        console.error("Error during transcription:", error);
        message.reply(`❌ | Failed to transcribe the audio. Error: ${error.message}`);
        api.setMessageReaction("❌", event.messageID, (err) => {
          if (err) console.error("Error setting reaction:", err);
        }, true);
      } finally {
      
        if (fs.existsSync(inputPath)) {
          fs.unlinkSync(inputPath);
        }
        tmpDir.removeCallback();
      }
    } catch (err) {
      console.error("Error in transcribe command:", err);
      message.reply(`❌ | An error occurred. Please try again later. Error: ${err.message}`);
    }
  },
};
