// Script pour transformer un fichier texte en JSON
const fs = require("fs");

/**
 * Transforme un fichier texte en un fichier JSON
 * @param {string} inputPath - Chemin du fichier texte
 * @param {string} outputPath - Chemin du fichier JSON à générer
 */
function textToJson(inputPath, outputPath) {
  const text = fs.readFileSync(inputPath, "utf-8");
  const obj = { content: text };
  fs.writeFileSync(outputPath, JSON.stringify(obj, null, 2), "utf-8");
  console.log(`✅ Fichier JSON généré : ${outputPath}`);
}

// Exemple d'utilisation : node notion_to_json.js monfichier.txt sortie.json
if (require.main === module) {
  const [, , input, output] = process.argv;
  if (!input || !output) {
    console.log("Usage : node notion_to_json.js fichier.txt fichier.json");
    process.exit(1);
  }
  textToJson(input, output);
}

module.exports = { textToJson };
