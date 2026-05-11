const fs = require("fs-extra");

module.exports = {
	config: {
		name: "join",
		version: "0.0.7",
		author: "chrisst",
		countDown: 5,
		role: 0,
		shortDescription: "𝐉𝐨𝐢𝐧 𝐆𝐫𝐨𝐮𝐩 𝐖𝐡𝐞𝐫𝐞 𝐁𝐨𝐭 𝐄𝐱𝐢𝐬𝐭𝐬",
		category: "owner",
		guide: {
			en: "{p}{n}"
		}
	},
    
	truncateName: function(name, maxLength = 30) {
		if (!name || name.trim() === "") return "𝐔𝐧𝐧𝐚𝐦𝐞𝐝 𝐆𝐫𝐨𝐮𝐩";
		if (name.length <= maxLength) return name;
		return name.substring(0, maxLength) + "'-'";
	},

	onStart: async function ({ api, event }) {
		try {
			const groupList = await api.getThreadList(50, null, ["INBOX"]);
		    
			const groups = groupList.filter(i => i.threadID && i.threadID.length >= 15);

			if (!groups.length) {
				return api.sendMessage("❌ | 𝚖𝚒𝚗𝚊𝚝𝚘 𝚗'𝚎𝚜𝚝 𝚙𝚊𝚜 𝚞𝚗 𝚐𝚛𝚘𝚞𝚙𝚎.", event.threadID);
			}
		    
			const groupsWithNames = await Promise.all(
				groups.map(async (g) => {
					try {
						let fullName = g.threadName;
					    
						if (!fullName || fullName.trim() === "") {
							const info = await api.getThreadInfo(g.threadID);
							fullName = info.threadName || info.name || "𝐔𝐧𝐧𝐚𝐦𝐞𝐝 𝐆𝐫𝐨𝐮𝐩";
						}
						
						return { 
							...g, 
							fullName: fullName,
							displayName: this.truncateName(fullName, 30),
							participantCount: g.participantIDs?.length || 0
						};
					} catch (e) {
						return { 
							...g, 
							fullName: g.threadName || "𝐔𝐧𝐧𝐚𝐦𝐞𝐝 𝐆𝐫𝐨𝐮𝐩",
							displayName: this.truncateName(g.threadName, 30),
							participantCount: g.participantIDs?.length || 0
						};
					}
				})
			);

			let msg = `╭─『 📂 𝐆𝐑𝐎𝐔𝐏 𝐋𝐈𝐒𝐓 』─╮\n\n`;

			groupsWithNames.forEach((g, i) => {
				const memberCount = g.participantCount || 0;
				msg += `┃ ${i + 1}. ${g.displayName}\n`;
				msg += `┃ 🆔 ${g.threadID}\n`;
				msg += `┃ 👥 ${memberCount}/𝐌𝐞𝐦𝐛𝐞𝐫𝐬\n`;
				msg += `┃\n`;
			});

			msg += `╰───────────────╯\n\n`;
			msg += `💬 𝚁é𝚙𝚘𝚗𝚍𝚎𝚣 𝚊𝚟𝚎𝚌 𝚕𝚎 𝚗𝚞𝚖é𝚛𝚘 𝚍𝚞 𝚐𝚛𝚘𝚞𝚙𝚎 𝚙𝚘𝚞𝚛 𝚚𝚞𝚎 𝙼𝚒𝚗𝚊𝚝𝚘 𝚟𝚘𝚞𝚜 𝚝𝚎𝚕𝚎𝚙𝚘𝚛𝚝 𝚍𝚊𝚗𝚜 𝚕𝚎 𝚐𝚛𝚘𝚞𝚙𝚎..`;

			const sent = await api.sendMessage(msg, event.threadID);

			global.GoatBot.onReply.set(sent.messageID, {
				commandName: "join",
				author: event.senderID,
				groups: groupsWithNames
			});

		} catch (err) {
			console.log("🥷 𝙼𝚒𝚗𝚊𝚝𝚘 𝙱𝚎𝚋𝚎 𝚙𝚘𝚗𝚐 𝚚𝚞𝚒 𝚐𝚊𝚛𝚐𝚘𝚞𝚒𝚕𝚕𝚎:", err);
			api.sendMessage("❌ | 𝙴𝚛𝚛𝚎𝚞𝚛 𝚕𝚘𝚛𝚜 𝚍𝚎 𝚕𝚊 𝚝é𝚕é𝚙𝚘𝚛𝚝𝚊𝚝𝚒𝚘𝚗 𝚍𝚎 𝚕𝚊 𝚕𝚒𝚜𝚝𝚎 𝚍𝚎𝚜 𝚐𝚛𝚘𝚞𝚙𝚎𝚜.", event.threadID);
		}
	},

	onReply: async function ({ api, event, Reply, args }) {
		if (event.senderID != Reply.author) return;

		const index = parseInt(args[0]);
		const groups = Reply.groups;

		if (isNaN(index) || index < 1 || index > groups.length) {
			return api.sendMessage("⚠️ | 𝙼𝚒𝚗𝚊𝚝𝚘: 𝚗𝚞𝚖é𝚛𝚘 𝚍𝚎 𝚐𝚛𝚘𝚞𝚙𝚎 𝚒𝚗𝚟𝚊𝚕𝚒𝚍𝚎.", event.threadID, event.messageID);
		}

		const group = groups[index - 1];
		const groupName = group.fullName || group.threadName || "𝐔𝐧𝐧𝐚𝐦𝐞𝐝 𝐆𝐫𝐨𝐮𝐩";

		try {
			const info = await api.getThreadInfo(group.threadID);
			const currentName = info.threadName || info.name || groupName;

			if (info.participantIDs.includes(event.senderID)) {
				return api.sendMessage(
					`⚠️ | 𝚃𝚞 é𝚝𝚊𝚒𝚝 𝚍é𝚓à 𝚝𝚎𝚕𝚎𝚙𝚘𝚛𝚝𝚎𝚛 𝚜𝚊𝚗𝚜 𝚕𝚎 𝚜𝚊𝚟𝚘𝚒𝚛\n${currentName}`,
					event.threadID,
					event.messageID
				);
			}

			if (info.participantIDs.length >= 250) {
				return api.sendMessage(
					`❌ | 𝙼𝚒𝚗𝚊𝚝𝚘 à 𝚝𝚎𝚕𝚎𝚙𝚘𝚛𝚝𝚎𝚛 𝚙𝚕𝚎𝚒𝚗𝚜 𝚍𝚎𝚜 𝚐𝚎𝚗𝚜\n${currentName}`,
					event.threadID,
					event.messageID
				);
			}

			await api.addUserToGroup(event.senderID, group.threadID);

			api.sendMessage(
				`✅ | 𝚃𝚎𝚕𝚎𝚙𝚘𝚛𝚝𝚊𝚝𝚒𝚘𝚗 𝚛é𝚞𝚜𝚜𝚒𝚎\n${currentName}`,
				event.threadID,
				event.messageID
			);

		} catch (err) {
			console.log("𝙳é𝚜𝚘𝚕𝚎 𝚓'𝚊𝚒 𝚙𝚊𝚜 𝚛é𝚞𝚜𝚜𝚒 à 𝚝𝚎 𝚝𝚎𝚕𝚎𝚙𝚘𝚛𝚝𝚎𝚛:", err);
			api.sendMessage("❌ | 𝚙𝚘𝚗𝚐 𝚌𝚑𝚞𝚍𝚕𝚒𝚗𝚐", event.threadID, event.messageID);
		}

		global.GoatBot.onReply.delete(event.messageID);
	}
};
