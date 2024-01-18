const { get, override } = require("@homer0/prettier-plugin-jsdoc/src/fns/app");
const { loadFns } = require("@homer0/prettier-plugin-jsdoc/src/loader");
const { getPlugin } = require("@homer0/prettier-plugin-jsdoc/src/fns/getPlugin");
const { splitText } = require("@homer0/prettier-plugin-jsdoc/src/fns/splitText");
const { renderTagsInlines } = require("@homer0/prettier-plugin-jsdoc/src/fns/render");

loadFns();

function customSplitText(text, length) {
  if (text.includes("@link")) {
    return text.split("\n");
  }

  return splitText(text, length);
}

function customRenderTagsInlines(width, options, tags) {
  const typedefs = tags.filter(isTypeDef);
  const rest = tags.filter(isNotTypeDef);

  return [...typedefs.map(renderTag), ...renderTagsInlines(width, options, rest)];
}

function isTypeDef(tag) {
  return tag.tag === "typedef" && tag.source.length <= 2;
}

function isNotTypeDef(tag) {
  return !isTypeDef(tag);
}

function renderTag(tag) {
  return `@${tag.tag} {${tag.type}} ${tag.name}`;
}

override(splitText, customSplitText);
override(renderTagsInlines, customRenderTagsInlines);

module.exports = get(getPlugin)();
