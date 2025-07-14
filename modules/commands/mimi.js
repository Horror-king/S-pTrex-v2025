const axios = require("axios");

const GROQ_API_KEY = "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";
const MAX_TOKENS = 500;

if (!global.client) global.client = {};
if (!global.client.groqChats) global.client.groqChats = new Map();

module.exports = {
  config: {
    name: "mimi",
    aliases: [],
    version: "1.2",
    author: "Hassan",
    countDown: 5,
    role: 0,
    shortDescription: "Talk to Groq LLaMA 3.3",
    longDescription: "Fast, short, and direct AI replies via Groq LLaMA 3.3 70B.",
    category: "ai",
    guide: {
      en: "{pn} [prompt] - Get reply from Groq\n{pn} clear - Reset chat"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    await this.handleRequest({ api, event, args, message });
  },

  onReply: async function ({ api, event, message, Reply }) {
    const { threadID, senderID } = event;
    if (senderID !== Reply.author) return message.reply("❌ Only the original user can continue this conversation.");
    await this.handleRequest({ api, event, args: event.body.split(" "), message, isReply: true });
  },

  handleRequest: async function ({ api, event, args, message, isReply = false }) {
    const { threadID, senderID } = event;
    const chatKey = `${threadID}_${senderID}`;
    let prompt = args.join(" ").trim();

    if (prompt.toLowerCase() === "clear") {
      global.client.groqChats.delete(chatKey);
      return message.reply("🧹 Chat history cleared.");
    }

    if (!global.client.groqChats.has(chatKey)) {
      global.client.groqChats.set(chatKey, [
        {
          role: "system",
          content: "Reply briefly and directly. Avoid unnecessary explanations or long answers."
        }
      ]);
    }

    const chatHistory = global.client.groqChats.get(chatKey);

    if (!prompt && !isReply) {
      return message.reply("❓ Please enter a prompt or question.");
    }

    chatHistory.push({ role: "user", content: prompt });

    try {
      const response = await axios.post(
        GROQ_API_URL,
        {
          model: MODEL,
          messages: chatHistory,
          max_tokens: MAX_TOKENS,
          stream: false
        },
        {
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      const reply = response.data?.choices?.[0]?.message?.content?.trim() || "❌ No response.";
      chatHistory.push({ role: "assistant", content: reply });

      api.sendMessage(reply, threadID, (err, info) => {
        if (!err) {
          global.api.handleReply.set(info.messageID, {
            name: "groq",
            author: senderID,
            threadID,
            chatKey
          });
        }
      }, event.messageID);
    } catch (err) {
      console.error("❌ Groq API Error:", err.response?.data || err.message);
      let errorMsg = "❌ Something went wrong. Try again.";
      if (err.response?.status === 429) {
        errorMsg = "⚠️ Rate limit exceeded. Please wait and try again.";
      } else if (err.response?.data?.error?.message) {
        errorMsg = `API Error: ${err.response.data.error.message}`;
      }
      api.sendMessage(errorMsg, threadID, event.messageID);
    }
  }
};
