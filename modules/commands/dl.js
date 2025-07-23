const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "dl",
    version: "1.0",
    author: "Hassan",
    countDown: 5,
    role: 0,
    shortDescription: "Generate and download AI image",
    longDescription: "Use a prompt to generate an image using theone-fast-image-gen API and download it instantly.",
    category: "image",
    guide: "{pn} [your prompt]\nExample: {pn} A cyberpunk cat in a rainy city"
  },

  onStart: async function ({ event, message, args, api }) {
    const prompt = args.join(" ").trim();
    if (!prompt) {
      return message.reply("❌ Please enter a prompt.\nExample: dl A cyberpunk cat in a rainy city");
    }

    try {
      // React with 💚
      api.setMessageReaction("💚", event.messageID, () => {}, true);

      // Step 1: Get the download_url from API
      const apiRes = await axios.get(`https://theone-fast-image-gen.vercel.app/?prompt=${encodeURIComponent(prompt)}`);
      const downloadUrl = apiRes.data?.download_url;

      if (!downloadUrl) {
        return message.reply("❌ Failed to retrieve image URL. Please try a different prompt.");
      }

      // Step 2: Download the image
      const imgResponse = await axios.get(downloadUrl, { responseType: "arraybuffer" });
      const filePath = path.join(__dirname, "dl_output.png");
      fs.writeFileSync(filePath, imgResponse.data);

      // Step 3: Send the image
      return message.reply({
        body: "✅ Here's your generated image.",
        attachment: fs.createReadStream(filePath)
      }, () => fs.unlinkSync(filePath));
    } catch (err) {
      console.error("❌ DL API Error:", err.message);
      return message.reply("❌ Error generating image. Please try again later.");
    }
  }
};
