const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const readingState = {}; // { threadID: { text, pos, title } }

module.exports.config = {
  name: "book",
  version: "3.0",
  hasPermssion: 0,
  credits: "Hassan",
  description: "List books by page or read books by name, page-by-page",
  commandCategory: "Books",
  usages: "book [page number | book name | next]",
  cooldowns: 3,
  usePrefix: true,
  aliases: []
};

module.exports.run = async function ({ api, event, args }) {
  const threadID = event.threadID;

  // Continue reading current book
  if (args[0]?.toLowerCase() === "next") {
    if (!readingState[threadID]) {
      return api.sendMessage("❌ You haven't started reading a book yet.\nUse: book <title>", threadID);
    }

    const { text, pos, title } = readingState[threadID];
    const nextChunk = text.substring(pos, pos + 1000);
    readingState[threadID].pos += 1000;

    if (!nextChunk.trim()) {
      delete readingState[threadID];
      return api.sendMessage(`🎉 You finished reading "${title}"!`, threadID);
    }

    return api.sendMessage(`📖 ${title}\n\n${nextChunk.trim()}\n\n🔁 Reply: book next`, threadID);
  }

  const input = args.join(" ").trim();

  // If input is a number: list book titles from scraped site
  if (!isNaN(input)) {
    const page = parseInt(input);
    try {
      const res = await axios.get(`https://ebooks-api.vercel.app/books?pageNumber=${page}`);
      const books = res.data.books;

      if (!books || books.length === 0) {
        return api.sendMessage("❌ No books found on that page.", threadID);
      }

      const list = books.map((b, i) => `📘 ${i + 1}. ${b.title} - ${b.price}`).join("\n");
      return api.sendMessage(`📚 Books on Page ${page}:

${list}\n\n📖 To read a book: book <title>`, threadID);
    } catch (err) {
      console.error("BOOK PAGE ERROR:", err.message);
      return api.sendMessage("❌ Failed to load book list.", threadID);
    }
  }

  // Otherwise: treat input as a search term
  if (!input) {
    return api.sendMessage("❌ Please provide a book title or page number.\nUsage: book 2 or book alice", threadID);
  }

  try {
    const searchRes = await axios.get(`https://ebooks-api.vercel.app/booksearch?q=${encodeURIComponent(input)}`);
    const results = searchRes.data.results;

    if (!results || results.length === 0) {
      return api.sendMessage("❌ No readable books found for that title.", threadID);
    }

    // Pick the first readable book
    const book = results[0];
    const textRes = await axios.get(book.text_url);
    const fullText = textRes.data;

    readingState[threadID] = {
      title: book.title,
      text: fullText,
      pos: 1000
    };

    const firstPage = fullText.substring(0, 1000).trim();

    return api.sendMessage(`📘 Started reading: "${book.title}"\n👤 Author: ${book.author}\n\n${firstPage}\n\n🔁 Reply: book next`, threadID);
  } catch (err) {
    console.error("BOOK SEARCH ERROR:", err.message || err);
    return api.sendMessage("🚨 Failed to fetch or read book.", threadID);
  }
};
