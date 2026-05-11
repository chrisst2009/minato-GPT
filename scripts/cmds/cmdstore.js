const axios = require("axios");
const Canvas = require("canvas");
const fs = require("fs-extra");
const path = require("path");

const serverURL = "https://cmd-store-three.vercel.app";
const API_KEY = "uchiha-perdu-cmdstore";
const ADMIN_UID = ["61578433048588", "100083846212138"];

const LANG = {
  en: {
    store_name: "🛒 〖 CommandStore 〗 🛒",
    no_commands: "⚠️ No commands available at the moment.\nCome back later! 🕒",
    invalid_page: "⚠️ Please specify a valid page number.\nAvailable pages: 1 to %1\n➤ Usage: store page <number>",
    command_list: "📜 List of commands (Page %1/%2):",
    reply_to_buy: "📦 Reply with the number to buy (add code optional).\nEx: \"1\" or \"1 SAVE20\"",
    specify_category: "⚠️ Please specify a category!\n➤ Usage: store search category <category>",
    no_category: "⚠️ No commands found in the specified category!\nTry another category or check the spelling. 🔍",
    commands_in_category: "📜 Commands in category \"%1\":",
    specify_search: "⚠️ Please specify the name of the command to search for!\n➤ Usage: store search <command name>",
    command_not_found: "⚠️ Command not found!\nThis command might be too common and has no value here.\nThis store is for elite commands only! 💎",
    invalid_price: "⚠️ The command \"%1\" has an invalid price!\nContact an administrator to fix this.",
    command_found: "✅ Command \"%1\" found!\n🏆 Rank: %2\n💰 Price: %3 $\n\nReply \"yes\" to buy (or \"yes CODE\").",
    add_command: "🛠️ 〖 StoreAdmin 〗 🛠️\n📝 Adding a new command.\nStep 1/6: Enter the command name (e.g., \"Join\"):\nReply with the name, or type \"cancel\" to stop.",
    invalid_command: "📌 Available commands:\n➤ store page <number>\n➤ store search <name>\n➤ store search category <cat>\n➤ store stats\n➤ store promo list\n➤ store put/promo add (admin)",
    purchase_success: "🎉 PURCHASE SUCCESSFUL! 🎉",
    purchase_error: "❌ PURCHASE FAILED ❌",
    insufficient_funds: "💸 INSUFFICIENT FUNDS 💸",
    expired_session: "⏰ SESSION EXPIRED ⏰",
    admin_only: "🔒 ADMIN ACCESS ONLY 🔒",
    search_results: "🔍 SEARCH RESULTS 🔍",
    purchase_cancelled: "❌ Purchase cancelled",
    invalid_selection: "⚠️ Invalid selection!\nPlease choose a valid number between 1 and %1",
    lang_set: "🌐 Language set to English!",
    lang_current: "🌐 Current language: English",
    lang_invalid: "⚠️ Invalid language!\nAvailable: store lang en (English)\nstore lang fr (Français)",
    stats_title: "📊 STORE STATISTICS 📊",
    promo_title: "🎟️ PROMO CODES 🎟️",
    promo_added: "✅ Promo code added successfully!",
    promo_deleted: "🗑️ Promo code deleted successfully!",
    promo_help: "Admin Usage:\nstore promo add <code> <discount> <duration>\nEx: store promo add SALE50 50 2h\n\nstore promo del <code>",
    promo_invalid_confirm: "❌ Promo code \"%1\" is invalid or expired.\n💰 Final Price: %2 $\n\nReply \"yes\" to pay full price or \"no\" to cancel."
  },
  fr: {
    store_name: "🛒 〖 CommandStore 〗 🛒",
    no_commands: "⚠️ Aucune commande disponible pour le moment.\nRevenez plus tard ! 🕒",
    invalid_page: "⚠️ Veuillez spécifier un numéro de page valide.\nPages disponibles : 1 à %1\n➤ Utilisation : store page <numéro>",
    command_list: "📜 Liste des commandes (Page %1/%2) :",
    reply_to_buy: "📦 Répondez avec le numéro (code promo optionnel).\nEx: \"1\" ou \"1 SOLDES20\"",
    specify_category: "⚠️ Veuillez spécifier une catégorie !\n➤ Utilisation : store search category <catégorie>",
    no_category: "⚠️ Aucune commande trouvée dans cette catégorie !\nEssayez une autre catégorie ou vérifiez l'orthographe. 🔍",
    commands_in_category: "📜 Commandes dans la catégorie \"%1\" :",
    specify_search: "⚠️ Veuillez spécifier le nom de la commande à rechercher !\n➤ Utilisation : store search <nom de la commande>",
    command_not_found: "⚠️ Commande non trouvée !\nCette commande est peut-être trop commune et n'a aucune valeur ici.\nCe store est réservé aux commandes d'élite ! 💎",
    invalid_price: "⚠️ La commande \"%1\" a un prix invalide !\nContactez un administrateur pour régler ce problème.",
    command_found: "✅ Commande \"%1\" trouvée !\n🏆 Rang : %2\n💰 Prix : %3 $\n\nRépondez \"oui\" pour acheter (ou \"oui CODE\").",
    add_command: "🛠️ 〖 StoreAdmin 〗 🛠️\n📝 Ajout d'une nouvelle commande.\nÉtape 1/6 : Entrez le nom de la commande (ex: \"Join\") :\nRépondez avec le nom, ou tapez \"cancel\" pour annuler.",
    invalid_command: "📌 Commandes disponibles :\n➤ store page <numéro>\n➤ store search <nom>\n➤ store search category <cat>\n➤ store stats\n➤ store promo list\n➤ store put/promo add (admin)",
    purchase_success: "🎉 ACHAT RÉUSSI ! 🎉",
    purchase_error: "❌ ÉCHEC DE L'ACHAT ❌",
    insufficient_funds: "💸 FONDS INSUFFISANTS 💸",
    expired_session: "⏰ SESSION EXPIRÉE ⏰",
    admin_only: "🔒 ACCÈS ADMIN SEULEMENT 🔒",
    search_results: "🔍 RÉSULTATS DE RECHERCHE 🔍",
    purchase_cancelled: "❌ Achat annulé",
    invalid_selection: "⚠️ Sélection invalide !\nVeuillez choisir un numéro valide entre 1 et %1",
    lang_set: "🌐 Langue définie en Français !",
    lang_current: "🌐 Langue actuelle : Français",
    lang_invalid: "⚠️ Langue invalide !\nDisponible : store lang en (English)\nstore lang fr (Français)",
    stats_title: "📊 STATISTIQUES DU STORE 📊",
    promo_title: "🎟️ CODES PROMO 🎟️",
    promo_added: "✅ Code promo ajouté avec succès !",
    promo_deleted: "🗑️ Code promo supprimé avec succès !",
    promo_help: "Utilisation Admin :\nstore promo add <code> <réduction> <durée>\nEx: store promo add SOLDE50 50 2h\n\nstore promo del <code>",
    promo_invalid_confirm: "❌ Code promo \"%1\" invalide ou expiré.\n💰 Prix final : %2 $\n\nRépondez \"oui\" pour payer le prix fort ou \"non\" pour annuler."
  }
};

let userLanguages = {};

function formatNumber(number) {
  if (!Number.isFinite(number)) return "0";
  if (number < 1000) return number.toString();
const suffixes = [
  "", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No",
  "Dc", "Ud", "Dd", "Td", "Qad", "Qid", "Sxd", "Spd", "Od", "Nd",
  "Vg", "Uvg", "Dvg", "Tvg", "Qavg", "Qivg", "Sxvg", "Spvg", "Ovg", "Nvg",
  "Tg", "Utg", "Dtg", "Ttg", "Qatg", "Qitg", "Sxtg", "Sptg", "Otg", "Ntg",
  "Qag", "Uqag", "Dqag", "Tqag", "Qaqag", "Qiqag", "Sxqag", "Spqag", "Oqag", "Nqag",
  "Qig", "Uqig", "Dqig", "Tqig", "Qaqig", "Qiqig", "Sxqig", "Spqig", "Oqig", "Nqig",
  "Sxg", "Usxg", "Dsxg", "Tsxg", "Qasxg", "Qisxg", "Sxsxg", "Spsxg", "Osxg", "Nsxg",
  "Spg", "Uspg", "Dspg", "Tspg", "Qaspg", "Qispg", "Sxspg", "Spspg", "Ospg", "Nspg",
  "Og", "Uog", "Dog", "Tog", "Qaog", "Qiog", "Sxog", "Spog", "Oog", "Nog",
  "Ng", "Ung", "Dng", "Tng", "Qang", "Qing", "Sxng", "Spng", "Ong", "Nng",
  "Cg"
];
  const tier = Math.log10(Math.abs(number)) / 3 | 0;
  if (tier === 0) return number.toString();
  const suffix = suffixes[tier];
  const scale = Math.pow(10, tier * 3);
  const scaled = number / scale;
  return scaled.toFixed(1) + suffix;
}

function formatMessage(content, lang = "en") {
  const title = "🛒 〖 CommandStore 〗 🛒";
  const line = "━━━━━━━━━━━━━━━";
  return `${title}\n${line}\n${content}\n${line}`;
}

async function createStoreImage(type, data, lang = "en") {
  try {
    const width = 1000;
    const height = 600;
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0a0a0a');
    gradient.addColorStop(0.3, '#1a1a2e');
    gradient.addColorStop(0.7, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 30; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 4 + 1;
      const alpha = Math.random() * 0.3 + 0.1;
      ctx.fillStyle = `rgba(76, 201, 240, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    let title, color, bgColor, icon;
    
    switch(type) {
      case 'purchase_success':
        title = lang === 'fr' ? '🎉 ACHAT RÉUSSI ! 🎉' : '🎉 PURCHASE SUCCESSFUL! 🎉';
        color = '#00FFAA';
        bgColor = 'rgba(0, 255, 170, 0.1)';
        icon = '✅';
        break;
      case 'purchase_error':
        title = lang === 'fr' ? '❌ ÉCHEC DE L\'ACHAT ❌' : '❌ PURCHASE FAILED ❌';
        color = '#FF4444';
        bgColor = 'rgba(255, 68, 68, 0.1)';
        icon = '❌';
        break;
      case 'insufficient_funds':
        title = lang === 'fr' ? '💸 FONDS INSUFFISANTS 💸' : '💸 INSUFFICIENT FUNDS 💸';
        color = '#FFAA00';
        bgColor = 'rgba(255, 170, 0, 0.1)';
        icon = '💰';
        break;
      case 'command_list':
        title = lang === 'fr' ? '📜 LISTE DES COMMANDES 📜' : '📜 COMMAND LIST 📜';
        color = '#4cc9f0';
        bgColor = 'rgba(76, 201, 240, 0.1)';
        icon = '📜';
        break;
      case 'command_found':
        title = lang === 'fr' ? '✅ COMMANDE TROUVÉE ✅' : '✅ COMMAND FOUND ✅';
        color = '#FFD700';
        bgColor = 'rgba(255, 215, 0, 0.1)';
        icon = '🔍';
        break;
      case 'search_results':
        title = lang === 'fr' ? '🔍 RÉSULTATS 🔍' : '🔍 SEARCH RESULTS 🔍';
        color = '#AA00FF';
        bgColor = 'rgba(170, 0, 255, 0.1)';
        icon = '🔍';
        break;
      default:
        title = lang === 'fr' ? '🛒 COMMAND STORE 🛒' : '🛒 COMMAND STORE 🛒';
        color = '#FFFFFF';
        bgColor = 'rgba(255, 255, 255, 0.1)';
        icon = '🛒';
    }

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, 80);

    ctx.font = 'bold 42px "Segoe UI", Arial';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.fillText(title, width / 2, 55);
    ctx.shadowBlur = 0;

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 200, 65);
    ctx.lineTo(width / 2 + 200, 65);
    ctx.stroke();

    ctx.font = 'bold 28px "Segoe UI", Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';

    const infoX = 80;
    let y = 150;

    if (data.commandName) {
      ctx.fillText(`📛 ${data.commandName}`, infoX, y);
      y += 45;
    }

    if (data.price) {
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 32px "Segoe UI", Arial';
      ctx.fillText(`💰 ${formatNumber(data.price)} $`, infoX, y);
      y += 55;
    }

    if (data.rank) {
      ctx.fillStyle = getRankColor(data.rank);
      ctx.fillRect(infoX - 10, y - 30, 300, 40);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 26px "Segoe UI", Arial';
      ctx.fillText(`🏆 ${data.rank}`, infoX, y);
      y += 55;
    }

    if (data.category) {
      ctx.fillStyle = '#4cc9f0';
      ctx.font = 'bold 24px "Segoe UI", Arial';
      ctx.fillText(`📁 ${data.category}`, infoX, y);
      y += 45;
    }

    if (data.author) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px "Segoe UI", Arial';
      ctx.fillText(`👤 ${data.author}`, infoX, y);
      y += 40;
    }

    if (data.user) {
      ctx.fillStyle = '#AA00FF';
      ctx.font = 'bold 26px "Segoe UI", Arial';
      ctx.fillText(`👤 ${data.user}`, infoX, y);
      y += 50;
    }

    if (data.message) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '22px "Segoe UI", Arial';
      const lines = data.message.split('\n');
      for (const line of lines) {
        ctx.fillText(line, infoX, y);
        y += 35;
      }
    }

    if (data.commands && Array.isArray(data.commands)) {
      const commands = data.commands.slice(0, 8);
      const boxWidth = 400;
      const boxX = infoX;
      const boxY = y;
      const boxHeight = commands.length * 40 + 30;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
      
      ctx.strokeStyle = '#4cc9f0';
      ctx.lineWidth = 2;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
      
      ctx.fillStyle = '#4cc9f0';
      ctx.font = 'bold 20px "Segoe UI", Arial';
      ctx.fillText(`📝 ${commands.length} commands`, boxX + 10, boxY + 25);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '18px "Segoe UI", Arial';
      
      for (let i = 0; i < commands.length; i++) {
        const cmd = commands[i];
        ctx.fillText(`${i + 1}. ${cmd.itemName}`, boxX + 20, boxY + 55 + (i * 40));
        
        ctx.fillStyle = '#FFD700';
        ctx.font = '16px "Segoe UI", Arial';
        ctx.fillText(`${formatNumber(cmd.price)} $`, boxX + 250, boxY + 55 + (i * 40));
        
        ctx.fillStyle = '#4cc9f0';
        ctx.font = '16px "Segoe UI", Arial';
        ctx.fillText(cmd.rank, boxX + 350, boxY + 55 + (i * 40));
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '18px "Segoe UI", Arial';
      }
      
      y += boxHeight + 30;
    }

    ctx.font = 'bold 36px "Segoe UI", Arial';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(`${icon} ${type === 'purchase_success' ? 'COMPLETED' : 'READY'}`, width / 2, height - 80);

    const now = new Date();
    ctx.font = 'italic 18px "Segoe UI", Arial';
    ctx.fillStyle = '#888888';
    ctx.textAlign = 'center';
    ctx.fillText(`CommandStore v2.0 • ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`, width / 2, height - 30);

    return canvas.toBuffer();
  } catch (error) {
    console.error('Image creation error:', error);
    return null;
  }
}

function getRankColor(rank) {
  switch(rank) {
    case 'S': return '#FF0000';
    case 'A': return '#FF6B00';
    case 'B': return '#FFD700';
    case 'C': return '#4cc9f0';
    case 'D': return '#00FFAA';
    default: return '#FFFFFF';
  }
}

async function sendImage(api, event, imageBuffer) {
  try {
    if (!imageBuffer) return null;
    const timestamp = Date.now();
    const fileName = `store_${timestamp}.png`;
    const filePath = path.join(__dirname, fileName);
    await fs.writeFile(filePath, imageBuffer);
    const messageInfo = await new Promise((resolve, reject) => {
      api.sendMessage({
        attachment: fs.createReadStream(filePath)
      }, event.threadID, (err, info) => {
        if (err) return reject(err);
        resolve(info);
      });
    });
    setTimeout(() => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {}
    }, 10000);
    return messageInfo;
  } catch (error) {
    console.error("Image sending error:", error);
    return null;
  }
}

module.exports = {
  config: {
    name: "store",
    aliases: ["cmdstore", "commandstore"],
    version: "6.0",
    role: 0,
    shortDescription: { en: "Access the premium command store", fr: "Accéder au store de commandes premium" },
    longDescription: { 
      en: "Access the elite command store with visual interface\n- store page <number>\n- store search <name>\n- store search category <category>\n- store stats\n- store promo",
      fr: "Accéder au store de commandes d'élite avec interface visuelle\n- store page <numéro>\n- store search <nom>\n- store search category <catégorie>\n- store stats\n- store promo"
    },
    guide: { 
      en: "{p}page <number>\n{p}search <command>\n{p}promo list\n{p}stats",
      fr: "{p}page <numéro>\n{p}search <commande>\n{p}promo list\n{p}stats"
    },
    author: "ミ★𝐒𝐎𝐍𝐈𝐂✄𝐄𝐗𝐄 3.0★彡 || L'Uchiha Perdu",
    category: "economy"
  },

  onStart: async ({ api, event, args, usersData }) => {
    try {
      const userId = event.senderID;
      const userLang = userLanguages[userId] || (event.body?.toLowerCase().includes('fr') ? 'fr' : 'en');
      const lang = LANG[userLang];
      
      if (!args[0]) {
        api.sendMessage(formatMessage(lang.invalid_command, userLang), event.threadID, event.messageID);
        return;
      }
      
      const command = args[0].toLowerCase();
      
      if (command === "lang") {
        if (!args[1]) {
          api.sendMessage(formatMessage(lang.lang_current, userLang), event.threadID, event.messageID);
          return;
        }
        
        const langChoice = args[1].toLowerCase();
        if (langChoice === "en") {
          userLanguages[userId] = "en";
          api.sendMessage(formatMessage(LANG.en.lang_set, "en"), event.threadID, event.messageID);
          return;
        } else if (langChoice === "fr") {
          userLanguages[userId] = "fr";
          api.sendMessage(formatMessage(LANG.fr.lang_set, "fr"), event.threadID, event.messageID);
          return;
        } else {
          api.sendMessage(formatMessage(lang.lang_invalid, userLang), event.threadID, event.messageID);
          return;
        }
      }

      if (command === "stats") {
        try {
          const response = await axios.get(`${serverURL}/api/stats`);
          const stats = response.data.stats;
          
          let msg = `📦 Total Commands: ${stats.totalCommands}\n`;
          msg += `📁 Categories: ${stats.totalCategories}\n`;
          msg += `👤 Authors: ${stats.totalAuthors}\n`;
          msg += `🏷️ Active Promos: ${stats.activePromoCodes}/${stats.totalPromoCodes}\n`;
          msg += `💰 Price Range: ${formatNumber(stats.priceRange.min)}$ - ${formatNumber(stats.priceRange.max)}$\n`;
          msg += `📊 Average Price: ${formatNumber(stats.priceRange.average)}$`;

          api.sendMessage(formatMessage(`${lang.stats_title}\n\n${msg}`, userLang), event.threadID, event.messageID);
        } catch (error) {
          api.sendMessage(formatMessage("❌ Error fetching stats", userLang), event.threadID, event.messageID);
        }
        return;
      }

      if (command === "promo") {
        const subCmd = args[1] ? args[1].toLowerCase() : "list";

        if (subCmd === "list") {
          try {
            const response = await axios.get(`${serverURL}/api/promo`);
            const promos = response.data.promoCodes;
            
            if (promos.length === 0) {
              api.sendMessage(formatMessage("No active promo codes.", userLang), event.threadID, event.messageID);
              return;
            }

            let msg = "";
            promos.forEach(p => {
              const expires = p.expiresAt ? new Date(p.expiresAt).toLocaleDateString() : "Never";
              msg += `🎟️ ${p.code}: -${p.discount}% (Exp: ${expires})\n`;
            });
            
            api.sendMessage(formatMessage(`${lang.promo_title}\n\n${msg}`, userLang), event.threadID, event.messageID);
          } catch (error) {
            api.sendMessage(formatMessage("❌ Error fetching promos", userLang), event.threadID, event.messageID);
          }
          return;
        }

        if (["add", "create", "del", "delete"].includes(subCmd)) {
          if (!ADMIN_UID.includes(event.senderID.toString())) {
             api.sendMessage(formatMessage(lang.admin_only, userLang), event.threadID, event.messageID);
             return;
          }

          if (subCmd === "add" || subCmd === "create") {
             const code = args[2];
             const discount = args[3];
             const duration = args[4];

             if (!code || !discount || !duration) {
               api.sendMessage(formatMessage(lang.promo_help, userLang), event.threadID, event.messageID);
               return;
             }

             try {
                await axios.post(`${serverURL}/api/promo`, {
                    code, discount, duration
                }, { headers: { 'x-api-key': API_KEY } });
                
                api.sendMessage(formatMessage(lang.promo_added, userLang), event.threadID, event.messageID);
             } catch (e) {
                api.sendMessage(formatMessage(`❌ Error: ${e.response?.data?.error || e.message}`, userLang), event.threadID, event.messageID);
             }
             return;
          }

          if (subCmd === "del" || subCmd === "delete") {
              const code = args[2];
              if (!code) return api.sendMessage(formatMessage(lang.promo_help, us
