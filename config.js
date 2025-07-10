// Configuration du bot Discord avec IA
module.exports = {
  // Configuration Discord
  discord: {
    intents: ["Guilds", "GuildMessages", "MessageContent"],
  },

  // Configuration Mistral AI
  mistral: {
    model: "mistral-small-latest", // Modèle plus léger pour éviter les erreurs 429
    maxTokens: 300, // Réduire les tokens pour plus de rapidité
    temperature: 0.7,
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
  },
};
