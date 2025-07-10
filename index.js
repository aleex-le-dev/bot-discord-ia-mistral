require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require("discord.js");
const https = require("https");
const config = require("./config");
const features = require("./features");

// Configuration du client Discord avec les permissions nécessaires
const client = new Client({
  intents: config.discord.intents.map((intent) => GatewayIntentBits[intent]),
});

// Configuration de l'API Mistral
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

// Stockage des personnalités par utilisateur
const userPersonalities = new Map();
const userStats = new Map();

// Événement de connexion réussie
client.once("ready", () => {
  console.log(`${config.messages.connected} ${client.user.tag}`);
  console.log(config.messages.ready);
  console.log(
    "🤖 Bot IA avancé avec personnalités et commandes spéciales activé !"
  );
});

// Fonction pour appeler l'API Mistral avec personnalité
function callMistralAPI(prompt, personality = "default") {
  return new Promise((resolve, reject) => {
    const systemPrompt =
      features.personalities[personality] || features.personalities.default;

    const data = JSON.stringify({
      model: config.mistral.model,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
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

// Fonction pour créer les boutons de personnalités
function createPersonalityButtons() {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("personality_default")
      .setLabel("🤖 Normal")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("personality_humoriste")
      .setLabel("🎭 Humoriste")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("personality_philosophe")
      .setLabel("💭 Philosophe")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("personality_coach")
      .setLabel("💪 Coach")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("personality_scientifique")
      .setLabel("🔬 Scientifique")
      .setStyle(ButtonStyle.Danger)
  );
  return row;
}

// Fonction pour créer le menu des commandes
function createCommandsMenu() {
  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("commands_menu")
      .setPlaceholder("🎮 Choisis une commande spéciale")
      .addOptions([
        {
          label: "🎭 Blague du jour",
          description: "Raconte une blague drôle",
          value: "blague",
          emoji: "🎭",
        },
        {
          label: "💡 Citation inspirante",
          description: "Génère une citation motivante",
          value: "citation",
          emoji: "💡",
        },
        {
          label: "💭 Débat philosophique",
          description: "Lance un débat intéressant",
          value: "debat",
          emoji: "💭",
        },
        {
          label: "🎮 Quiz interactif",
          description: "Crée un quiz amusant",
          value: "quiz",
          emoji: "🎮",
        },
        {
          label: "📖 Histoire courte",
          description: "Raconte une histoire captivante",
          value: "histoire",
          emoji: "📖",
        },
        {
          label: "📝 Poème personnalisé",
          description: "Écrit un poème sur un sujet",
          value: "poeme",
          emoji: "📝",
        },
        {
          label: "🎨 Défi créatif",
          description: "Propose un défi amusant",
          value: "challenge",
          emoji: "🎨",
        },
        {
          label: "😂 Idée de meme",
          description: "Génère une idée de meme",
          value: "meme",
          emoji: "😂",
        },
      ])
  );
  return row;
}

// Fonction pour gérer les commandes spéciales
async function handleSpecialCommands(message) {
  const content = message.content.toLowerCase();

  // Commande personnalité avec boutons
  if (content === "!personnalite") {
    const embed = createEmbed(
      "🎭 Choisis ta personnalité IA",
      "Clique sur un bouton pour changer la personnalité de l'IA :\n\n" +
        "**🤖 Normal** - Assistant général\n" +
        "**🎭 Humoriste** - Blagues et humour\n" +
        "**💭 Philosophe** - Réflexions profondes\n" +
        "**💪 Coach** - Motivation et conseils\n" +
        "**🔬 Scientifique** - Explications claires",
      0xff6b6b
    );

    const buttons = createPersonalityButtons();
    message.reply({ embeds: [embed], components: [buttons] });
    return true;
  }

  // Commande menu des commandes
  if (content === "!menu") {
    const embed = createEmbed(
      "🎮 Menu des commandes spéciales",
      "Utilise le menu déroulant pour choisir une commande spéciale :\n\n" +
        "• **🎭 Blague** - Raconte une blague\n" +
        "• **💡 Citation** - Citation inspirante\n" +
        "• **💭 Débat** - Lance un débat\n" +
        "• **🎮 Quiz** - Quiz interactif\n" +
        "• **📖 Histoire** - Histoire courte\n" +
        "• **📝 Poème** - Poème personnalisé\n" +
        "• **🎨 Challenge** - Défi créatif\n" +
        "• **😂 Meme** - Idée de meme",
      0x00ff00
    );

    const menu = createCommandsMenu();
    message.reply({ embeds: [embed], components: [menu] });
    return true;
  }

  // Commande aide avec boutons
  if (content === "!aide") {
    const embed = createEmbed(
      "🤖 Aide et commandes",
      "**🎭 Personnalités disponibles :**\n" +
        Object.keys(features.personalities)
          .map((p) => `• ${p}`)
          .join("\n") +
        "\n\n" +
        "**🎮 Commandes principales :**\n" +
        "• `!personnalite` - Choisir une personnalité\n" +
        "• `!menu` - Menu des commandes spéciales\n" +
        "• `!aide` - Cette aide\n\n" +
        "**💡 Utilisation :**\n" +
        "• Tape simplement ton message pour discuter\n" +
        "• Utilise les commandes pour des fonctionnalités spéciales",
      0x00ff00
    );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("help_personality")
        .setLabel("🎭 Personnalités")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("help_commands")
        .setLabel("🎮 Commandes")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("help_examples")
        .setLabel("💡 Exemples")
        .setStyle(ButtonStyle.Success)
    );

    message.reply({ embeds: [embed], components: [row] });
    return true;
  }

  // Commandes simples (sans boutons)
  if (content === "!blague") {
    const response = await callMistralAPI(
      "Raconte-moi une blague drôle et originale en français",
      "humoriste"
    );
    const embed = createEmbed("🎭 Blague du jour", response, 0xffd93d);
    message.reply({ embeds: [embed] });
    return true;
  }

  if (content === "!citation") {
    const response = await callMistralAPI(
      "Donne-moi une citation inspirante et motivante en français",
      "coach"
    );
    const embed = createEmbed(
      "💡 Citation inspirante",
      `*"${response}"*`,
      0x6bcf7f
    );
    message.reply({ embeds: [embed] });
    return true;
  }

  if (content === "!quiz") {
    const response = await callMistralAPI(
      "Crée un quiz amusant avec 3 questions et leurs réponses. Format : Question 1: [question] Réponse: [réponse]",
      "scientifique"
    );
    const embed = createEmbed("🎮 Quiz du jour", response, 0x3498db);
    message.reply({ embeds: [embed] });
    return true;
  }

  if (content === "!histoire") {
    const response = await callMistralAPI(
      "Raconte-moi une histoire courte et captivante (max 200 mots)",
      "default"
    );
    const embed = createEmbed("📖 Histoire du jour", response, 0xe74c3c);
    message.reply({ embeds: [embed] });
    return true;
  }

  if (content === "!challenge") {
    const response = await callMistralAPI(
      "Propose un défi créatif amusant pour aujourd'hui",
      "coach"
    );
    const embed = createEmbed("🎨 Défi créatif", response, 0xe91e63);
    message.reply({ embeds: [embed] });
    return true;
  }

  if (content === "!meme") {
    const response = await callMistralAPI(
      "Génère une idée de meme drôle et originale",
      "humoriste"
    );
    const embed = createEmbed("😂 Idée de meme", response, 0x1abc9c);
    message.reply({ embeds: [embed] });
    return true;
  }

  return false;
}

// Gestion des interactions (boutons et menus)
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

  await interaction.deferUpdate();

  try {
    // Gestion des boutons de personnalité
    if (
      interaction.isButton() &&
      interaction.customId.startsWith("personality_")
    ) {
      const personality = interaction.customId.replace("personality_", "");
      userPersonalities.set(interaction.user.id, personality);

      const embed = createEmbed(
        "🎭 Personnalité changée !",
        `Tu es maintenant en mode **${personality}** !\n\nL'IA s'adaptera à cette personnalité pour tes prochaines conversations.`,
        0xff6b6b
      );

      await interaction.followUp({ embeds: [embed], ephemeral: true });
      return;
    }

    // Gestion du menu des commandes
    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === "commands_menu"
    ) {
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
      return;
    }

    // Gestion des boutons d'aide
    if (interaction.isButton() && interaction.customId.startsWith("help_")) {
      const helpType = interaction.customId.replace("help_", "");
      let embed;

      switch (helpType) {
        case "personality":
          embed = createEmbed(
            "🎭 Personnalités disponibles",
            Object.keys(features.personalities)
              .map((p) => `• **${p}** - ${features.personalities[p]}`)
              .join("\n"),
            0xff6b6b
          );
          break;
        case "commands":
          embed = createEmbed(
            "🎮 Commandes spéciales",
            Object.keys(features.commands)
              .map((cmd) => `• **${cmd}** - ${features.commands[cmd]}`)
              .join("\n"),
            0x3498db
          );
          break;
        case "examples":
          embed = createEmbed(
            "💡 Exemples d'utilisation",
            '**Discussions normales :**\n• "Salut comment ça va ?"\n• "Raconte-moi une histoire"\n\n' +
              "**Commandes spéciales :**\n• `!personnalite` - Choisir une personnalité\n• `!menu` - Menu des commandes\n• `!blague` - Raconter une blague\n\n" +
              "**Personnalités :**\n• `!personnalite humoriste` - Mode blagueur\n• `!personnalite philosophe` - Mode réflexion",
            0x00ff00
          );
          break;
      }

      await interaction.followUp({ embeds: [embed], ephemeral: true });
    }
  } catch (error) {
    console.error("Erreur interaction:", error);
    await interaction.followUp({
      content: "❌ Erreur lors de l'exécution de la commande.",
      ephemeral: true,
    });
  }
});

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

    // Créer un embed avec la réponse
    const embed = createEmbed("🤖 Réponse IA", response, 0x0099ff);
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

// Connexion du bot avec le token Discord
client.login(process.env.DISCORD_TOKEN);
