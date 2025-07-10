// Configuration du bot Discord avec IA
module.exports = {
  // Configuration Discord
  discord: {
    intents: ["Guilds", "GuildMessages", "MessageContent"],
  },

  // Configuration Mistral AI
  mistral: {
    model: "mistral-small-latest", // Modèle plus léger pour éviter les erreurs 429
    maxTokens: 400, // Augmenter légèrement pour les commandes spéciales
    temperature: 0.8, // Plus créatif pour les personnalités
    systemPrompt:
      "Tu es un assistant IA français. Tu dois toujours répondre en français, peu importe la langue de la question posée. Sois naturel, amical et utile dans tes réponses. Réponds de manière concise.",
  },

  // Configuration des commandes
  commands: {
    prefix: "!ia ",
    autoReply: true, // Répond automatiquement à tous les messages
    ignoreCommands: ["!help", "!ping", "!status"], // Commandes à ignorer
  },

  // Messages d'erreur et de chargement
  messages: {
    error: "❌ Erreur lors de l'appel à l'IA. Vérifiez votre clé API.",
    connected: "Bot connecté en tant que",
    ready: "Bot prêt à répondre !",
    loading: "🤔 L'IA réfléchit...",
    rateLimit: "⚠️ Trop de requêtes, attendez un moment...",
    welcome:
      "🎉 Bienvenue sur le serveur ! Utilise `!aide` pour voir toutes les commandes disponibles.",
  },

  // Configuration des embeds
  embeds: {
    colors: {
      default: 0x0099ff,
      success: 0x00ff00,
      error: 0xff0000,
      warning: 0xffff00,
      info: 0x00ffff,
      humor: 0xffd93d,
      philosophy: 0x9b59b6,
      creative: 0xe91e63,
      science: 0x3498db,
    },
  },
};
