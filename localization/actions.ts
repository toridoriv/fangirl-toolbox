import "@global";
import packageJson from "@package" assert { type: "json" };
import { Template } from "toolkit";

const TAGS = ["{{", "}}"] as ["{{", "}}"];
const TEMPLATES = {
  const: new Template(`export const {{name}} = {\n  {{properties}}\n};`, TAGS),
  enum: new Template(`export enum {{name}} {\n  {{enums}}\n}`, TAGS),
  enumItem: new Template(`{key} = "{value}",`),
  obj: new Template(
    "[{{name}}.{{main_key}}]: Object.freeze({\n    code: LanguageCode.{{code_key}},\n    name: LanguageName.{{name_key}},\n  }),",
    TAGS
  ),
};

function generateEnums() {
  const sorted = packageJson.config.localization.languages.sort((a, b) =>
    a.code.localeCompare(b.code)
  );
  const codeEnums: string[] = [];
  const nameEnums: string[] = [];
  const byCodeObjs: string[] = [];
  const byNameObjs: string[] = [];

  for (const lang of sorted) {
    const { code, name } = lang;
    const upperCode = code.toUpperCase();
    const upperName = name.toUpperCase();

    codeEnums.push(TEMPLATES.enumItem.render({ key: upperCode, value: code }));
    nameEnums.push(TEMPLATES.enumItem.render({ key: upperName, value: name }));
    byCodeObjs.push(
      TEMPLATES.obj.render({
        name: "LanguageCode",
        main_key: upperCode,
        code_key: upperCode,
        name_key: upperName,
      })
    );
    byNameObjs.push(
      TEMPLATES.obj.render({
        name: "LanguageName",
        main_key: upperName,
        code_key: upperCode,
        name_key: upperName,
      })
    );
  }

  const content = [
    [
      "/** Represents the code of a language available in the application. */",
      TEMPLATES.enum.render({
        name: "LanguageCode",
        enums: codeEnums.join("\n  "),
      }),
    ].join("\n"),
    [
      "/** Represents the name of a language available in the application. */",
      TEMPLATES.enum.render({
        name: "LanguageName",
        enums: nameEnums.join("\n  "),
      }),
    ].join("\n"),
    [
      "/** Mapping between language codes and their corresponding language information. */",
      TEMPLATES.enum.render({
        name: "LANGUAGE_BY_CODE",
        properties: byCodeObjs.join("\n  "),
      }),
    ].join("\n"),
    [
      "/** Mapping between language names and their corresponding language information. */",
      TEMPLATES.enum.render({
        name: "LANGUAGE_BY_NAME",
        properties: byNameObjs.join("\n  "),
      }),
    ].join("\n"),
  ].join("\n\n");

  const path = import.meta.resolve("./enums.ts").replace("file://", "");
  Deno.writeTextFileSync(path, content);
}

actions.execute({ "generate-enums": generateEnums });
