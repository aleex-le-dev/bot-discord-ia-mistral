require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const https = require("https");
const config = require("./config");

// Configuration du client Discord avec les permissions nécessaires
const client = new Client({
  intents: config.discord.intents.map((intent) => GatewayIntentBits[intent]),
});

// Configuration de l'API Mistral
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

// Événement de connexion réussie
client.once("ready", () => {
  console.log(`${config.messages.connected} ${client.user.tag}`);
  console.log(config.messages.ready);
});

// Fonction pour appeler l'API Mistral avec https natif
function callMistralAPI(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: config.mistral.model,
      messages: [
        {
          role: "system",
          content: config.mistral.systemPrompt,
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
    // Appel à l'API Mistral
    const response = await callMistralAPI(prompt);

    // Supprimer le message de chargement et répondre avec la réponse de l'IA
    await loadingMessage.delete();
    message.reply(response);
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
