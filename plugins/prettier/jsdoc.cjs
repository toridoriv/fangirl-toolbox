const { get, override } = require("@homer0/prettier-plugin-jsdoc/src/fns/app");
const { loadFns } = require("@homer0/prettier-plugin-jsdoc/src/loader");
const { getPlugin } = require("@homer0/prettier-plugin-jsdoc/src/fns/getPlugin");
const { splitText } = require("@homer0/prettier-plugin-jsdoc/src/fns/splitText");

loadFns();

function customSplitText(text, length) {
  if (text.includes("@link")) {
    return text.split("\n");
  }

  return splitText(text, length);
}

override(splitText, customSplitText);

module.exports = get(getPlugin)();
