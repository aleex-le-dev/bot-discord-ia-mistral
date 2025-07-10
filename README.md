# Bot Discord IA avec Mistral

Bot Discord intelligent qui répond automatiquement aux messages en utilisant l'API Mistral.

## 🚀 Démarrage rapide

### Option 1 : Double-clic (Recommandé)

- Double-clique sur `start.bat` pour lancer le bot
- Le bot restera actif tant que la fenêtre est ouverte

### Option 2 : Arrière-plan

- Double-clique sur `start-background.bat`
- Le bot tourne en arrière-plan
- Tu peux fermer la fenêtre, le bot continue

### Option 3 : Terminal

```bash
node index.js
```

## ⚙️ Configuration

Modifie `config.js` pour personnaliser :

- **Modèle IA** : `mistral-small-latest` (rapide) ou `mistral-large-latest` (plus précis)
- **Auto-réponse** : `true` = répond à tous les messages, `false` = seulement avec `!ia `
- **Prompt système** : Personnalise le comportement de l'IA
- **Messages** : Change les textes d'erreur et de chargement

## 🔧 Variables d'environnement

Dans le fichier `.env` :

```
DISCORD_TOKEN=ton_token_discord
MISTRAL_API_KEY=ta_cle_mistral
```

## 📝 Utilisation

- **Auto-réponse** : Tape simplement ton message, le bot répond
- **Commande** : Utilise `!ia ` + ta question
- **Loading** : Le bot affiche "🤔 L'IA réfléchit..." pendant qu'il traite

## 🛑 Arrêt du bot

- **Fenêtre ouverte** : Appuie sur `Ctrl+C`
- **Arrière-plan** : Ferme la fenêtre de commande ou redémarre ton PC

## 📁 Structure des fichiers

```
bot discord/
├── index.js          # Code principal du bot
├── config.js         # Configuration
├── .env              # Variables d'environnement
├── start.bat         # Lancement simple
├── start-background.bat # Lancement arrière-plan
└── package.json      # Dépendances
```
