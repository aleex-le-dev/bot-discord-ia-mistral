// Configuration du bot Discord avec IA
module.exports = {
  discord: {
    intents: ["Guilds", "GuildMessages", "GuildMembers", "MessageContent"],
  },
  mistral: {
    model: "mistral-small-latest",
    maxTokens: 400,
    temperature: 0.8,
    // Prompt système strict : ne répondre qu'avec le contenu JSON
    systemPrompt:
      "Voici toute la base de connaissances à utiliser pour répondre à toutes les questions. Si la réponse n'est pas dans cette base, réponds uniquement \"Je ne sais pas.\". Donne une seule réponse, sans variantes, sans suggestions, sans reformulation, et n'invente rien. Réponds uniquement avec le texte exact du JSON.",
  },
  messages: {
    error: "❌ Erreur lors de l'appel à l'IA. Vérifiez votre clé API.",
    connected: "Bot connecté en tant que",
    ready: "Bot prêt à répondre !",
    loading: "🤔 L'IA réfléchit...",
    rateLimit: "⚠️ Trop de requêtes, attendez un moment...",
  },
};
