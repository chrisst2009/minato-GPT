const fs = require("fs-extra");
const { utils } = global;
const Canvas = require("canvas");
const path = require("path");

const BOT_UID = global.botID;
async function createPrefixImage(type, data, usersData) {
  try {
    const width = 1000;
    const height = 600;
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    let botAvatar;
    let botName = "MINATO NAMIKAZE";
    
    try {
      const avatarUrl = await usersData.getAvatarUrl(BOT_UID);
      botAvatar = await Canvas.loadImage(avatarUrl);
      
      const botInfo = await usersData.get(BOT_UID);
      if (botInfo && botInfo.name) {
        botName = botInfo.name;
      }
    } catch (error) {
      return null;
    }

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0a0a0a');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const avatarSize = 120;
    const avatarX = 50;
    const avatarY = 50;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.strokeStyle = '#4cc9f0';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.drawImage(botAvatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();

    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText(botName, avatarX + avatarSize + 20, avatarY + 40);
    ctx.fillText(`UID: ${BOT_UID}`, avatarX + avatarSize + 20, avatarY + 70);

    let title, color, icon, status;
    switch(type) {
      case 'info':
        title = '🥷 𝚂𝚈𝚂𝚃È𝙼𝙴 𝙿𝚁𝙴𝙵𝙸𝚇 🌀';
        color = '#4cc9f0';
        icon = '⚙️';
        status = '𝙲𝙾𝙽𝙵𝙸𝙶𝚄𝚁𝙰𝚃𝙸𝙾𝙽';
        break;
      case 'changed':
        title = data.isGlobal ? '🥷 𝙼𝚒𝚗𝚊𝚝𝚘 𝚙𝚛𝚎𝚏𝚒𝚡 𝚐𝚕𝚘𝚋𝚊𝚕 🌍' : '🥷 𝙼𝚒𝚗𝚊𝚝𝚘 𝚙𝚛𝚎𝚏𝚒𝚡 𝚖𝚘𝚍𝚒𝚏𝚒𝚎𝚛 ✅';
        color = data.isGlobal ? '#FFD700' : '#4cc9f0';
        icon = data.isGlobal ? '👑' : '💬';
        status = data.isGlobal ? '𝙼𝚒𝚗𝚊𝚝𝚘 𝚐𝚕𝚘𝚋𝚊𝚕 𝚌𝚑𝚊𝚗𝚐é' : '𝙼𝚒𝚗𝚊𝚝𝚘 𝚋𝚘𝚡 𝚌𝚑𝚊𝚗𝚐é';
        break;
      case 'confirmation':
        title = data.isGlobal ? '⚠️ 𝙲𝚘𝚗𝚏𝚒𝚛𝚖𝚊𝚝𝚒𝚘𝚗 𝚐𝚕𝚘𝚋𝚊𝚕𝚎 𝚌𝚑𝚎𝚣 𝚖𝚒𝚗𝚊𝚝𝚘 ⚠️' : '⚠️ 𝙲𝚘𝚗𝚏𝚒𝚛𝚖𝚊𝚝𝚒𝚘𝚗 ⚠️';
        color = '#e94560';
        icon = '❓';
        status = 'EN ATTENTE';
        break;
      case 'reset':
        title = '🔄 𝙼𝚒𝚗𝚊𝚝𝚘 𝚙𝚛𝚎𝚏𝚒𝚡 𝚛é𝚒𝚗𝚒𝚝𝚒𝚊𝚕𝚒𝚜𝚎𝚛 🔄';
        color = '#888888';
        icon = '↩️';
        status = '𝚛é𝚒𝚗𝚒𝚝𝚒𝚊𝚕𝚒𝚜𝚎𝚛';
        break;
    }

    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, avatarY + avatarSize + 60);

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 150, avatarY + avatarSize + 70);
    ctx.lineTo(width / 2 + 150, avatarY + avatarSize + 70);
    ctx.stroke();

    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';

    let y = avatarY + avatarSize + 120;
    
    if (data.newPrefix) {
      ctx.fillText(`🎯 𝙽𝚘𝚞𝚟𝚎𝚊𝚞 𝙿𝚛𝚎𝚏𝚒𝚡 𝚍𝚎 𝚖𝚒𝚗𝚊𝚝𝚘: ${data.newPrefix}`, 100, y);
      y += 40;
    }

    if (data.oldPrefix) {
      ctx.fillText(`📊 𝙰𝚗𝚌𝚒𝚎𝚗 𝙿𝚛𝚎𝚏𝚒𝚡 𝚍𝚎 𝚖𝚒𝚗𝚊𝚝𝚘: ${data.oldPrefix}`, 100, y);
      y += 40;
    }

    if (data.globalPrefix) {
      ctx.fillText(`👑 𝙿𝚛𝚎𝚏𝚒𝚡 𝙶𝚕𝚘𝚋𝚊𝚕 𝚍𝚎 𝚖𝚒𝚗𝚊𝚝𝚘: ${data.globalPrefix}`, 100, y);
      y += 40;
    }

    if (data.boxPrefix !== undefined) {
      const boxText = data.boxPrefix || 'Défaut';
      ctx.fillText(`💬 𝙿𝚛𝚎𝚏𝚒𝚡 𝙱𝚘𝚡 𝚍𝚎 𝚖𝚒𝚗𝚊𝚝𝚘: ${boxText}`, 100, y);
      y += 40;
    }

    if (data.type) {
      ctx.fillText(`📝 Type: ${data.type}`, 100, y);
      y += 40;
    }

    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = color;
    ctx.fillText(`${icon} ${status}`, 100, y);

    ctx.font = 'italic 20px Arial';
    ctx.fillStyle = '#888888';
    ctx.textAlign = 'center';
    ctx.fillText('𝚂𝚢𝚜𝚝è𝚖𝚎 𝚖𝚒𝚗𝚊𝚝𝚘 • 𝙶𝚎𝚜𝚝𝚒𝚘𝚗 𝙿𝚛𝚎𝚏𝚒𝚡 𝚟𝟸.𝟶', width / 2, height - 30);

    return canvas.toBuffer();
  } catch (error) {
    return null;
  }
}

async function sendImage(api, event, imageBuffer) {
  try {
    if (!imageBuffer) return;
    
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 12);
    const fileName = `prefix_${timestamp}_${random}.png`;
    const filePath = path.join(__dirname, fileName);
    
    fs.writeFileSync(filePath, imageBuffer);
    
    await new Promise((resolve, reject) => {
      api.sendMessage({
        body: "",
        attachment: fs.createReadStream(filePath)
      }, event.threadID, (err, info) => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (e) {}
        
        if (err) return reject(err);
        resolve(info);
      });
    });
    
  } catch (error) {}
}

module.exports = {
  config: {
    name: "prefix",
    version: "2.0",
    author: "Ntkhang ( patched by L'Uchiha Perdu & Soma Sonic",
    countDown: 5,
    role: 0,
    description: "Gère les prefixes du bot",
    category: "config",
    guide: {
      en: `╭─⌾🥷𝙽𝙰𝙼𝙸𝙺𝙰𝚉𝙴🥷
│🌀|𝚂𝚢𝚜𝚝è𝚖𝚎 𝚙𝚛𝚎𝚏𝚒𝚡: !
│🪵|𝙱𝚘𝚡 𝚌𝚑𝚊𝚝 𝚙𝚛𝚎𝚏𝚒𝚡: #
│
│📌 𝚄𝚝𝚒𝚕𝚒𝚜𝚊𝚝𝚒𝚘𝚗:
│• prefix <nouveau> → Change box
│• prefix <nouveau> -g → Change global
│• prefix reset → Réinitialise box
╰──────────⌾`
    }
  },

  langs: {
    en: {
      reset: `≪━─━─━─◈─━─━─━≫
🥷 𝙿𝚛𝚎𝚏𝚒𝚡 𝚛𝚎𝚜𝚎𝚝 ✅

𝙿𝚛𝚎𝚏𝚒𝚡 𝚋𝚘𝚡 𝚛é𝚒𝚗𝚒𝚝𝚒𝚊𝚕𝚒𝚜é à: %1

𝚄𝚝𝚒𝚕𝚒𝚜𝚎 𝚖𝚊𝚒𝚗𝚝𝚎𝚗𝚊𝚗𝚝 𝚌𝚑𝚎𝚣 𝚖𝚒𝚗𝚊𝚝𝚘: "%1help"
≪━─━─━─◈─━─━─━≫`,
      onlyAdmin: `≪━─━─━─◈─━─━─━≫
🚫 𝙿𝙴𝚁𝙼𝙸𝚂𝚂𝙸𝙾𝙽 𝚁𝙴𝙵𝚄𝚂É

𝚂𝚎𝚞𝚕𝚜 𝚕𝚎𝚜 𝚊𝚍𝚖𝚒𝚗𝚜 𝚍𝚎 𝚖𝚒𝚗𝚊𝚝𝚘 𝚙𝚎𝚞𝚟𝚎𝚗𝚝 𝚌𝚑𝚊𝚗𝚐𝚎𝚛 𝚕𝚎 𝚙𝚛𝚎𝚏𝚒𝚡 𝚐𝚕𝚘𝚋𝚊𝚕.
≪━─━─━─◈─━─━─━≫`,
      confirmGlobal: `≪━─━─━─◈─━─━─━≫
⚠️ 𝙲𝙾𝙽𝙵𝙸𝚁𝙼𝙰𝚃𝙸𝙾𝙽 𝙶𝙻𝙾𝙱𝙰𝙻𝙴

𝙲𝚑𝚊𝚗𝚐𝚎𝚛 𝚕𝚎 𝚙𝚛é𝚏𝚒𝚡𝚎 𝙶𝙻𝙾𝙱𝙰𝙻 𝚎𝚗 "%1" ?

⚠️ 𝙰𝚏𝚏𝚎𝚌𝚝𝚎 𝚃𝙾𝚄𝚃 𝚍𝚎 𝚖𝚒𝚗𝚊𝚝𝚘
✅ 𝚁é𝚊𝚐𝚒𝚜 𝚙𝚘𝚞𝚛 𝚌𝚘𝚗𝚏𝚒𝚛𝚖𝚎𝚛
⏱️ 𝟹𝟶 𝚜𝚎𝚌𝚘𝚗𝚍𝚎𝚜
≪━─━─━─◈─━─━─━≫`,
      confirmThisThread: `≪━─━─━─◈─━─━─━≫
⚠️ 𝐂𝐎𝐍𝐅𝐈𝐑𝐌𝐀𝐓𝐈𝐎𝐍

Changer le prefix BOX en "%1" ?

✅ 𝚁é𝚊𝚐𝚒𝚜 𝚙𝚘𝚞𝚛 𝚌𝚘𝚗𝚏𝚒𝚛𝚖𝚎𝚛
⏱️ 𝟹𝟶 𝚜𝚎𝚌𝚘𝚗𝚍𝚎𝚜
≪━─━─━─◈─━─━─━≫`,
      successGlobal: `≪━─━─━─◈─━─━─━≫
🌍 𝙿𝚁𝙴𝙵𝙸𝚇 𝙶𝙻𝙾𝙱𝙰𝙻 𝙼𝙾𝙳𝙸𝙵𝙸𝙴𝚁

𝙽𝚘𝚞𝚟𝚎𝚊𝚞 𝚙𝚛𝚎𝚏𝚒𝚡 𝚐𝚕𝚘𝚋𝚊𝚕: %1

𝙰𝚏𝚏𝚎𝚌𝚝𝚎 𝚝𝚘𝚞𝚝𝚎𝚜 𝚕𝚎𝚜 𝚌𝚘𝚗𝚟𝚎𝚛𝚜𝚊𝚝𝚒𝚘𝚗𝚜.
≪━─━─━─◈─━─━─━≫`,
      successThisThread: `≪━─━─━─◈─━─━─━≫
✅ 𝙿𝚁𝙴𝙵𝙸𝚇 𝙱𝙾𝚇 𝙼𝙾𝙳𝙸𝙵𝙸𝙴𝚁

𝙽𝚘𝚞𝚟𝚎𝚊𝚞 𝚙𝚛𝚎𝚏𝚒𝚡 𝚋𝚘𝚡: %1

𝚄𝚝𝚒𝚕𝚒𝚜𝚎 𝚖𝚊𝚒𝚗𝚝𝚎𝚗𝚊𝚗𝚝: "%1help"
≪━─━─━─◈─━─━─━≫`,
      myPrefix: `╭─⌾🌿𝙽𝙰𝙼𝙸𝙺𝙰𝚉𝙴🌿
│🌀|𝚂𝚢𝚜𝚝è𝚖𝚎 𝚙𝚛𝚎𝚏𝚒𝚡: %1
│🥷|𝙱𝚘𝚡 𝚌𝚑𝚊𝚝 𝚙𝚛𝚎𝚏𝚒𝚡: %2
╰──────────⌾`
    }
  },

  onStart: async function ({ message, role, args, commandName, event, threadsData, getLang, api, usersData }) {
    if (!args[0]) {
      const globalPrefix = global.GoatBot.config.prefix;
      const boxPrefix = await threadsData.get(event.threadID, "data.prefix");
      
      const infoImage = await createPrefixImage('info', {
        globalPrefix: globalPrefix,
        boxPrefix: boxPrefix
      }, usersData);
      
      await message.reply(getLang("myPrefix", globalPrefix, boxPrefix || globalPrefix));
      
      if (infoImage) {
        await sendImage(api, event, infoImage);
      }
      return;
    }

    if (args[0] == 'reset') {
      const oldPrefix = await threadsData.get(event.threadID, "data.prefix") || global.GoatBot.config.prefix;
      await threadsData.set(event.threadID, null, "data.prefix");
      
      const resetImage = await createPrefixImage('reset', {
        newPrefix: global.GoatBot.config.prefix,
        oldPrefix: oldPrefix,
        type: 'Box Réinitialisé'
      }, usersData);
      
      await message.reply(getLang("reset", global.GoatBot.config.prefix));
      
      if (resetImage) {
        await sendImage(api, event, resetImage);
      }
      return;
    }

    let newPrefix;
    let setGlobal = false;

    if (args[0] === "-g" && args[1]) {
      setGlobal = true;
      newPrefix = args[1];
    } else if (args[1] === "-g") {
      setGlobal = true;
      newPrefix = args[0];
    } else {
      newPrefix = args[0];
    }

    if (setGlobal && role < 2) {
      return message.reply(getLang("onlyAdmin"));
    }

    const formSet = {
      commandName,
      author: event.senderID,
      newPrefix,
      setGlobal,
      threadID: event.threadID
    };

    const confirmMessage = setGlobal ? 
      getLang("confirmGlobal", newPrefix) : 
      getLang("confirmThisThread", newPrefix);

    const confirmImage = await createPrefixImage('confirmation', {
      newPrefix: newPrefix,
      isGlobal: setGlobal,
      type: setGlobal ? 'Changement Global' : 'Changement Box'
    }, usersData);

    await message.reply(confirmMessage, async (err, info) => {
      formSet.messageID = info.messageID;
      global.GoatBot.onReaction.set(info.messageID, formSet);
      
      if (confirmImage) {
        await sendImage(api, event, confirmImage);
      }
    });
  },

  onReaction: async function ({ message, threadsData, event, Reaction, getLang, api, usersData }) {
    const { author, newPrefix, setGlobal, threadID } = Reaction;
    if (event.userID !== author) return;
    
    const oldPrefix = setGlobal ? 
      global.GoatBot.config.prefix : 
      (await threadsData.get(threadID, "data.prefix")) || global.GoatBot.config.prefix;

    if (setGlobal) {
      global.GoatBot.config.prefix = newPrefix;
      fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
      
      const successImage = await createPrefixImage('changed', {
        newPrefix: newPrefix,
        oldPrefix: oldPrefix,
        isGlobal: true,
        type: 'Changement Global'
      }, usersData);
      
      await message.reply(getLang("successGlobal", newPrefix));
      
      if (successImage) {
        await sendImage(api, event, successImage);
      }
    } else {
      await threadsData.set(threadID, newPrefix, "data.prefix");
      
      const successImage = await createPrefixImage('changed', {
        newPrefix: newPrefix,
        oldPrefix: oldPrefix,
        isGlobal: false,
        type: 'Changement Box'
      }, usersData);
      
      await message.reply(getLang("successThisThread", newPrefix));
      
      if (successImage) {
        await sendImage(api, event, successImage);
      }
    }
  },

  onChat: async function ({ event, message, getLang, api, usersData }) {
    if (event.body && event.body.toLowerCase() === "prefix") {
      const globalPrefix = global.GoatBot.config.prefix;
      const boxPrefix = utils.getPrefix(event.threadID);
      
      const infoImage = await createPrefixImage('info', {
        globalPrefix: globalPrefix,
        boxPrefix: boxPrefix
      }, usersData);
      
      await message.reply(getLang("myPrefix", globalPrefix, boxPrefix));
      
      if (infoImage) {
        await sendImage(api, event, infoImage);
      }
    }
  }
};
