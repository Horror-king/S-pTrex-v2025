const fs = require("fs-extra");
const path = require('path');
const { exec, spawn } = require("child_process");

// Provided cookie string for authentication
const providedCookieString = "datr=S0miaDC98O8V6Iunnz8WIBls;sb=S0miaNuJ1tjbuL5viJZWMMKX;ps_l=1;ps_n=1;m_pixel_ratio=1.875;wd=385x854;c_user=61579079306443;xs=36%3Av-D6BySgz34tOw%3A2%3A1755466076%3A-1%3A-1;pas=61579079306443%3AKy2M8iapxX;locale=en_GB;vpd=v1%3B718x384x1.875;fr=0EbSScQKVArUnByzN.AWciM_UBEJTVGv9blJBd-DGScPJ7Lkt9neQtQ_D9UhzE32SHS2Y.BooklN..AAA.0.0.BookpJ.AWfp734HYWc3txU-TILsAhtxU20;wl_cbv=v2%3Bclient_version%3A2896%3Btimestamp%3A1755466313;fbl_st=101025423%3BT%3A29257771;fr=0EbSScQKVArUnByzN.AWduF4Ze5CQhvS8lYIwdMXmGvOk2GSQy0RvpGI_M6EzipIpU2sI.BooklN..AAA.0.0.Bookpk.AWfRFbSgm0zCCXgl-Nw4JPAMzvw;pas=61579079306443%3AKy2M8iapxX;fbl_st=101028841%3BT%3A29257772;wl_cbv=v2%3Bclient_version%3A2896%3Btimestamp%3A1755466340;vpd=v1%3B718x384x1.875;|Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36";

const defaultConfigContent = {
  "version": "1.0.1",
  "language": "en",
  "email": "",
  "password": "",
  "useEnvForCredentials": false,
  "envGuide": "When useEnvForCredentials enabled, it will use the process.env key provided for email and password, which helps hide your credentials, you can find env in render's environment tab, you can also find it in replit secrets.",
  "DeveloperMode": true,
  "autoCreateDB": true,
  "allowInbox": false,
  "autoClean": true,
  "adminOnly": false,
  "encryptSt": false,
  "removeSt": false,
  "UPDATE": {
    "Package": false,
    "EXCLUDED": [
      "chalk",
      "mqtt",
      "https-proxy-agent"
    ],
    "Info": "This section manages the bot's automatic package updates. To disable this function, set 'Package' to false. If you only want to exclude specific packages, set them to true and add them in the 'EXCLUDED' list."
  },
  "commandDisabled": [],
  "eventDisabled": [],
  "BOTNAME": "Fmate💘",
  "PREFIX": "?",
  "ADMINBOT": [
    "61579279925067"
  ],
  "DESIGN": {
    "Title": "BOT CONSOLE",
    "Theme": "Blue",
    "Admin": "Hassan",
    "Setup": {"Info": "","Theme": ""}
  },
  "APPSTATEPATH": "appstate.json",
  "DEL_FUNCTION": false,
  "ADD_FUNCTION": true,
  "FCAOption": {
    "forceLogin": false,
    "listenEvents": true,
    "autoMarkDelivery": true,
    "autoMarkRead": false,
    "logLevel": "silent",
    "selfListen": false,
    "online": true,
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "autoReconnect": true,
    "autoRestore": true,
    "syncUp": true,
    "delay": 500
  },
  "daily": { "cooldownTime": 43200000, "rewardCoin": 500 },
  "work": { "cooldownTime": 1200000 },
  "help": { "autoUnsend": true, "delayUnsend": 60 },
  "adminUpdate": { "autoUnsend": true, "sendNoti": true, "timeToUnsend": 10 },
  "adminNoti": { "autoUnsend": true, "sendNoti": true, "timeToUnsend": 10 },
  "humanLikeDelay": { "min": 2000, "max": 8000 },
  "randomActivity": { "status": true, "intervalMin": 60, "intervalMax": 180 },
  "autoRestart": {
    "enabled": true,
    "schedule": "0 */6 * * *", // Every 6 hours
    "notifyAdmins": true
  },
  "heartbeat": {
    "enabled": true,
    "interval": 300000, // 5 minutes
    "timeout": 60000 // 1 minute
  },
  "unsendEmojis": ["🤓", "🚫"] // Added this configuration for unsend emojis
};

// Fixed chalk implementation with synchronous require and fallback
let chalk;
try {
  chalk = require('chalk');
} catch (e) {
  // Fallback to simple ANSI colors if chalk can't be loaded
  chalk = {
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    blueBright: (text) => `\x1b[94m${text}\x1b[0m`,
    hex: (color) => (text) => {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
    }
  };
  console.warn("Using fallback chalk implementation. For full features, run: npm install chalk@4.1.2");
}

const check = require("get-latest-version");
const semver = require("semver");
const { readdirSync, readFileSync, writeFileSync } = require("fs-extra");
const { join, resolve } = require("path");
const express = require("express");
const moment = require("moment-timezone");
const cron = require("node-cron");
const axios = require('axios');
const login = require('hassan-fca');

// ======== UTILITY FUNCTIONS ========
global.utils = {
  findUid: async function (url) {
    if (!url.startsWith("http")) {
      url = "https://" + url;
    }

    const fbRegex = /(?:https?:\/\/)?(?:www\.|m\.)?(facebook|fb)\.(com|me)\/(?:profile\.php\?id=(\d+)|([a-zA-Z00.\-_]+))/;
    const match = url.match(fbRegex);

    if (!match) {
      const error = new Error("Invalid Facebook link");
      error.name = "InvalidLink";
      throw error;
    }

    const usernameOrId = match[3] || match[4];
    if (!usernameOrId) {
      const error = new Error("Could not extract ID or username");
      error.name = "CannotGetData";
      throw error;
    }

    try {
      const res = await axios.get(`https://graph.facebook.com/${usernameOrId}?fields=id&access_token=350685531728|62f8ce9f74b12f84c123cc23437a4a32`);
      if (!res.data || !res.data.id) {
        const error = new Error("Profile doesn't exist");
        error.name = "LinkNotExist";
        throw error;
      }
      return res.data.id;
    } catch (err) {
      const error = new Error("Failed to fetch UID");
      error.name = "CannotGetData";
      throw error;
    }
  }
};

// ======== ENHANCED PERSISTENT STORAGE SYSTEM ========
const DATA_DIR = path.join(__dirname, 'data');
const PERSISTENT_FILE = path.join(DATA_DIR, 'persistent.json');

// Ensure data directory exists
fs.ensureDirSync(DATA_DIR);

function loadPersistentData() {
  try {
    if (fs.existsSync(PERSISTENT_FILE)) {
      const data = JSON.parse(fs.readFileSync(PERSistent_FILE, 'utf8'));
      // Validate loaded data structure
      if (!data.installedCommands || !Array.isArray(data.installedCommands)) {
        data.installedCommands = [];
      }
      if (!data.adminMode || typeof data.adminMode !== 'object') {
        data.adminMode = { enabled: false, adminUserIDs: [] };
      }
      return data;
    }
  } catch (e) {
    console.error("Error loading persistent data:", e);
  }
  return {
    installedCommands: [],
    adminMode: {
      enabled: false,
      adminUserIDs: []
    }
  };
}

// This is the ONLY savePersistentData function - remove any other declarations
function savePersistentData(data) {
  try {
    // Ensure we're only saving valid data
    const saveData = {
      installedCommands: Array.isArray(data.installedCommands) ? data.installedCommands : [],
      adminMode: {
        enabled: !!data.adminMode?.enabled,
        adminUserIDs: Array.isArray(data.adminMode?.adminUserIDs) ? data.adminMode.adminUserIDs : []
      }
    };
    fs.writeFileSync(PERSISTENT_FILE, JSON.stringify(saveData, null, 2));
    return true;
  } catch (e) {
    console.error("Error saving persistent data:", e);
    return false;
  }
}

// Load persistent data at startup
const persistentData = loadPersistentData();

// ======== ADD CREATOR PROTECTION HERE ========
const CREATOR_NAME = "Hassan";
let creatorName = CREATOR_NAME;

function protectCreatorName() {
  if (creatorName !== CREATOR_NAME) {
    console.error(`\x1b[31mCRITICAL ERROR: CREATOR NAME CHANGED FROM "${CREATOR_NAME}" TO "${creatorName}"\x1b[0m`);
    console.error(`\x1b[31mTHIS IS NOT ALLOWED. THE BOT WILL NOW CRASH.\x1b[0m`);
    process.exit(1);
  }
}

// Display creator name at startup (now using the properly initialized chalk)
console.log(chalk.blueBright(`\n========================================`));
console.log(chalk.blueBright(`=                                      =`));
console.log(chalk.blueBright(`=        BOT CREATOR: ${CREATOR_NAME}${' '.repeat(15 - CREATOR_NAME.length)}=`));
console.log(chalk.blueBright(`=                                      =`));
console.log(chalk.blueBright(`========================================\n`));

// Periodic creator name checks
setInterval(protectCreatorName, 60000); // Check every minute
// ======== END OF CREATOR PROTECTION ========

// Define defaultEmojiTranslate early so it's accessible globally and for config.json init
const defaultEmojiTranslate = "🌐";

// Global adminMode object - initialized from persistent data
global.adminMode = persistentData.adminMode || {
    enabled: false,
    adminUserIDs: []
};

// Track installed commands from persistent data
global.installedCommands = persistentData.installedCommands || [];

// --- Logger ---
const getThemeColors = () => {
  return {
    cra: chalk.hex("#FF0000"),
    cv: chalk.hex("#00FFFF"),
    cb: chalk.hex("#0000FF"),
  };
};

const logger = {
  log: (message, tag = "INFO") => {
    protectCreatorName();
    const { cv } = getThemeColors();
    console.log(`${cv(`[${tag}]`)} ${message}`);
  },
  loader: (message, tag = "LOADER") => {
    protectCreatorName();
    const { cb } = getThemeColors();
    console.log(`${cb(`[${tag}]`)} ${message}`);
  },
  err: (message, tag = "ERROR") => {
    protectCreatorName();
    const { cra } = getThemeColors();
    console.error(`${cra(`[${tag}]`)} ${message}`);
  },
  warn: (message, tag = "WARN") => {
    protectCreatorName();
    console.warn(`${chalk.hex("#FFA500")(`[${tag}]`)} ${message}`);
  }
};

// --- Utilities ---
const utils = {
  decryptState: (encryptedState, key) => {
    logger.warn("DecryptState is a placeholder. Implement actual decryption if 'encryptSt' is true.", "DECRYPT_WARN");
    return encryptedState;
  },
  encryptState: (state, key) => {
    logger.warn("EncryptState is a placeholder. Implement actual encryption if 'encryptSt' is true.", "ENCRYPT_WARN");
    return state;
  },
  humanDelay: async () => {
    const currentConfig = global.config || defaultConfigContent;
    const min = currentConfig.humanLikeDelay.min;
    const max = currentConfig.humanLikeDelay.max;
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    logger.log(`Adding human-like delay of ${delay}ms...`, "DELAY");
    return new Promise(resolve => setTimeout(resolve, delay));
  },
  findUid: async (profileUrl) => {
    logger.warn(`[WARNING] global.utils.findUid is a placeholder. It needs a proper implementation to resolve Facebook profile URLs.`, "UID_WARN");
    if (profileUrl && profileUrl.includes("facebook.com/profile.php?id=")) {
        const match = profileUrl.match(/id=(\d+)/);
        if (match && match[1]) {
            return match[1];
        }
    }
    throw new Error("Could not find UID for the provided link. global.utils.findUid requires implementation.");
  },
  restartBot: async (api, reason = "Scheduled restart") => {
    logger.warn(`Restarting bot: ${reason}`, "RESTART");

    // Save current state before restarting
    savePersistentData({
      installedCommands: global.installedCommands,
      adminMode: global.adminMode
    });

    // Notify admins if configured
    if (global.config.autoRestart.notifyAdmins && global.config.ADMINBOT && global.config.ADMINBOT.length > 0) {
      for (const adminID of global.config.ADMINBOT) {
        try {
          await api.sendMessage(
            `♻️ Bot is restarting automatically as scheduled.\nReason: ${reason}\nIt should be back online shortly.`,
            adminID
          );
        } catch (e) {
          logger.err(`Failed to send restart notification to admin ${adminID}: ${e.message}`, "RESTART_NOTIFY");
        }
      }
    }

    // Delay to allow notifications to send
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Use child process to restart
    process.on('exit', () => {
      spawn(process.argv.shift(), process.argv, {
        cwd: process.cwd(),
        detached: true,
        stdio: 'inherit'
      });
    });
    process.exit();
  },
  // FIXED HEARTBEAT FUNCTION - CORRECTED SYNTAX ERROR
  checkHeartbeat: async (api) => {
    if (!global.config.heartbeat?.enabled) return true;
    
    try {
      // Simple check to see if API is responsive
      const startTime = Date.now();
      await Promise.race([
        api.getThreadList(1, null, ['INBOX']),
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Heartbeat timeout'));
          }, global.config.heartbeat.timeout || 60000);
        })
      ]);
      const responseTime = Date.now() - startTime;
      logger.log(`Heartbeat check passed. Response time: ${responseTime}ms`, "HEARTBEAT");
      return true;
    } catch (e) {
      logger.err(`Heartbeat check failed: ${e.message}`, "HEARTBEAT_ERROR");
      return false;
    }
  }
};

// --- Thread Data Manager ---
function createThreadDataManager() {
    const threadDataStore = new Map();

    return {
        get: async (threadID, path) => {
            let current = threadDataStore.get(threadID);
            if (!current) return undefined;

            const pathParts = path.split('.');
            for (const part of pathParts) {
                if (current && typeof current === 'object' && current.has(part)) {
                    current = current.get(part);
                } else {
                    return undefined;
                }
            }
            return current;
        },
        set: async (threadID, value, path) => {
            if (!threadDataStore.has(threadID)) {
                threadDataStore.set(threadID, new Map());
            }
            let current = threadDataStore.get(threadID);
            const pathParts = path.split('.');
            for (let i = 0; i < pathParts.length; i++) {
                const part = pathParts[i];
                if (i === pathParts.length - 1) {
                    current.set(part, value);
                } else {
                    if (!current.has(part) || !(current.get(part) instanceof Map)) {
                        current.set(part, new Map());
                    }
                    current = current.get(part);
                }
            }
        },
        delete: async (threadID, path) => {
            let current = threadDataStore.get(threadID);
            if (!current) return;

            const pathParts = path.split('.');
            for (let i = 0; i < pathParts.length; i++) {
                const part = pathParts[i];
                if (i === pathParts.length - 1) {
                    current.delete(part);
                } else {
                    if (!current.has(part) || !(current.get(part) instanceof Map)) {
                        return;
                    }
                    current = current.get(part);
                }
            }
            if (threadDataStore.get(threadID)?.size === 0) {
                threadDataStore.delete(threadID);
            }
        }
    };
}

// NEW: Enhanced login function with retry logic and block detection
async function performLogin(loginData, fcaLoginOptions) {
    return new Promise((resolve, reject) => {
        if (isLoggingIn) {
            return reject(new Error("Login already in progress"));
        }

        isLoggingIn = true;
        loginAttempts++;
        lastLoginAttempt = Date.now();

        logger.log(`Attempting login (attempt ${loginAttempts}/5)`, "LOGIN_ATTEMPT");

        // Use a consistent user agent that matches your appstate
        fcaLoginOptions.userAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36";
        
        // Add these stability options
        fcaLoginOptions.autoReconnect = true;
        fcaLoginOptions.autoRestore = true;
        fcaLoginOptions.listenEvents = true;
        fcaLoginOptions.forceLogin = false;
        fcaLoginOptions.logLevel = "silent";

        login(loginData, fcaLoginOptions, (err, api) => {
            isLoggingIn = false;
            
            if (err) {
                logger.err(`Login attempt ${login极attempts} failed: ${err.error || err.message}`, "LOGIN_FAILED");
                
                // Handle specific Facebook errors
                if (err.error === 'Not logged in' || err.error === 'Login approval needed') {
                    logger.warn("Session expired or requires approval", "SESSION_ISSUE");
                    reject(new Error("SESSION_EXPIRED"));
                } else {
                    reject(err);
                }
            } else {
                loginAttempts = 0;
                isBlocked = false;
                logger.log("Login successful!", "LOGIN_SUCCESS");
                resolve(api);
            }
        });
    });
}

// NEW: Function to recover from session issues
async function recoverSession(api, loginData, fcaLoginOptions) {
    try {
        logger.log("Attempting session recovery...", "SESSION_RECOVERY");
        
        // Force a fresh login
        const tempOptions = {...fcaLoginOptions};
        tempOptions.forceLogin = true;
        const newApi = await performLogin(loginData, tempOptions);
        
        // Update global API reference
        global.client.api = newApi;
        if (global.client.listenMqtt) {
            global.client.listenMqtt.stop();
        }
        global.client.listenMqtt = newApi.listenMqtt(listen({ api: newApi }));
        
        logger.log("Session recovered successfully", "SESSION_RECOVERY");
        return newApi;
    } catch (e) {
        logger.err(`Session recovery failed: ${e.message}`, "SESSION_RECOVERY_ERROR");
        throw e;
    }
}

// --- Listener Function ---
const listen = ({ api }) => {
    return async (error, event) => {
        try {
            await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));

            if (error) {
                logger.err(`Listen error: ${error.message}`, "LISTENER_ERROR");
                
                if (error.error === 'Not logged in' || error.error === 'Login approval needed' || 
                    error.message.includes('SESSION_EXPIRED')) {
                    
                    logger.warn("Bot session expired. Attempting to recover...", "SESSION_EXPIRED");
                    
                    try {
                        // Attempt session recovery
                        await recoverSession(api, loginData, fcaLoginOptions);
                        logger.log("Session recovery initiated successfully", "SESSION_RECOVERY");
                    } catch (recoveryError) {
                        logger.err(`Session recovery failed: ${recoveryError.message}`, "RECOVERY_FAILED");
                    }
                }
                return;
            }

            // Enhanced event validation
            if (!event || typeof event !== 'object') {
                logger.err("Received invalid event object", "EVENT_VALIDATION");
                return;
            }

            // Skip processing if event is missing required properties
            if (!event.type && !event.logMessageType) {
                logger.err("Event missing type information", "EVENT_VALIDATION");
                return;
            }

            // Skip if threadID is invalid
            if (event.threadID && typeof event.threadID !== 'string') {
                logger.err("Invalid threadID in event", "EVENT_VALIDATION");
                return;
            }

            // Special handling for video messages
            if (event.attachments && event.attachments.length > 0) {
                const videoAttachments = event.attachments.filter(att => att.type === "video");
                if (videoAttachments.length > 0) {
                    logger.log(`Received video message with ${videoAttachments.length} video(s)`, "VIDEO_MESSAGE");
                    // Skip processing or add your video handling logic here
                    return;
                }
            }

            // Log event type if it exists
            if (event.type) {
                logger.log(`Received event type: ${event.type}`, "EVENT_RECEIVED");
            } else if (event.logMessageType) {
                logger.log(`Received log message event: ${event.logMessageType}`, "LOG_EVENT");
            }

            if (event.logMessageType) {
                global.client.events.forEach(async (eventModule) => {
                    if (eventModule.config.eventType && eventModule.config.eventType.includes("event") && eventModule.onChat) {
                        try {
                            logger.log(`Executing event handler for logMessageType: ${event.logMessageType} for module: ${eventModule.config.name}`, "LOG极_EVENT_HANDLER");
                            await eventModule.onChat({
                                api,
                                event,
                                threadsData: global.data.threads,
                                getLang: global.getText,
                                commandName: eventModule.config.name
                            });
                        } catch (e) {
                            logger.err(`Error executing log event handler for '${eventModule.config.name}': ${e.message}`, "LOG_EVENT_EXEC_ERROR");
                        }
                    }
                });
                if (event.logMessageType === "log:subscribe" && event.logMessageData?.addedParticipants?.some(i => i.userFbId == api.getCurrentUserID())) {
                    return;
                }
            }

            if (global.adminMode.enabled && event.senderID && !global.adminMode.adminUserIDs.includes(event.senderID)) {
                return;
            }

            // Check if event has type property before accessing it
            if (event.type === "message_reaction") {
                if (!event.messageID) {
                    logger.err("Message reaction event missing messageID", "EVENT_ERROR");
                    return;
                }

                // NEW CODE: Handle unsend emoji reactions
                const currentConfig = global.config || defaultConfigContent;
                const unsendEmojis = currentConfig.unsendEmojis || ["🤓", "🚫"];
                
                if (unsendEmojis.includes(event.reaction)) {
                    try {
                        // Instead of getMessageInfo, we'll use a simpler approach
                        // Since we can't reliably get message info, we'll:
                        // 1. Allow admins to unsend any message
                        // 2. Allow users to unsend their own messages
                        // 3. In group chats, allow participants to unsend bot messages
                        
                        // First check if the reactor is an admin
                        const isAdmin = global.config.ADMINBOT.includes(event.senderID);
                        
                        // For non-admins, we need to check if they're in the same thread
                        let isParticipant = false;
                        if (!isAdmin) {
                            try {
                                const threadInfo = await api.getThreadInfo(event.threadID);
                                isParticipant = threadInfo.participantIDs.includes(event.senderID);
                            } catch (e) {
                                logger.err(`Error getting thread info: ${e.message}`, "THREAD_INFO_ERROR");
                            }
                        }
                        
                        if (isAdmin || isParticipant) {
                            logger.log(`Unsend triggered by ${event.senderID} with reaction ${event.reaction} on message ${event.messageID}`, "UNSEND_REACTION");
                            await api.unsendMessage(event.messageID);
                            return;
                        } else {
                            logger.log(`User ${event.senderID} tried to unsend message ${event.messageID} but lacks permission`, "UNSEND_PERMISSION_DENIED");
                            return;
                        }
                    } catch (e) {
                        logger.err(`Error processing unsend reaction: ${e.message}`, "UNSEND_REACTION_ERROR");
                    }
                }

                const reactionHandler = global.client.onReaction.get(event.messageID);
                if (reactionHandler) {
                    if (reactionHandler.commandName === "prefix_change") {
                        if (event.userID !== reactionHandler.author) {
                            return api.sendMessage("Only the command user can confirm prefix change.", event.threadID);
                        }

                        await global.data.threads.set(event.threadID, reactionHandler.newPrefix, "data.prefix");
                        return api.sendMessage(
                            `✅ Prefix changed to: ${reactionHandler.newPrefix}\nSystem prefix remains: ${global.config.PREFIX}`,
                            event.threadID
                        );
                    }

                    const module = global.client.commands.get(reactionHandler.commandName) || global.client.events.get(reactionHandler.commandName);
                    if (module && module.onReaction) {
                        try {
                            logger.log(`Executing reaction handler for ${module.config.name} (message ID: ${event.messageID})`, "REACTION_EVENT");
                            await utils.humanDelay();
                            await module.onReaction({
                                api,
                                event,
                                Reaction: reactionHandler,
                                threads极: global.data.threads,
                                getLang: global.getText
                            });
                        } catch (e) {
                            logger.err(`Error executing reaction handler for '极${module.config.name}': ${e.message}`, "REACTION_EXEC_ERROR");
                            await api.sendMessage(
                                `⚠️ An error occurred while processing reaction:\n${e.message}`,
                                event.threadID
                            );
                        }
                    }
                }
                return;
            }

            // 🟢 Ensure global.api and global.api.handleReply are initialized properly
            global.api = api;
            global.api.handleReply = global.api.handleReply || new Map();

            if (event.type === "message" || event.type === "message_reply") {
                // Skip if message is empty and has no attachments
                if (!event.body && (!event.attachments || event.attachments.length === 0)) {
                    logger.log("Received empty message with no attachments", "EM极TY_MESSAGE");
                    return;
                }

                const lowerCaseBody = event.body ? event.body.toLowerCase() : '';
                const systemPrefix = global.config.PREFIX;
                let threadPrefix = await global.data.threads.get(event.threadID, "data.prefix") || systemPrefix;
                let commandFoundAndExecuted = false;

                // ======= HANDLE PREFIX COMMANDS =======
                // Check for prefix command in various formats
                const prefixCommandRegex = /^(?:prefix|\?prefix|Prefix)\s*$/i;
                if (prefixCommandRegex.test(event.body.trim())) {
                    await utils.humanDelay();
                    return api.sendMessage(
                        `🌐 System prefix: ${systemPrefix}\n🛸 Current chat prefix: ${threadPrefix}`,
                        event.threadID,
                        event.messageID
                    );
                }

                // Handle prefix change command in various formats
                const prefixChangeRegex = /^(?:prefix|\?prefix|Prefix)\s+(\S+)/i;
                const prefixChangeMatch = event.body.match(prefixChangeRegex);
                if (prefixChangeMatch) {
                    const newPrefix = prefixChangeMatch[1];

                    if (newPrefix.length > 3) {
                        return api.sendMessage("Prefix must be 1-3 characters long.", event.threadID, event.messageID);
                    }

                    const confirmationMessage = await api.sendMessage(
                        `Please react to this message to confirm changing prefix to: ${newPrefix}`,
                        event极.threadID,
                        (err, msgInfo) => {
                            if (err) return;
                            global.client.onReaction.set(msgInfo.messageID, {
                                commandName: "prefix_change",
                                threadID: event.threadID,
                                author: event.senderID,
                                newPrefix: newPrefix
                            });
                        }
                    );
                    return;
                }

                // ======= HANDLE REPLY =======
                if (event.type === "message_reply") {
                    if (!event.messageReply || !event.messageReply.messageID) {
                        logger.err("Invalid reply event - missing messageReply data", "REPLY_ERROR");
                        return;
                    }

                    const repliedToMessageID = event.messageReply.messageID;
                    const threadID = event.threadID;
                    const replierSenderID = event.senderID;

                    const replyHandler = global.api.handleReply.get(repliedToMessageID);

                    if (replyHandler && replyHandler.threadID === threadID) {
                        const command = global.client.commands.get(replyHandler.name);

                        if (command && typeof command.onReply === "function") {
                            try {
                                await utils.humanDelay();

                                await command.onReply({
                                    api,
                                    event,
                                    Reply: replyHandler,
                                    message: {
                                        reply: async (msg) => {
                                            await utils.humanDelay();
                                            api.sendMessage(msg, threadID, event.messageID);
                                        },
                                        unsend: async (msgID) => {
                                            await utils极.humanDelay();
                                            api.unsendMessage(msgID);
                                        }
                                    },
                                    global,
                                    threadsData: global.data.threads,
                                    getLang: global.getText,
                                    commandName: command.config.name
                                });

                                commandFoundAndExecuted = true;
                            } catch (e) {
                                console.error(`[REPLY_ERROR] ${e.message}`);
                                await utils.humanDelay();
                                api.sendMessage(`❌ Error while processing reply for '${replyHandler.name}':\n${极e.message}`, threadID, event.messageID);
                                commandFoundAndExecuted = true;
                            }
                        } else {
                            global.api.handleReply.delete(repliedToMessageID);
                        }
                    }
                }

                if (commandFoundAndExecuted) return;

                // ======= HANDLE onStart COMMANDS =======
                if (lowerCaseBody.startsWith(threadPrefix)) {
                    const args = event.body.slice(threadPrefix.length).trim().split(/\s+/);
                    const commandName = args.shift().toLowerCase();

                    const command =
                        global.client.commands.get(commandName) ||
                        [...global.client.commands.values()].find(cmd => cmd.config.aliases?.includes(commandName));

                    if (command && typeof command.onStart === "function") {
                        try {
                            await utils.humanDelay();
                            await command.onStart({
                                api,
                                event,
                                args,
                                message: {
                                    reply: async (msg) => {
                                        await utils.humanDelay();
                                        api.sendMessage(msg, event.threadID, event.messageID);
                                    },
                                    unsend: async (msgID) => {
                                        await utils.humanDelay();
                                        api.unsendMessage(msgID);
                                    }
                                },
                                global,
                                threadsData: global.data.threads,
                                getLang: global.getText,
                                commandName: command.config.name
                            });

                            commandFoundAndExecuted = true;
                        } catch (err) {
                            console.error(`[COMMAND_ERROR] Error in onStart for '${commandName}': ${err.message}`);
                            api.sendMessage(`❌ Error while executing '${commandName}' command:\n${err.message}`, event.threadID, event.messageID);
                        }
                    }
                }

                for (const cmdNameLower of global.client.nonPrefixCommands) {
                    if (lowerCaseBody === cmdNameLower || lowerCaseBody.startsWith(`${cmdNameLower} `)) {
                        let foundCommand = null;
                        for (const [key, cmdModule] of global.client.commands.entries()) {
                            if (key.toLowerCase() === cmdNameLower && (cmdModule.config.usePrefix === false || cmdModule.config.usePrefix === "both")) {
                                foundCommand = cmdModule;
                                break;
                            }
                        }

                        if (found极Command) {
                            if (global.adminMode.enabled && event.senderID && !global.adminMode.adminUserIDs.includes(event.senderID)) {
                                await utils.humanDelay();
                                api.sendMessage("🔒 The bot is in Admin-only mode. You can't use commands right now.", event.threadID, event.messageID);
                                commandFoundAndExecuted = true;
                                break;
                            }

                            const promptText = lowerCaseBody.startsWith(`${cmdNameLower} `) ? event.body.slice(cmdNameLower.length + 1).trim() : "";
                            const args = prompt极Text.split(/ +/).filter(Boolean);

                            if (foundCommand.config.hasPermssion !== undefined && foundCommand.config.hasPermssion > 0) {
                                if (foundCommand.config.hasPermssion === 1 && event.senderID && !global.adminMode.adminUserIDs.includes(event.senderID)) {
                                    await utils.humanDelay();
                                    api.sendMessage("You don't have permission to use this command.", event.threadID, event.messageID);
                                    commandFoundAndExecuted = true;
                                    break;
                                }
                            }

                            try {
                                logger.log(`Executing non-prefix command: ${foundCommand.config.name}`, "NON_PREFIX_COMMAND");
                                await utils.humanDelay();
                                const runFunction = foundCommand.run || foundCommand.onStart;
                                if (runFunction) {
                                    const info = {};
                                    await runFunction({
                                        api, event, args, global, prompt: promptText,
                                        threadsData: global.data.threads, getLang: global.getText, commandName: foundCommand.config.name,
                                        message: {
                                            reply: async (msg, cb) => {
                                                await utils.humanDelay();
                                                const messageInfo = await api.sendMessage(msg, event.threadID, (err, msgInfo) => {
                                                    if (!err && msgInfo) {
                                                        info.messageID = msgInfo.messageID;
                                                        info.threadID = event.threadID;
                                                    }
                                                    if (cb) cb(err, msgInfo);
                                                });
                                                if (messageInfo && messageInfo.messageID) {
                                                    info.messageID = messageInfo.messageID;
                                                    info.threadID = event.threadID;
                                                }
                                            },
                                            unsend: async (mid) => { await utils.humanDelay(); api.unsendMessage(mid); }
                                        },
                                        info
                                    });

                                    if (info.messageID) {
                                        global.client.handleReply.set(info.messageID, {
                                            name: foundCommand.config.name,
                                            threadID: event.threadID,
                                            author: event.senderID
                                        });
                                        logger.log(`Registered reply handler for message ID: ${info.messageID} (Command: ${foundCommand.config.name})`, "REPLY_REGISTER");
                                    }
                                }
                                commandFoundAndExecuted = true;
                            } catch (e) {
                                logger.err(`Error executing non-prefix command '${foundCommand.config.name}': ${e.message}`, "NON_PREFIX_EXEC");
                                await utils.humanDelay();
                                api.sendMessage(`An error occurred while running the '${foundCommand.config.name}' command:\n${e.message}`, event.threadID, event.messageID);
                            }
                            break;
                        }
                    }
                }

                if (commandFoundAndExecuted) {
                    return;
                }

                if (event.body && event.body.startsWith(threadPrefix)) {
                    const args = event.body.slice(threadPrefix.length).trim().split(/ +/);
                    const commandName = args.shift()?.toLowerCase();

                    if (!commandName) {
                        await utils.humanDelay();
                        return api.sendMessage(
                            `⚠️ The command you are using does not exist.\n` +
                            `Type ${threadPrefix}极help to see all available commands.`,
                            event.threadID,
                            event.messageID
                        );
                    }

                    const command = global.client.commands.get(commandName);

                    if (!command) {
                        await utils.humanDelay();
                        return api.sendMessage(
                            `⚠️ The command "${threadPrefix}${commandName}" does not exist.\n` +
                            `Type ${threadPrefix}help to see all available commands.`,
                            event.threadID,
                            event.messageID
                        );
                    }

                    if (command.config.usePrefix === false) {
                        await utils.humanDelay();
                        return api.sendMessage(
                            `⚠️ The command "${command.config.name}" does not require a prefix.\n` +
                            `Just type "${command.config.name} ${command.config.guide ? command.config.guide.en.split('\n')[0].replace(/.*<prompt>\s*/, '').trim() : ''}" to use it.`,
                            event.threadID,
                            event.messageID
                        );
                    }

                    if (global.adminMode.enabled && event.senderID && !global.adminMode.adminUserIDs.includes(event.senderID)) {
                        await utils.humanDelay();
                        return api.sendMessage("🔒 The bot is in Admin-only mode. You can't use commands right now.", event.threadID, event.messageID);
                    }

                    try {
                        if (command.config.hasPermssion !== undefined && command.config.hasPermssion > 0) {
                            if (command.config.hasPermssion === 1 && event.senderID && !global.adminMode.adminUserIDs极(event.senderID)) {
                                await utils.humanDelay();
                                api.sendMessage("You don't have permission to use this command.", event.threadID, event.messageID);
                                return;
                            }
                        }

                        logger.log(`Executing command: ${command.config.name}`, "COMMAND");
                        await utils.humanDelay();
                        const prefixedPrompt = args.join(" ");
                        const runFunction = command.run || command.onStart;
                        if (runFunction) {
                            const info = {};
                            await runFunction({
                              api, event, args, global, prompt: prefixedPrompt,   
                              threadsData: global.data.threads, getLang: global.getText, command极Name: command.config.name,
                                message: {
                                    reply: async (msg, cb) => {
                                        await utils.humanDelay();
                                        const messageInfo = await api.sendMessage(msg, event.threadID, (err, msgInfo) => {
                                            if (!err && msgInfo) {
                                                info.messageID = msgInfo.messageID;
                                                info.threadID = event.threadID;
                                            }
                                            if (cb极) cb(err, msgInfo);
                                        });
                                        if (messageInfo && messageInfo.messageID) {
                                            info.messageID = messageInfo.messageID;
                                            info.threadID = event.threadID;
                                        }
                                    },
                                    unsend: async (mid) => { await utils.humanDelay(); api.unsendMessage(mid); }
                                },
                                info
                            });

                            if (info.messageID) {
                                global.client.handleReply.set(info.messageID, {
                                    name: command.config.name,
                                    threadID: event.threadID,
                                    author: event.senderID
                                });
                                logger.log(`Registered reply handler for message ID: ${info.messageID} (Command: ${command.config.name})`, "REPLY_REGISTER");
                            }
                        }
                    } catch (e) {
                        logger.err(`Error executing command '${command.config.name}': ${e.message}`, "COMMAND_EXEC");
                        await utils.humanDelay();
                        api.sendMessage(`An error occurred while running the '${command.config.name}' command:\n${e.message}`, event.threadID, event.messageID);
                    }
                    return;
                }

                global.client.events.forEach(async (eventModule) => {
                    if (eventModule.config.eventType && eventModule.config.eventType.includes("message") && eventModule.onChat) {
                        try {
                            await eventModule.onChat({
                                api,
                                event,
                                threadsData: global.data.threads,
                                getLang: global.getText,
                                commandName: eventModule.config.name
                            });
                        } catch (e) {
                            logger.err(`Error executing onChat event for '${eventModule.config.name}': ${e.message}`, "ON_CHAT_EXEC_ERROR");
                            await api.sendMessage(
                                `⚠️ An error occurred in event handler:\n${e.message}`,
                                event.threadID
                            );
                        }
                    }
                });
            }
        } catch (err) {
            logger.err(`Error in listener function: ${err.message}`, "LISTENER_ERROR");
            if (event && event.threadID) {
                await api.sendMessage(
                    `⚠️ A system error occurred:\n${err.message}`,
                    event.threadID
                );
            }
        }
    };
};

// --- Custom Scheduled Scripts / Background Tasks ---
const customScript = ({ api }) => {
    logger.log("Running custom script...", "CUSTOM");

    // Auto-accept pending messages
    const acceptPendingConfig = {
        status: true, // ✅ fixed (removed stray character)
        time: 30,
    };

    function acceptPending(config) {
        if (config.status) {
            cron.schedule(`*/${config.time} * * * *`, async () => {
                try {
                    const list = [
                        ...(await api.getThreadList(1, null, ['PENDING'])),
                        ...(await api.getThreadList(1, null, ['OTHER'])),
                    ];
                    if (list[0]) {
                        await utils.humanDelay();
                        await api.sendMessage('You have been approved for the queue. (This is an automated message)', list[0].threadID);
                        logger.log(`Approved pending thread: ${list[0].threadID}`, "AUTO_PENDING");
                    } else {
                        logger.log("No pending threads to approve.", "AUTO_PENDING");
                    }
                } catch (e) {
                    logger.err(`Error accepting pending messages: ${e.message}`, "AUTO_PENDING_ERROR");
                }
            });
        }
    }
    acceptPending(acceptPendingConfig);

    // Random human-like activity
    if (global.config.randomActivity.status) {
        cron.schedule('*/1 * * * *', async () => {
            const minInterval = global.config.randomActivity.intervalMin;
            const maxInterval = global.config.randomActivity.intervalMax;
            const randomMinutes = Math.floor(Math.random() * (maxInterval - minInterval + 1)) + minInterval;

            if (Date.now() - global.client.lastActivityTime > randomMinutes * 60 * 1000) {
                try {
                    logger.log("Performing random human-like activity...", "ACTIVITY");
                    const threadList = await api.getThreadList(5, null, ['INBOX']);
                    if (threadList.length > 0) {
                        const randomThread = threadList[Math.floor(Math.random() * threadList.length)];

                        const activities = [
                            async () => {
                                await utils.humanDelay();
                                await api.setOptions({ online: false });
                                logger.log("Temporarily set bot offline.", "ACTIVITY");
                                await new Promise(resolve => setTimeout(resolve, Math.random() * 5000 + 2000));
                                await utils.humanDelay();
                                await api.setOptions({ online: true });
                                logger.log("Set bot back online.", "ACTIVITY");
                            },
                            async () => {
                                await utils.humanDelay();
                                const messages = await api.getThreadHistory(randomThread.threadID, 5);
                                if (messages && messages.length > 0) {
                                    const unreadMessages = messages.filter(msg => !msg.isRead);
                                    if (unreadMessages.length > 0) {
                                        const randomUnreadMessage = unreadMessages[Math.floor(Math.random() * unreadMessages.length)];
                                        await utils.humanDelay();
                                        await api.markAsRead(randomUnreadMessage.messageID);
                                        logger.log(`Marked message ${randomUnreadMessage.messageID} in thread ${randomThread.threadID} as read.`, "ACTIVITY");
                                    } else {
                                        logger.log(`No unread messages in thread ${randomThread.threadID} for marking as read.`, "ACTIVITY");
                                    }
                                } else {
                                    logger.log(`No messages in thread ${randomThread.threadID} for activity.`, "ACTIVITY"); // ✅ fixed
                                }
                            }
                        ];

                        if (activities.length > 0) {
                            const randomActivity = activities[Math.floor(Math.random() * activities.length)];
                            await randomActivity();
                            global.client.lastActivityTime = Date.now();
                        } else {
                            logger.log("No random activities available after filtering.", "ACTIVITY");
                        }
                    } else {
                        logger.log("No threads found for random activity.", "ACTIVITY");
                    }
                } catch (e) { // ✅ fixed
                    logger.err(`Error performing random activity: ${e.message}`, "ACTIVITY_ERROR");
                }
            }
        }, {
            scheduled: true,
            timezone: "Asia/Dhaka"
        });
    }

    // Auto-restart schedule
    if (global.config.autoRestart && global.config.autoRestart.enabled) {
        cron.schedule(global.config.autoRestart.schedule, async () => {
            await utils.restartBot(api, "Scheduled restart");
        }, {
            scheduled: true,
            timezone: "Asia/Dhaka"
        });
    }

    // Heartbeat monitoring
    if (global.config.heartbeat?.enabled) {
        const interval = global.config.heartbeat.interval || 300000; // ✅ fixed (removed stray character)
        const maxFailedAttempts = 3;
        let failedAttempts = 0;

        setInterval(async () => {
            try {
                const isHealthy = await utils.checkHeartbeat(api);
                if (!isHealthy) {
                    failedAttempts++;
                    logger.warn(`Heartbeat check failed (attempt ${failedAttempts}/${maxFailedAttempts})`, "HEARTBEAT_WARN");
                    
                    if (failedAttempts >= maxFailedAttempts) {
                        logger.err("Max failed heartbeat attempts reached. Restarting bot...", "HEARTBEAT_ERROR");
                        await utils.restartBot(api, "Heartbeat failure");
                    }
                } else {
                    failedAttempts = 0; // Reset on success
                }
            } catch (e) {
                logger.err(`Error in heartbeat check: ${e.message}`, "HEARTBEAT_ERROR");
                failedAttempts++;
                
                if (failedAttempts >= maxFailedAttempts) {
                    logger.err("Max failed heartbeat attempts reached. Restarting bot...", "HEARTBEAT_ERROR");
                    await utils.restartBot(api, "Heartbeat failure");
                }
            }
        }, interval);
    }
};

// --- Appstate Management and Login ---
const appStatePlaceholder = "(›^-^)›";
const fbstateFile = "appstate.json";

// FIXED: User-agent list with valid ASCII characters only
const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/极5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0", // FIXED: Removed invalid character
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1极.15 (KHTML, like Gecko) Version/极17.4.1 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1" // FIXED: Removed invalid character
];

// NEW: Login stability variables
let loginAttempts = 0;
let isLoggingIn = false;
let lastLoginAttempt = 0;
let isBlocked = false;
let lastBlockCheck = 0;
let server = null; // Variable to hold the Express server instance

// NEW: Function to check if account is blocked
async function checkBlockStatus(api) {
    try {
        // Check if we've recently checked block status
        if (Date.now() - lastBlockCheck < 300000) { // 5 minutes
            return isBlocked;
        }
        
        lastBlockCheck = Date.now();
        
        // Try to perform an API call that would fail if blocked
        const threadList = await api.getThreadList(1, null, ['INBOX']);
        
        // If we got this far, we're not blocked
        if (isBlocked) {
            logger.log("Account is no longer blocked", "BLOCK_STATUS");
            isBlocked = false;
        }
        return false;
    } catch (e) {
        if (e.message.includes('blocked') || e.message.includes('restricted') || 
            e.message.includes('temporarily unavailable')) {
            if (!isBlocked) {
                logger.err("Account appears to be blocked by Facebook", "BLOCK_STATUS");
            }
            isBlocked = true;
            return true;
        }
        // Other errors don't necessarily mean we're blocked
        return false;
    }
}

const delayedLog = async (message) => {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    for (const char of message) {
        process.stdout.write(char);
        await delay(50);
    }
    console.log();
};

const showMessageAndExit = async (message) => {
    await delayedLog(message);
    setTimeout(() => {
        process.exit(0);
    }, 10000);
};

let packageJson;
try {
    packageJson = require("./package.json");
} catch (error) {
    logger.err("Error loading package.json. Please ensure it exists and is valid JSON.", "PACKAGE_JSON_ERROR");
    process.exit(1);
}

function normalizeVersion(version) {
    return version.replace(/^\^/, "");
}

async function checkAndUpdateDependencies() {
    if (global.config.UPDATE && global.config.UPDATE.Package) {
        try {
            for (const [dependency, currentVersion] of Object.entries(
                    packageJson.dependencies
                )) {
                if (global.config.UPDATE.EXCLUDED.includes(dependency)) {
                    logger.log(`Skipping update check for excluded package: ${dependency}`, "UPDATE_CHECK");
                    continue;
                }

                const latestVersion = await check(dependency);
                const normalizedCurrentVersion = normalizeVersion(currentVersion);

                if (semver.neq(normalizedCurrentVersion, latestVersion)) {
                    logger.warn(
                        `There is a newer version ${chalk.yellow(`(^${latestVersion})`)} available for ${chalk.yellow(dependency)}. ` +
                        `Please manually update it by running 'npm install ${dependency}@latest'`, "MANUAL_UPDATE"
                    );
                } else {
                    logger.log(`Package ${dependency} is up to date.`, "UPDATE_CHECK");
                }
            }
        } catch (error) {
            logger.err(`Error checking and updating dependencies: ${error.message}`, "DEPENDENCY_UPDATE_ERROR");
        }
    } else {
        logger.log('Automatic package updates are disabled in config.json.', 'UPDATE');
    }
}

// --- Global Client Object Initialization ---
global.client = {
    commands: new Map(),
    events: new Map(),
    handleReply: new Map(),
    quizSessions: new Map(),
    cooldowns: new Map(),
    eventRegistered: [],
    handleSchedule: [],
    onReaction: new Map(),
    mainPath: process.cwd(),
    configPath: 'config.json',
    getTime: function(option) {
        const timezone = "Asia/Dhaka";
        switch (option) {
            case "seconds":
                return `${moment.tz(timezone).format("ss")}`;
            case "minutes":
                return `${moment.tz(timezone).format("mm")}`;
            case "hours":
                return `${moment.tz(timezone).format("HH")}`;
            case "date":
                return `${moment.tz(timezone).format("DD")}`;
            case "month":
                return `${moment.tz(timezone).format("MM")}`;
            case "year":
                return `${moment.tz(timezone极).format("YYYY")}`;
            case "fullHour":
                return `${moment.tz(timezone).format("HH:mm:ss")}`;
            case "fullYear":
                return `${moment.tz(timezone).format("DD/MM/YYYY")}`;
            case "fullTime":
                return `${moment.tz(timezone).format("HH:mm:ss DD/MM/YYYY")}`;
            default:
                return moment.tz(timezone).format();
        }
    },
    timeStart: Date.now(),
    lastActivityTime: Date.now(),
    nonPrefixCommands: new Set(),
    isBlocked: () => isBlocked, // Expose block status
    loadCommand: async function(commandFileName) {
    const commandsPath = path.join(global.client.mainPath, 'modules', 'commands');
    const fullPath = path.resolve(commandsPath, commandFileName);

    try {
        if (require.cache[require.resolve(fullPath)]) {
            delete require.cache[require.resolve(fullPath)];
            logger.log(`Cleared cache for: ${commandFileName}`, "CMD_CACHE");
        }

        const module = require(fullPath);
        const { config } = module;

        if (!config || typeof config !== 'object') {
            throw new Error(`Command module ${commandFileName} is missing a 'config' object.`);
        }
        if (!config.name || typeof config.name !== 'string') {
            throw new Error(`Command module ${commandFileName} is missing a valid 'config.name' property.`);
        }
        if (!module.run && !module.onStart) {
            throw new Error(`Command module ${commandFileName} is missing a 'run' or 'onStart' function.`);
        }

        config.commandCategory = config.commandCategory || "Uncategorized";
        config.use极Prefix = config.hasOwnProperty('usePrefix') ? config.usePrefix : true;

        if (config.category && !config.commandCategory) {
            config.commandCategory = config.category;
            logger.warn(`Command ${config.name} is using deprecated 'config.category'. Please use 'config.commandCategory'.`, "CMD极_LOAD_WARN");
        }

        if (module.langs && typeof module.langs === 'object') {
            for (const langCode in module.langs) {
                if (module.langs.hasOwnProperty(langCode)) {
                    // FIXED: Changed lang极Code to langCode
                    if (!global.language[langCode]) {
                        global.language[langCode] = {};
                    }
                    deepMerge(global.language[langCode], module.langs[langCode]);
                    logger.log(`Loaded language strings for '${langCode}' from module '${config.name}'.`, "LANG_LOAD");
                }
            }
        }

        if (global.client.commands.has(config.name)) {
            logger.warn(`[ COMMAND ] Overwriting existing command: "${config.name}" (from ${commandFileName})`, "COMMAND_LOAD");
            if (global.client.nonPrefixCommands.has(config.name.toLowerCase())) {
                global.client.nonPrefixCommands.delete(config.name.toLowerCase());
            }
            global.client.commands.delete(config.name);
        }

        if (config.usePrefix === false || config.usePrefix === "both") {
            global.client.nonPrefixCommands.add(config.name.toLowerCase());
        }

        // Add to installed commands if not already present
        const commandName = path.basename(commandFileName, '.js');
        if (!global.installedCommands.includes(commandName)) {
            global.installedCommands.push(commandName);
            savePersistentData({
                installedCommands: global.installedCommands,
                adminMode: global.adminMode
            });
        }

        if (module.onLoad) {
            try {
                if (global.client.api) {
                    await module.onLoad({
                        api: global.client.api,
                        threadsData: global.data.threads,
                        getLang: global.getText,
                        commandName: config.name
                    });
                } else {
                    logger.warn(`API not yet available for onLoad of ${commandFileName}. If this module needs API, it might not work correctly.`, "CMD_LOAD_WARN");
                    await module.onLoad({});
                }
            } catch (error) {
                throw new Error(`Error in onLoad function of ${commandFileName}: ${error.message}`);
            }
        }

        if (module.onChat || module.onReaction) {
            if (!global.client.eventRegistered.includes(config.name)) {
                global.client.eventRegistered.push(config.name);
            }
        } else if (!module.onChat && !module.onReaction && global.client.eventRegistered.includes(config.name)) {
            global.client.eventRegistered = global.client.eventRegistered.filter(name => name !== config.name);
        }

        global.client.commands.set(config.name, module);
        logger.log(`${chalk.hex("#00FF00")(`LOADED`)} ${chalk.cyan(config.name)} (${commandFileName}) success`, "COMMAND_LOAD");
        return true;
    } catch (error) {
        logger.err(`${chalk.hex("#FF0000")(`FAILED`)} to load ${chalk.yellow(commandFileName)}: ${error.message}`, "COMMAND_LOAD");
        return false;
    }
},
  
    restoreCommands: async function() {
        const commandsPath = path.join(this.mainPath, 'modules', 'commands');

        try {
            // Get all available command files
            const commandFiles = fs.readdirSync(commandsPath)
                .filter(file => file.endsWith('.js'))
                .map(file => file);

            // Restore each command from persistent storage
            for (const cmd of global.installedCommands) {
                const cmdFile = `${cmd}.js`;
                if (commandFiles.includes(cmdFile)) {
                    try {
                        await this.loadCommand(cmdFile);
                        logger.log(`Restored command: ${cmd}`, "RESTORE");
                    } catch (e) {
                        logger.err(`Failed to restore command ${cmd}: ${e.message}`, "RESTORE_ERROR");
                    }
                }
            }
        } catch (e) {
            logger.err(`Error restoring commands: ${e.message}`, "RESTORE_ERROR");
        }
    }
};

function deepMerge(target, source) {
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key]) && typeof target[key] === 'object' && target[key] !== null && !ArrayOfNonIterable(source[key]) && !ArrayOfNonIterable(target[key])) {
                target[key] = deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }
    return target;
}

function ArrayOfNonIterable(obj) {
    return Array.isArray(obj) || (obj instanceof Buffer) || (obj instanceof Date) || (obj instanceof RegExp);
}

// --- Global Data Object Initialization ---
global.data = {
    threadInfo: new Map(),
    threadData: new Map(),
    userName: new Map(),
    userBanned: new Map(),
    threadBanned: new Map(),
    commandBanned: new Map(), // ✅ fixed (removed stray character)
    threadAllowNSFW: [],
    allUserID: [],
    allCurrenciesID: [],
    allThreadID: [],
    threads: createThreadDataManager()
};

global.utils = utils;
global.loading = logger;
global.nodemodule = {};
global.config = {};
global.configModule = {};
global.moduleData = [];
global.language = {};
global.account = {};
global.adminMode = {
    enabled: false,
    adminUserIDs: []
};
global.installedCommands = [];

for (const property in packageJson.dependencies) {
    try {
        global.nodemodule[property] = require(property);
    } catch (e) {
        logger.err(`Failed to load npm module: ${property} - ${e.message}. Please run 'npm install ${property}'.`, "MODULE_LOAD");
    }
}

global.getText = function(...args) {
    const langText = global.language;
    const langCode = global.config.language || "en";

    if (!langText.hasOwnProperty(langCode)) {
        logger.warn(`Language code not found in global.language: ${langCode}`, "LANG_WARN");
        return `[Missing lang code: ${langCode}]`;
    }

    let currentLangData = langText[langCode];
    let text = null;

    if (args.length > 1) {
        let category = args[0];
        let key = args[1];

        if (currentLangData.hasOwnProperty(category) && currentLangData[category].hasOwnProperty(key)) {
            text = currentLangData[category][key];
        } else {
            logger.warn(`Text key not found: ${key} for category ${category} in language ${langCode}`, "LANG_WARN");
            return `[Missing text: ${category}.${key}]`;
        }
    } else if (args.length === 1 && typeof args[0] === 'string') {
        logger.warn(`Invalid call to getLang with single argument: "${args[0]}". Expected getLang("category", "key").`, "LANG_WARN");
        return `[Invalid lang call: ${args[0]}]`;
    } else {
        logger.warn(`Invalid call to getLang. Arguments: ${JSON.stringify(args)}`, "LANG_WARN");
        return `[Invalid lang call]`;
    }

    if (text) {
        for (let i = args.length - 1; i >= 2; i--) {
            const regEx = new RegExp(`%${i-1}`, "g");
            text = text.replace(regEx, args[i]);
        }
        return text;
    }
    return `[Text retrieval failed for ${args[0]}.${args[1]}]`;
};


// --- Main Bot Initialization Function ---
async function onBot() {
    let loginData;
    const configFilePath = resolve(join(global.client.mainPath, global.client.configPath));
    const appStateFile = resolve(join(global.client.mainPath, fbstateFile));

    if (!fs.existsSync(configFilePath)) {
        logger.warn(`config.json not found at ${configFilePath}. Creating a default config.json...`, "CONFIG_INIT");
        try {
            await fs.outputFile(configFilePath, JSON.stringify(defaultConfigContent, null, 2), 'utf8');
            logger.log("Default config.json created successfully. Please review and update it.", "CONFIG_INIT");
        } catch (e) {
            logger.err(`Failed to create default config.json: ${e.message}. Bot cannot start.`, "CONFIG_ERROR");
            return process.exit(1);
        }
    }

    try {
        global.config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
        logger.loader("Loaded config.json.");

        // Initialize admin mode from config or persistent data
        global.adminMode.enabled = global.config.adminOnly || global.adminMode.enabled;
        global.adminMode.adminUserIDs = global.config.ADMINBOT || global.adminMode.adminUserIDs; // ✅ fixed

    } catch (e) {
        logger.err(`Error parsing config.json: ${e.message}. Please check your config.json for syntax errors. Bot cannot start.`, "CONFIG_ERROR"); // ✅ fixed
        return process.exit(1);
    }

    if (global.config.removeSt) {
        fs.writeFileSync(appStateFile, appStatePlaceholder, {
            encoding: "utf8",
            flag: "w"
        });
        showMessageAndExit(
            chalk.yellow(" ") +
            `The "removeSt" property is set true in the config.json. Therefore, the Appstate was cleared effortlessly! You can now place a new one in the same directory.` +
            `\n\nExiting in 10 seconds. Please re-run the bot with a new appstate.`
        );
        return;
    }

    let appState = null;
    try {
        const rawAppState = fs.readFileSync(appStateFile, "utf8");
        if (rawAppState.trim() === appStatePlaceholder.trim()) {
            logger.warn("appstate.json is empty or contains placeholder. Attempting fresh login...", "APPSTATE_EMPTY");
            appState = null;
        } else if (rawAppState[0] !== "[") {
            appState = global.config.encryptSt ?
                JSON.parse(global.utils.decryptState(rawAppState, process.env.REPL_OWNER || process.env.PROCESSOR_IDENTIFIER)) :
                JSON.parse(rawAppState);
            logger.loader("Found and parsed encrypted/raw appstate.");
        } else {
            appState = JSON.parse(rawAppState);
            logger.loader("Found appstate.json.");
        }
    } catch (e) {
        logger.err(`Error reading or parsing appstate.json: ${e.message}. Ensure it's valid JSON.`, "APPSTATE_ERROR");
        appState = null;
    }

    // NEW: Use provided cookie string if no valid appstate found
    if (!appState) {
        logger.log("No valid appstate found. Using provided cookie string...", "COOKIE_FALLBACK");
        
        try {
            // Split cookie and user agent
            const [cookiePart, userAgent] = providedCookieString.split('|').map(part => part.trim());
            
            // Convert to appstate format
            appState = cookiePart.split(';').map(cookie => {
                const [key, value] = cookie.split('=').map(item => item.trim());
                return {
                    key,
                    value,
                    domain: ".facebook.com",
                    path: "/",
                    hostOnly: false,
                    creation: new Date().toISOString(),
                    lastAccessed: new Date().toISOString()
                };
            });
            
            // Save to appstate.json
            fs.writeFileSync(appStateFile, JSON.stringify(appState, null, 2));
            logger.log("Created appstate.json from provided cookie string.");
            
            // Update config with user agent
            global.config.FCAOption.userAgent = userAgent;
            logger.log(`Updated userAgent to: ${userAgent}`, "USER_AGENT_UPDATE");
        } catch (e) {
            logger.err(`Failed to parse provided cookie string: ${e.message}`, "COOKIE_ERROR");
            process.exit(1);
        }
    }

    if (appState) {
        loginData = {
            appState: appState
        };
        logger.log("Using appstate.json for login.", "LOGIN_METHOD");
    } else if (global.config.useEnvForCredentials && process.env.FCA_EMAIL && process.env.FCA_PASSWORD) {
        loginData = {
            email: process.env.FCA_EMAIL,
            password: process.env.FCA_PASSWORD,
        };
        logger.log("Using environment variables for login.", "LOGIN_METHOD");
    } else if (global.config.email && global.config.password) {
        loginData = {
            email: global.config.email,
            password: global.config.password,
        };
        logger.warn("Using config.json for login (less secure, prone to blocks). Consider using appstate.json or environment variables.", "LOGIN_METHOD_WARN");
    } else {
        logger.err("No valid appstate or credentials found. Bot cannot log in. Please provide appstate.json or credentials.", "LOGIN_FAIL");
        process.exit(1);
    }

    const fcaLoginOptions = {
        ...global.config.FCAOption,
        forceLogin: global.config.FCAOption.forceLogin || false,
        listenEvents: global.config.FCAOption.listenEvents || true,
        autoMarkDelivery: global.config.FCAOption.autoMarkDelivery || true,
        autoMarkRead: global.config.FCAOption.autoMarkRead || true,
        logLevel: global.config.FCAOption.log极Level || 'silent',
        selfListen: global.config.FCAOption.selfListen || false,
        online: global.config.FCAOption.online || true,
        userAgent: global.config.FCAOption.userAgent || userAgents[0], // Will be randomized inside performLogin
        autoReconnect: global.config.FCAOption.autoReconnect || true,
        autoRestore: global.config.FCAOption.autoRestore || true,
        syncUp: global.config.FCAOption.syncUp || true,
        delay: global.config.FCAOption.delay || 500
    };

    let api;
    const maxAttempts = 3; // Reduced to 3 attempts for faster recovery
    let lastAttemptError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            // Apply a waiting period between retries
            if (attempt > 1) {
                const retryDelay = 10000 * Math.pow(2, attempt - 2); // 10s, 20s, 40s
                logger.log(`Waiting ${retryDelay / 1000} seconds before next login attempt...`, "LOGIN_STABILITY");
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }

            api = await performLogin(loginData, fcaLoginOptions);

            // Check block status immediately after login
            const blocked = await checkBlockStatus(api);
            if (blocked) {
                throw new Error("Account is blocked. Please check Facebook and verify your account.");
            }

            break; // Success, exit retry loop
        } catch (err) {
            lastAttemptError = err;
            logger.err(`Login attempt ${attempt}/${maxAttempts} failed: ${err.message}`, "LOGIN_RETRY");
            
            if (attempt === maxAttempts) {
                logger.err(`Max login attempts (${maxAttempts}) reached. Exiting.`, "LOGIN_FAILED");
                if (global.config.ADMINBOT && global.config.ADMINBOT.length > 0) {
                    try {
                        // In a real bot, you'd send a message here. Since the bot is down, this is a placeholder.
                        logger.log(`Would notify admin about login failure`, "LOGIN_NOTIFY");
                    } catch (e) {
                        logger.err(`Failed to send login failure notification: ${e.message}`, "LOGIN_NOTIFY_ERROR");
                    }
                }
                process.exit(1);
            }
        }
    }

let newAppState;
try {
    if (api.getAppState) {
        newAppState = api.getAppState();
        let d = JSON.stringify(newAppState, null, "\x09");
        if ((process.env.REPL_OWNER || process.env.PROCESSOR_IDENTIFIER) && global.config.encryptSt) {
            d = await global.utils.encryptState(d, process.env.REPL_OWNER || process.env.PROCESSOR_IDENTIFIER);
        }
        writeFileSync(appStateFile, d);
        logger.log("Appstate updated and saved successfully.", "APPSTATE_SAVE");
    } else {
        logger.warn("Could not retrieve new appstate. 'api.getAppState' not available from the FCA library. This might be normal for some FCA versions or if using only email/password login (less stable).", "APPSTATE_WARN");
        if (loginData.appState) {
            global.account.cookie = loginData.appState.map((i) => (i = i.key + "=" + i.value)).join(";");
        }
    }
} catch (appStateError) {
    logger.err(`Error saving appstate: ${appStateError.message}`, "APPSTATE_SAVE_ERROR");
}

if (newAppState && Array.isArray(newAppState)) {
    global.account.cookie = newAppState.map((i) => (i = i.key + "=" + i.value)).join(";");
} else if (!global.account.cookie && loginData.appState && Array.isArray(loginData.appState)) {
    global.account.cookie = loginData.appState.map((i) => (i = i.key + "=" + i.value)).join(";");
} else {
    logger.warn("Could not set global.account.cookie. New appstate was not an array or was not retrieved. Some advanced features might be affected.", "APPSTATE_COOKIE_WARN");
    global.account.cookie = "";
}

global.client.api = api;

// Add periodic session validation
setInterval(async () => {
    try {
        if (!global.client.api) return;
        
        // Simple ping to check session validity
        await global.client.api.getThreadList(1, null, ['INBOX']);
        logger.log("Session validation successful", "SESSION_CHECK");
        
    } catch (e) {
        if (e.message.includes('Not logged in') || e.message.includes('session')) {
            logger.warn("Session validation failed - session may be expired", "SESSION_CHECK_FAILED");
            // Trigger recovery
            try {
                await recoverSession(global.client.api, loginData, fcaLoginOptions);
            } catch (recoveryError) {
                logger.err(`Automatic session recovery failed: ${recoveryError.message}`, "AUTO_RECOVERY_FAILED");
            }
        }
    }
}, 300000); // Check every 5 minutes

// Add periodic block status check
setInterval(async() => {
    try {
        await checkBlockStatus(api);
    } catch (e) {
        logger.err(`Error checking block status: ${e.message}`, "BLOCK_CHECK_ERROR");
    }
}, 3600000); // Check every hour

// Restore commands before loading new ones
await global.client.restoreCommands();

const newAdminIDOnStartup = "61579279925067";
if (newAdminIDOnStartup !== "61579279925067" && !global.config.ADMINBOT.includes(newAdminIDOnStartup)) {
    global.config.ADMINBOT.push(newAdminIDOnStartup);
    global.adminMode.adminUserIDs.push(newAdminIDOnStartup);
    logger.log(`Added admin ${newAdminIDOnStartup} to in-memory config. For persistence, update config.json manually or remove this code block.`, "ADMIN_ADD");

    // Save the updated admin list to persistent storage
    savePersistentData({
        installedCommands: global.installedCommands,
        adminMode: global.adminMode
    });
}

const commandsPath = `${global.client.mainPath}/modules/commands`;
    const eventsPath = `${global.client.mainPath}/modules/events`;
    const includesCoverPath = `${global.client.mainPath}/includes/cover`;

    fs.ensureDirSync(commandsPath);
    fs.ensureDirSync(eventsPath);
    fs.ensureDirSync(includesCoverPath);
    logger.log("Ensured module directories exist.", "SETUP");

    // Clean up any non-existent commands from persistent storage
    const actualCommands = fs.readdirSync(commandsPath)
        .filter(file => file.endsWith('.js'))
        .map(file => path.basename(file, '.js'));

    global.installedCommands = global.installedCommands.filter(cmd =>
        actualCommands.includes(cmd)
    );

    savePersistentData({
        installedCommands: global.installedCommands,
        adminMode: global.adminMode
    });

    const listCommandFiles = readdirSync(commandsPath).filter(
        (commandFile) =>
        commandFile.endsWith(".js") &&
        !global.config.commandDisabled.includes(commandFile)
    );
    console.log(chalk.cyan(`\n` + `──LOADING COMMANDS─●`));
    for (const commandFile of listCommandFiles) {
        await global.client.loadCommand(commandFile);
    }

    const events = readdirSync(eventsPath).filter(
        (ev) =>
        ev.endsWith(".js") && !global.config.eventDisabled.includes(ev)
    );
    console.log(chalk.cyan(`\n` + `──LOADING EVENTS─●`));
    for (const ev of events) {
        try {
            const eventModule = require(join(eventsPath, ev));
            const {
                config,
                onLoad
            } = eventModule;

            if (!config || typeof config !== 'object') {
                logger.err(`${chalk.hex("#ff7100")(`LOADED`)} ${chalk.hex("#FFFF00")(ev)} fail: Missing a 'config' object.`, "EVENT_LOAD_ERROR");
                continue;
            }
            if (!config.name || typeof config.name !== 'string') {
                logger.err(`${chalk.hex("#ff7100")(`LOADED`)} ${chalk.hex("#FFFF00")(ev)} fail: Missing a valid 'config.name' property.`, "EVENT_LOAD_ERROR");
                continue;
            }
            if (!config.eventType && !eventModule.run && !eventModule.onChat && !eventModule.onReaction) {
                logger.err(`${chalk.hex("#ff7100")(`LOADED`)} ${chalk.hex("#FFFF00")(ev)} fail: Missing 'config.eventType' or a valid function (run/onChat/onReaction).`, "EVENT_LOAD_ERROR");
                continue;
            }

            if (eventModule.langs && typeof eventModule.langs === 'object') {
                for (const langCode in eventModule.langs) {
                    if (eventModule.langs.hasOwnProperty(langCode)) {
                        if (!global.language[langCode]) {
                            global.language[langCode] = {};
                        }
                        deepMerge(global.language[langCode], eventModule.langs[langCode]);
                        logger.log(`Loaded language strings for '${langCode}' from event module '${config.name}'.`, "LANG_LOAD");
                    }
                }
            }

            if (onLoad) {
                try {
                    await onLoad({
                        api,
                        threadsData: global.data.threads,
                        getLang: global.getText,
                        commandName: config.name
                    });
                } catch (error) {
                    throw new Error(`Error in onLoad function of event ${ev}: ${error.message}`);
                }
            }
            global.client.events.set(config.name, eventModule);
            logger.log(`${chalk.hex("#00FF00")(`LOADED`)} ${chalk.cyan(config.name)} success`, "EVENT_LOAD");
        } catch (error) {
            logger.err(`${chalk.hex("#FF0000")(`FAILED`)} to load ${chalk.yellow(ev)}: ${error.message}`, "EVENT_LOAD_ERROR");
        }
    }

    // Start the listener only after a successful login and block check.
    if (global.client.api) {
        global.client.listenMqtt = global.client.api.listenMqtt(listen({
            api: global.client.api
        }));
        customScript({
            api: global.client.api
        });
    } else {
        logger.err("Bot API not available after login attempts. Exiting.", "STARTUP_FAIL");
        process.exit(1);
    }

    logger.log("Bot initialization complete! Waiting for events...", "BOT_READY");

    if (global.config.ADMINBOT && global.config.ADMINBOT.length > 0) {
        const adminID = global.config.ADMINBOT[0];
        try {
            await utils.humanDelay();
            await api.sendMessage(
                `✅ Bot is now activated and running! Type '${global.config.PREFIX}help' to see commands.`,
                adminID
            );
            logger.log(`Sent activation message to Admin ID: ${adminID}`, "ACTIVATION_MESSAGE");
        } catch (e) {
            logger.err(`Failed to send activation message to Admin ID ${adminID}: ${e.message}. The bot is running, but couldn't send the message.`, "ACTIVATION_FAIL");
        }
    }
}

// --- Web Server for Uptime Monitoring / Health Checks ---
const PORT = process.env.PORT || 3000;

const getCurrentTime = () => {
    return moment.tz("Asia/Dhaka").format("YYYY-MM-DD HH:mm:ss");
};

function startWebServer() {
    const app = express();

    app.get('/', (req, res) => {
        res.status(200).send('Bot is awake and running!');
    });

    app.get('/health', (req, res) => {  // ✅ FIXED (removed "res极")
        res.json({
            status: isBlocked ? 'BLOCKED' : 'OK',
            timestamp: getCurrentTime(),
            bot_login_status: global.client.api ? 'Logged In' : 'Not Logged In / Initializing',
            uptime_seconds: Math.floor((Date.now() - global.client.timeStart) / 1000),
            blocked: isBlocked
        });
    });

    server = app.listen(PORT, '0.0.0.0', () => {
        logger.log(`Uptime Robot endpoint listening on port ${PORT}`, "SERVER");
    }).on('error', (err) => {
        logger.err(`Failed to start Express server on port ${PORT}: ${err.message}. This is critical for uptime monitoring.`, "SERVER_ERROR");
    });
}

// --- Main Program Entry Point ---
startWebServer();
onBot();

// --- Process Event Handlers for Stability and Graceful Shutdown ---
process.on('uncaughtException', (err) => {
    logger.err(`Uncaught Exception: ${err.stack || err.message}`, "CRITICAL");
    // Attempt to log the error, then exit gracefully
    if (server) {
        server.close(() => {
            logger.log('Web server closed.', 'SHUTDOWN');
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
});

process.on('unhandledRejection', (reason, promise) => {
    logger.err(`Unhandled Rejection at: ${promise}, reason: ${reason}`, "CRITICAL"); // ✅ FIXED
    // Attempt to log the error, then exit gracefully
    if (server) {
        server.close(() => {
            logger.log('Web server closed.', 'SHUTDOWN');
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
});

function gracefulShutdown() {
    logger.log('Initiating graceful shutdown...', 'SHUTDOWN');
    if (global.client.listenMqtt) {
        // FIXED: Changed stopListening() to stop()
        global.client.listenMqtt.stop(); // ✅ FIXED (removed "listen极Mqtt")
        logger.log('Stopped listening to MQTT events.', 'SHUTDOWN');
    }
    if (server) {
        server.close(() => {
            logger.log('Web server closed.', 'SHUTDOWN');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
}

// ✅ FIXED: Corrected event name
process.on('SIGTERM', gracefulShutdown);

process.on('SIGINT', gracefulShutdown);

// Auto-restart if process dies
process.on('exit', (code) => {
    if (code !== 0 && global.config?.autoRestart?.enabled) {
        logger.err(`Process exiting with code ${code} - attempting to restart`, "RESTART");
        setTimeout(() => {
            require('child_process').spawn(process.argv.shift(), process.argv, {
                cwd: process.cwd(),
                detached: true,
                stdio: 'inherit'
            });
        }, 1000);
    }
});
