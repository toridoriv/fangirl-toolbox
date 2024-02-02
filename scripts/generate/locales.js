#!/usr/bin/env node --enable-source-maps --experimental-specifier-resolution=node
// @ts-check

import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";

import { format, resolveConfig } from "prettier";
import ts from "typescript";

const require = createRequire(import.meta.url);
const packageJson = require("../../package.json");
const { factory } = ts;
const resultFile = ts.createSourceFile(
  packageJson.config.localization.file,
  "",
  ts.ScriptTarget.Latest,
);
const nodes = [
  createConstObject(
    "LANGUAGE_CODE",
    packageJson.config.localization.languages
      .map((e) => e.code)
      .map(createEnumLikeKeyValue),
    "Represents the code of a language available in the application.",
  ),
  createConstObject(
    "LANGUAGE_NAME",
    packageJson.config.localization.languages
      .map((e) => e.name)
      .map(createEnumLikeKeyValue),
    "Represents the name of a language available in the application.",
  ),
  createConstObject(
    "LANGUAGE_BY_CODE",
    packageJson.config.localization.languages.map(createInnerObject.bind(null, "code")),
    "Mapping between language codes and their corresponding language information.",
  ),
  createConstObject(
    "LANGUAGE_BY_NAME",
    packageJson.config.localization.languages.map(createInnerObject.bind(null, "name")),
    "Mapping between language names and their corresponding language information.",
  ),
];
const result = nodes.map(toString.bind(null, resultFile));
const prettierOptions = await resolveConfig(packageJson.config.localization.file);

if (!prettierOptions) {
  throw new Error("Unable to load prettier config.");
}

const content = await format(result.join("\n\n"), prettierOptions);

writeFileSync(packageJson.config.localization.file, content, "utf-8");

/**
 * @param {ts.Node} node
 * @param {ts.SourceFile} file
 * @returns
 */
function toString(file, node) {
  const printer = ts.createPrinter({
    removeComments: false,
    omitTrailingSemicolon: false,
    noEmitHelpers: true,
  });

  return Array.isArray(node)
    ? node.map(toString.bind(null, file)).join("\n")
    : printer.printNode(ts.EmitHint.Unspecified, node, file);
}

/**
 * @param {string} name
 * @param {ts.ObjectLiteralElementLike[]} properties
 * @param {string} [description]
 * @returns
 */
function createConstObject(name, properties, description = "") {
  const declaration = factory.createVariableDeclaration(
    name,
    undefined,
    undefined,
    createFreezedObject(properties),
  );

  const jsdoc = factory.createJSDocComment(description, [
    factory.createJSDocClassTag(factory.createIdentifier("readonly")),
  ]);
  const variable = factory.createVariableStatement(
    [factory.createToken(ts.SyntaxKind.ExportKeyword)],
    factory.createVariableDeclarationList([declaration], ts.NodeFlags.Const),
  );
  return [jsdoc, variable];
}

/**
 * @param {ts.ObjectLiteralElementLike[]} properties
 * @returns
 */
function createFreezedObject(properties) {
  return factory.createCallExpression(
    factory.createPropertyAccessExpression(
      factory.createIdentifier("Object"),
      factory.createIdentifier("freeze"),
    ),
    undefined,
    [factory.createObjectLiteralExpression(properties, true)],
  );
}

/**
 * @param {string} identifier
 * @returns {ts.ObjectLiteralElementLike}
 */
function createEnumLikeKeyValue(identifier) {
  return createPropertyAssignment(identifier.toUpperCase(), identifier);
}

/**
 * @param {string} key
 * @param {string} value
 */
function createPropertyAssignment(key, value) {
  return factory.createPropertyAssignment(key, factory.createStringLiteral(value));
}

/**
 * @param {'code' | 'name'} key
 * @param {(typeof packageJson.config.localization.languages)[number]} language
 * @returns
 */
function createInnerObject(key, language) {
  const identifier = key === "code" ? "LANGUAGE_CODE" : "LANGUAGE_NAME";

  return factory.createPropertyAssignment(
    factory.createComputedPropertyName(
      factory.createPropertyAccessExpression(
        factory.createIdentifier(identifier),
        factory.createIdentifier(language[key].toUpperCase()),
      ),
    ),
    createFreezedObject([
      createPropertyAssignment("code", language.code),
      createPropertyAssignment("name", language.name),
    ]),
  );
}
