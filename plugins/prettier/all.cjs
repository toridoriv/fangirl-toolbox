const sortImports = require("@trivago/prettier-plugin-sort-imports");
const jsdoc = require("./jsdoc.cjs");

module.exports = {
  ...jsdoc,
  options: {
    ...sortImports.options,
    ...jsdoc.options,
  },
  parsers: {
    ...jsdoc.parsers,
    typescript: {
      ...jsdoc.parsers.typescript,
      parse: async function parse(text, parsers, options) {
        const result = await jsdoc.parsers.typescript.parse(text, parsers, options);

        return result;
      },
      preprocess: sortImports.parsers.typescript.preprocess,
    },
  },
};
