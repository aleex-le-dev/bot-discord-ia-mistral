require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
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

// Fonction pour gérer les commandes spéciales
async function handleSpecialCommands(message) {
  const content = message.content.toLowerCase();

  // Commande personnalité
  if (content.startsWith("!personnalite")) {
    const personality = content.split(" ")[1];
    if (features.personalities[personality]) {
      userPersonalities.set(message.author.id, personality);
      const embed = createEmbed(
        "🎭 Personnalité changée !",
        `Tu es maintenant en mode **${personality}** !\n\nPersonnalités disponibles :\n${Object.keys(
          features.personalities
        )
          .map((p) => `• ${p}`)
          .join("\n")}`,
        0xff6b6b
      );
      message.reply({ embeds: [embed] });
      return true;
    }
  }

  // Commande blague
  if (content === "!blague") {
    const response = await callMistralAPI(
      "Raconte-moi une blague drôle et originale en français",
      "humoriste"
    );
    const embed = createEmbed("🎭 Blague du jour", response, 0xffd93d);
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
      `*"${response}"*`,
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
    const embed = createEmbed("💭 Débat philosophique", response, 0x9b59b6);
    message.reply({ embeds: [embed] });
    return true;
  }

  // Commande quiz
  if (content === "!quiz") {
    const response = await callMistralAPI(
      "Crée un quiz amusant avec 3 questions et leurs réponses. Format : Question 1: [question] Réponse: [réponse]",
      "scientifique"
    );
    const embed = createEmbed("🎮 Quiz du jour", response, 0x3498db);
    message.reply({ embeds: [embed] });
    return true;
  }

  // Commande histoire
  if (content === "!histoire") {
    const response = await callMistralAPI(
      "Raconte-moi une histoire courte et captivante (max 200 mots)",
      "default"
    );
    const embed = createEmbed("📖 Histoire du jour", response, 0xe74c3c);
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
    const embed = createEmbed("📝 Poème personnalisé", response, 0xf39c12);
    message.reply({ embeds: [embed] });
    return true;
  }

  // Commande challenge
  if (content === "!challenge") {
    const response = await callMistralAPI(
      "Propose un défi créatif amusant pour aujourd'hui",
      "coach"
    );
    const embed = createEmbed("🎨 Défi créatif", response, 0xe91e63);
    message.reply({ embeds: [embed] });
    return true;
  }

  // Commande meme
  if (content === "!meme") {
    const response = await callMistralAPI(
      "Génère une idée de meme drôle et originale",
      "humoriste"
    );
    const embed = createEmbed("😂 Idée de meme", response, 0x1abc9c);
    message.reply({ embeds: [embed] });
    return true;
  }

  // Commande aide
  if (content === "!aide") {
    const embed = createEmbed(
      "🤖 Commandes disponibles",
      `**🎭 Personnalités :**\n${Object.keys(features.personalities)
        .map((p) => `• ${p}`)
        .join("\n")}\n\n` +
        `**🎮 Commandes spéciales :**\n${Object.keys(features.commands)
          .map((cmd) => `• ${cmd}`)
          .join("\n")}\n\n` +
        `**🎨 Créatif :**\n${Object.keys(features.creative)
          .map((cmd) => `• ${cmd}`)
          .join("\n")}\n\n` +
        `**💡 Utilisation :**\n• Tape simplement ton message pour discuter\n• Utilise les commandes pour des fonctionnalités spéciales`,
      0x00ff00
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
