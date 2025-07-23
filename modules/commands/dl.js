const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "dl",
    version: "1.4",
    author: "Hassan",
    countDown: 5,
    role: 0,
    shortDescription: "Generate and download AI image",
    longDescription: "Generate AI image using theone-fast-image-gen API. Supports --ar (aspect ratio) and --seed.",
    category: "image",
    guide: `{pn} [prompt] [--ar aspectRatio] [--seed number]

Examples:
{pn} A cyberpunk cat in a rainy city
{pn} A samurai warrior --ar 1:1
{pn} Futuristic castle --ar 9:16 --seed 12345

Aspect Ratios: 16:9 (default), 1:1, 9:16, 4:3, 3:4
Seed: Optional number for consistent results`
  },

  onStart: async function ({ event, message, args, api }) {
    if (args.length === 0) {
      return message.reply("❌ Please enter a prompt.\nExample: dl A cyberpunk cat in a rainy city");
    }

    const fullInput = args.join(" ");
    const promptMatch = fullInput.match(/^(.*?)(--|$)/);
    const prompt = promptMatch ? promptMatch[1].trim() : fullInput.trim();

    const arMatch = fullInput.match(/--ar\s+(\d+:\d+)/);
    const seedMatch = fullInput.match(/--seed\s+(\d+)/);

    const aspectRatio = arMatch ? arMatch[1] : "16:9";
    const seed = seedMatch ? seedMatch[1] : null;

    if (!prompt) {
      return message.reply("❌ Missing prompt.\nExample: dl A cyberpunk cat in a rainy city");
    }

    try {
      
      api.setMessageReaction("💚", event.messageID, () => {}, true);
      
      let apiUrl = `https://theone-fast-image-gen.vercel.app/?prompt=${encodeURIComponent(prompt)}&size=${aspectRatio}`;
      if (seed) apiUrl += `&seed=${seed}`;

      const apiRes = await axios.get(apiUrl);
      const downloadUrl = apiRes.data?.download_url;

      if (!downloadUrl) {
        return message.reply("❌ Failed to retrieve image URL. Please try again with a different prompt.");
      }

      const imgResponse = await axios.get(downloadUrl, { responseType: "arraybuffer" });
      const filePath = path.join(__dirname, "dl_output.png");
      fs.writeFileSync(filePath, imgResponse.data);

      await message.reply({
        body: `✅ Image generated successfully.${seed ? `\nSeed: ${seed}` : ""}`,
        attachment: fs.createReadStream(filePath)
      }, () => fs.unlinkSync(filePath));

      api.setMessageReaction("✅️", event.messageID, () => {}, true);

    } catch (err) {
      console.error("❌ DL API Error:", err.message);
      return message.reply("❌ Error generating image. Please try again later.");
    }
  }
};
