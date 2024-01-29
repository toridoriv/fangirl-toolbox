const { get, override } = require("@homer0/prettier-plugin-jsdoc/src/fns/app");
const { loadFns } = require("@homer0/prettier-plugin-jsdoc/src/loader");
const { getPlugin } = require("@homer0/prettier-plugin-jsdoc/src/fns/getPlugin");
const { splitText } = require("@homer0/prettier-plugin-jsdoc/src/fns/splitText");
// const { renderTagsInlines } = require("@homer0/prettier-plugin-jsdoc/src/fns/render");
// const utils = require("@homer0/prettier-plugin-jsdoc/src/fns/utils");
// const { sortTags } = require("@homer0/prettier-plugin-jsdoc/src/fns/sortTags");
// const formatTags = require("@homer0/prettier-plugin-jsdoc/src/fns/formatTags");

loadFns();

function customSplitText(text, length) {
  if (text.includes("@link")) {
    return text.split("\n");
  }

  return splitText(text, length);
}

// function customRenderTagsInlines(width, options, tags) {
//   const typedefs = tags.filter(isTypeDef);
//   const rest = tags.filter(isNotTypeDef);

//   return [...typedefs.map(renderTag), ...renderTagsInlines(width, options, rest)];
// }

// function customSortTags(tags, options) {
//   return function (tags) {
//     console.log(tags[0]);
//     return tags;
//   };
// }

// function customGetIndexOrFallback(list, fallback, item) {
//   console.log({ list, item });
//   if (item === "see") {
//     return () => 0;
//   }

//   return () => utils.getIndexOrFallback(list.reverse(), 100, item || "other");
// }

// function customFormatTags(tags, options) {
//   return (tags) => {
//     console.log("customFormatTags", { result: formatTags.formatTags(tags, options) });
//     return formatTags.formatTags(tags, options);
//   };
// }

// function isTypeDef(tag) {
//   return tag.tag === "typedef" && tag.source.length <= 2;
// }

// function isNotTypeDef(tag) {
//   return !isTypeDef(tag);
// }

// function renderTag(tag) {
//   return `@${tag.tag} {${tag.type}} ${tag.name}`;
// }

override(splitText, customSplitText);
// override(renderTagsInlines, customRenderTagsInlines);
// // override(sortTags, customSortTags);
// override(utils.getIndexOrFallback, customGetIndexOrFallback);
// // override(formatTags.formatTags, customFormatTags);

module.exports = get(getPlugin)();
