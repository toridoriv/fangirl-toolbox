const jsdoc = require("./jsdoc.cjs");

module.exports = {
  ...jsdoc,
  options: {
    ...jsdoc.options,
  },
  parsers: {
    ...jsdoc.parsers,
    espree: {
      ...jsdoc.parsers.typescript,
      parse: async function parse(text, parsers, options) {
        const result = await jsdoc.parsers.typescript.parse(text, parsers, options);

        return result;
      },
    },
  },
};
