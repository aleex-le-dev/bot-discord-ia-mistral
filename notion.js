// Module pour récupérer le contenu d'une page Notion
const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_TOKEN });

/**
 * Récupère le texte brut de tous les blocs d'une page Notion
 * @param {string} pageId - L'ID de la page Notion
 * @returns {Promise<string>} - Le texte concaténé de la page
 */
async function getNotionPageText(pageId) {
  let blocks = [];
  let cursor;
  do {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
    });
    blocks = blocks.concat(response.results);
    cursor = response.has_more ? response.next_cursor : null;
  } while (cursor);
  return blocks
    .map((block) => extractText(block))
    .filter(Boolean)
    .join("\n");
}

function extractText(block) {
  if (block.type === "paragraph" && block.paragraph.rich_text.length > 0) {
    return block.paragraph.rich_text.map((rt) => rt.plain_text).join("");
  }
  if (block.type === "heading_1" && block.heading_1.rich_text.length > 0) {
    return "# " + block.heading_1.rich_text.map((rt) => rt.plain_text).join("");
  }
  if (block.type === "heading_2" && block.heading_2.rich_text.length > 0) {
    return (
      "## " + block.heading_2.rich_text.map((rt) => rt.plain_text).join("")
    );
  }
  if (block.type === "heading_3" && block.heading_3.rich_text.length > 0) {
    return (
      "### " + block.heading_3.rich_text.map((rt) => rt.plain_text).join("")
    );
  }
  if (
    block.type === "bulleted_list_item" &&
    block.bulleted_list_item.rich_text.length > 0
  ) {
    return (
      "- " +
      block.bulleted_list_item.rich_text.map((rt) => rt.plain_text).join("")
    );
  }
  if (
    block.type === "numbered_list_item" &&
    block.numbered_list_item.rich_text.length > 0
  ) {
    return (
      "1. " +
      block.numbered_list_item.rich_text.map((rt) => rt.plain_text).join("")
    );
  }
  return "";
}

/**
 * Récupère et fusionne le texte de plusieurs pages Notion
 * @param {string[]} pageIds - Tableau d'IDs de pages Notion
 * @returns {Promise<string>} - Texte fusionné
 */
async function getMultiplePagesText(pageIds) {
  const allTexts = await Promise.all(pageIds.map(getNotionPageText));
  return allTexts.join("\n\n");
}

module.exports = { getNotionPageText, getMultiplePagesText };
