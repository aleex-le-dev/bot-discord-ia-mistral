require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");
const https = require("https");
const config = require("./config");
const features = require("./features");
const notion = require("./notion");

// Configuration du client Discord avec les permissions nécessaires
const client = new Client({
  intents: config.discord.intents.map((intent) => GatewayIntentBits[intent]),
});

// Configuration de l'API Mistral
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

// Stockage des personnalités par utilisateur
const userPersonalities = new Map();
const userStats = new Map();

const NOTION_PAGE_IDS = [
  process.env.NOTION_PAGE_ID_1,
  process.env.NOTION_PAGE_ID_2,
].filter(Boolean);
let notionKnowledge = "";

// Charger la connaissance Notion au démarrage et périodiquement
async function refreshNotionKnowledge() {
  if (NOTION_PAGE_IDS.length === 0) return;
  try {
    notionKnowledge = await notion.getMultiplePagesText(NOTION_PAGE_IDS);
    console.log("Connaissance Notion synchronisée.");
  } catch (e) {
    console.error("Erreur lors de la synchronisation Notion:", e);
  }
}
refreshNotionKnowledge();
setInterval(refreshNotionKnowledge, 1000 * 60 * 10); // toutes les 10 min

// Événement de connexion réussie
client.once("ready", () => {
  console.log(`${config.messages.connected} ${client.user.tag}`);
  console.log(config.messages.ready);
  console.log(
    "🤖 Bot IA avancé avec personnalités et commandes spéciales activé !"
  );
});

// Fonction pour appeler l'API Mistral avec personnalité
function callMistralAPI(prompt) {
  return new Promise((resolve, reject) => {
    let systemPrompt = "";
    if (notionKnowledge) {
      systemPrompt =
        'Voici toute la base de connaissances à utiliser pour répondre à toutes les questions. Si la réponse n\'est pas dans cette base, réponds "Je ne sais pas."\n' +
        notionKnowledge;
    } else {
      systemPrompt = "Tu ne sais rien.";
    }
    const data = JSON.stringify({
      model: config.mistral.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      max_tokens: config.mistral.maxTokens,
      temperature: config.mistral.temperature,
    });

    const options = {
      hostname: "api.mistral.ai",
      port: 443,
      path: "/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
        "Content-Length": Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            const jsonResponse = JSON.parse(responseData);
            resolve(jsonResponse.choices[0].message.content);
          } catch (error) {
            reject(new Error("Erreur parsing JSON: " + error.message));
          }
        } else if (res.statusCode === 429) {
          reject(new Error("RATE_LIMIT"));
        } else {
          console.error("Erreur API:", res.statusCode, responseData);
          reject(new Error(`Erreur API: ${res.statusCode} - ${responseData}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(new Error("Erreur réseau: " + error.message));
    });

    req.write(data);
    req.end();
  });
}

// Fonction pour créer un embed
function createEmbed(title, description, color = 0x0099ff) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp()
    .setFooter({ text: "Bot IA Discord - Créé avec ❤️" });
}

// Fonction pour créer le menu déroulant des commandes
function createCommandsMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("commands_menu")
      .setPlaceholder("Choisis une commande spéciale")
      .addOptions([
        { label: "Blague du jour", value: "blague", emoji: "🎭" },
        { label: "Citation inspirante", value: "citation", emoji: "💡" },
        { label: "Débat philosophique", value: "debat", emoji: "💭" },
        { label: "Quiz interactif", value: "quiz", emoji: "🎮" },
        { label: "Histoire courte", value: "histoire", emoji: "📖" },
        { label: "Poème personnalisé", value: "poeme", emoji: "📝" },
        { label: "Défi créatif", value: "challenge", emoji: "🎨" },
        { label: "Idée de meme", value: "meme", emoji: "😂" },
      ])
  );
}

// Fonction pour gérer les commandes spéciales
async function handleSpecialCommands(message) {
  const content = message.content.toLowerCase();

  // Commande personnalité avec suggestions visuelles
  if (content === "!personnalite") {
    const embed = createEmbed(
      "🎭 Choisis ta personnalité IA",
      "**Personnalités disponibles :**\n\n" +
        "**🤖 Normal** - Assistant général\n" +
        "`!personnalite default`\n\n" +
        "**🎭 Humoriste** - Blagues et humour\n" +
        "`!personnalite humoriste`\n\n" +
        "**💭 Philosophe** - Réflexions profondes\n" +
        "`!personnalite philosophe`\n\n" +
        "**💪 Coach** - Motivation et conseils\n" +
        "`!personnalite coach`\n\n" +
        "**🔬 Scientifique** - Explications claires\n" +
        "`!personnalite scientifique`\n\n" +
        "**📚 Historien** - Anecdotes historiques\n" +
        "`!personnalite historien`\n\n" +
        "💡 **Exemple :** Tape `!personnalite humoriste` pour passer en mode blagueur !",
      0xff6b6b
    );

    message.reply({ embeds: [embed] });
    return true;
  }

  // Commande personnalité spécifique
  if (content.startsWith("!personnalite ")) {
    const personality = content.split(" ")[1];
    if (features.personalities[personality]) {
      userPersonalities.set(message.author.id, personality);
      const embed = createEmbed(
        "🎭 Personnalité changée !",
        `Tu es maintenant en mode **${personality}** !\n\n` +
          `L'IA s'adaptera à cette personnalité pour tes prochaines conversations.\n\n` +
          `**Personnalité actuelle :** ${personality}\n` +
          `**Description :** ${features.personalities[personality]}`,
        0xff6b6b
      );
      message.reply({ embeds: [embed] });
      return true;
    }
  }

  // Commande menu des commandes avec menu déroulant interactif
  if (content === "!menu") {
    const embed = createEmbed(
      "🎮 Menu des commandes spéciales",
      "Sélectionne une commande dans le menu déroulant ci-dessous :",
      0x00ff00
    );
    const menu = createCommandsMenu();
    message.reply({ embeds: [embed], components: [menu] });
    return true;
  }

  // Commande aide avec suggestions détaillées
  if (content === "!aide") {
    const embed = createEmbed(
      "🤖 Aide et commandes",
      "**🎭 Personnalités disponibles :**\n" +
        Object.keys(features.personalities)
          .map((p) => `• **${p}** - ${features.personalities[p]}`)
          .join("\n") +
        "\n\n" +
        "**🎮 Commandes principales :**\n" +
        "• `!personnalite` - Voir les personnalités disponibles\n" +
        "• `!personnalite [nom]` - Choisir une personnalité\n" +
        "• `!menu` - Voir toutes les commandes spéciales\n" +
        "• `!aide` - Cette aide\n\n" +
        "**💡 Utilisation :**\n" +
        "• Tape simplement ton message pour discuter\n" +
        "• Utilise les commandes pour des fonctionnalités spéciales\n\n" +
        "**🎯 Exemples rapides :**\n" +
        "• `!personnalite humoriste` → Mode blagueur\n" +
        "• `!blague` → Raconter une blague\n" +
        "• `!citation` → Citation inspirante\n" +
        "• `!quiz` → Quiz interactif",
      0x00ff00
    );

    message.reply({ embeds: [embed] });
    return true;
  }

  // Commande blague
  if (content === "!blague") {
    const response = await callMistralAPI(
      "Raconte-moi une blague drôle et originale en français",
      "humoriste"
    );
    const embed = createEmbed(
      "🎭 Blague du jour",
      response +
        "\n\n💡 **Autres commandes :** `!citation`, `!quiz`, `!histoire`",
      0xffd93d
    );
    message.reply({ embeds: [embed] });
    return true;
  }

  // Commande citation
  if (content === "!citation") {
    const response = await callMistralAPI(
      "Donne-moi une citation inspirante et motivante en français",
      "coach"
    );
    const embed = createEmbed(
      "💡 Citation inspirante",
      `*"${response}"*` +
        "\n\n💡 **Autres commandes :** `!blague`, `!debat`, `!challenge`",
      0x6bcf7f
    );
    message.reply({ embeds: [embed] });
    return true;
  }

  // Commande débat
  if (content.startsWith("!debat")) {
    const sujet =
      content.replace("!debat", "").trim() ||
      "un sujet philosophique intéressant";
    const response = await callMistralAPI(
      `Lance un débat sur ${sujet}. Pose une question provocante et donne 3 arguments pour et contre.`,
      "philosophe"
    );
    const embed = createEmbed(
      "💭 Débat philosophique",
      response + "\n\n💡 **Autres commandes :** `!citation`, `!quiz`, `!poeme`",
      0x9b59b6
    );
    message.reply({ embeds: [embed] });
    return true;
  }

  // Commande quiz
  if (content === "!quiz") {
    const response = await callMistralAPI(
      "Crée un quiz amusant avec 3 questions et leurs réponses. Format : Question 1: [question] Réponse: [réponse]",
      "scientifique"
    );
    const embed = createEmbed(
      "🎮 Quiz du jour",
      response +
        "\n\n💡 **Autres commandes :** `!blague`, `!histoire`, `!meme`",
      0x3498db
    );
    message.reply({ embeds: [embed] });
    return true;
  }

  // Commande histoire
  if (content === "!histoire") {
    const response = await callMistralAPI(
      "Raconte-moi une histoire courte et captivante (max 200 mots)",
      "default"
    );
    const embed = createEmbed(
      "📖 Histoire du jour",
      response +
        "\n\n💡 **Autres commandes :** `!poeme`, `!challenge`, `!citation`",
      0xe74c3c
    );
    message.reply({ embeds: [embed] });
    return true;
  }

  // Commande poème
  if (content.startsWith("!poeme")) {
    const sujet = content.replace("!poeme", "").trim() || "la vie";
    const response = await callMistralAPI(
      `Écris un poème court et beau sur ${sujet}`,
      "default"
    );
    const embed = createEmbed(
      "📝 Poème personnalisé",
      response +
        "\n\n💡 **Autres commandes :** `!histoire`, `!citation`, `!debat`",
      0xf39c12
    );
    message.reply({ embeds: [embed] });
    return true;
  }

  // Commande challenge
  if (content === "!challenge") {
    const response = await callMistralAPI(
      "Propose un défi créatif amusant pour aujourd'hui",
      "coach"
    );
    const embed = createEmbed(
      "🎨 Défi créatif",
      response + "\n\n💡 **Autres commandes :** `!meme`, `!blague`, `!quiz`",
      0xe91e63
    );
    message.reply({ embeds: [embed] });
    return true;
  }

  // Commande meme
  if (content === "!meme") {
    const response = await callMistralAPI(
      "Génère une idée de meme drôle et originale",
      "humoriste"
    );
    const embed = createEmbed(
      "😂 Idée de meme",
      response +
        "\n\n💡 **Autres commandes :** `!challenge`, `!blague`, `!histoire`",
      0x1abc9c
    );
    message.reply({ embeds: [embed] });
    return true;
  }

  // Commande suggestions
  if (content === "!suggestions") {
    const embed = createEmbed(
      "💡 Suggestions d'utilisation",
      "**🎭 Pour commencer :**\n" +
        "• `!personnalite` - Découvre les personnalités\n" +
        "• `!menu` - Voir toutes les commandes\n" +
        "• `!aide` - Aide complète\n\n" +
        "**🎮 Pour s'amuser :**\n" +
        "• `!blague` - Une blague drôle\n" +
        "• `!quiz` - Quiz interactif\n" +
        "• `!meme` - Idée de meme\n\n" +
        "**💭 Pour réfléchir :**\n" +
        "• `!citation` - Citation inspirante\n" +
        "• `!debat` - Débat philosophique\n" +
        "• `!histoire` - Histoire courte\n\n" +
        "**🎨 Pour créer :**\n" +
        "• `!poeme [sujet]` - Poème personnalisé\n" +
        "• `!challenge` - Défi créatif\n\n" +
        "**💡 Conseil :** Change de personnalité avec `!personnalite [nom]` pour varier les réponses !",
      0x00ffff
    );

    message.reply({ embeds: [embed] });
    return true;
  }

  return false;
}

// Gestion des messages
client.on("messageCreate", async (message) => {
  // Ignorer les messages des bots
  if (message.author.bot) return;

  // Ignorer les commandes spécifiées dans la config
  if (
    config.commands.ignoreCommands.some((cmd) =>
      message.content.startsWith(cmd)
    )
  )
    return;

  // Gérer les commandes spéciales
  if (message.content.startsWith("!")) {
    const handled = await handleSpecialCommands(message);
    if (handled) return;
  }

  // Si autoReply est activé, répondre à tous les messages
  let prompt = message.content;

  // Si le message commence par le préfixe, l'enlever
  if (message.content.startsWith(config.commands.prefix)) {
    prompt = message.content.slice(config.commands.prefix.length);
  }

  // Si autoReply est désactivé, ne répondre qu'aux messages avec préfixe
  if (
    !config.commands.autoReply &&
    !message.content.startsWith(config.commands.prefix)
  ) {
    return;
  }

  // Envoyer le message de chargement
  const loadingMessage = await message.reply(config.messages.loading);

  try {
    // Récupérer la personnalité de l'utilisateur
    const personality = userPersonalities.get(message.author.id) || "default";

    // Appel à l'API Mistral
    const response = await callMistralAPI(prompt, personality);

    // Supprimer le message de chargement et répondre avec la réponse de l'IA
    await loadingMessage.delete();

    // Créer un embed avec la réponse et des suggestions
    const suggestions = [
      "💡 **Commandes rapides :** `!blague`, `!citation`, `!quiz`",
      "🎭 **Change de personnalité :** `!personnalite`",
      "🎮 **Plus de commandes :** `!menu`",
      "💭 **Débattez :** `!debat [sujet]`",
      "📝 **Créez :** `!poeme [sujet]`",
    ];
    const randomSuggestion =
      suggestions[Math.floor(Math.random() * suggestions.length)];

    const embed = createEmbed(
      "🤖 Réponse IA",
      response + "\n\n" + randomSuggestion,
      0x0099ff
    );
    message.reply({ embeds: [embed] });

    // Mettre à jour les stats utilisateur
    const userStat = userStats.get(message.author.id) || {
      messages: 0,
      personality: personality,
    };
    userStat.messages++;
    userStats.set(message.author.id, userStat);
  } catch (error) {
    // Supprimer le message de chargement
    await loadingMessage.delete();

    if (error.message === "RATE_LIMIT") {
      console.error("Rate limit atteint");
      message.reply(config.messages.rateLimit);
    } else {
      console.error("Erreur Mistral:", error);
      message.reply(config.messages.error);
    }
  }
});

// Gestion des interactions pour le menu déroulant
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;
  await interaction.deferUpdate();
  try {
    if (interaction.customId === "commands_menu") {
      const command = interaction.values[0];
      let response, title, color;
      switch (command) {
        case "blague":
          response = await callMistralAPI(
            "Raconte-moi une blague drôle et originale en français",
            "humoriste"
          );
          title = "🎭 Blague du jour";
          color = 0xffd93d;
          break;
        case "citation":
          response = await callMistralAPI(
            "Donne-moi une citation inspirante et motivante en français",
            "coach"
          );
          title = "💡 Citation inspirante";
          color = 0x6bcf7f;
          break;
        case "debat":
          response = await callMistralAPI(
            "Lance un débat philosophique intéressant. Pose une question provocante et donne 3 arguments pour et contre.",
            "philosophe"
          );
          title = "💭 Débat philosophique";
          color = 0x9b59b6;
          break;
        case "quiz":
          response = await callMistralAPI(
            "Crée un quiz amusant avec 3 questions et leurs réponses. Format : Question 1: [question] Réponse: [réponse]",
            "scientifique"
          );
          title = "🎮 Quiz du jour";
          color = 0x3498db;
          break;
        case "histoire":
          response = await callMistralAPI(
            "Raconte-moi une histoire courte et captivante (max 200 mots)",
            "default"
          );
          title = "📖 Histoire du jour";
          color = 0xe74c3c;
          break;
        case "poeme":
          response = await callMistralAPI(
            "Écris un poème court et beau sur la vie",
            "default"
          );
          title = "📝 Poème personnalisé";
          color = 0xf39c12;
          break;
        case "challenge":
          response = await callMistralAPI(
            "Propose un défi créatif amusant pour aujourd'hui",
            "coach"
          );
          title = "🎨 Défi créatif";
          color = 0xe91e63;
          break;
        case "meme":
          response = await callMistralAPI(
            "Génère une idée de meme drôle et originale",
            "humoriste"
          );
          title = "😂 Idée de meme";
          color = 0x1abc9c;
          break;
      }
      const embed = createEmbed(title, response, color);
      await interaction.followUp({ embeds: [embed] });
    }
  } catch (error) {
    await interaction.followUp({
      content: "❌ Erreur lors de l'exécution de la commande.",
      ephemeral: true,
    });
  }
});

// Connexion du bot avec le token Discord
client.login(process.env.DISCORD_TOKEN);
