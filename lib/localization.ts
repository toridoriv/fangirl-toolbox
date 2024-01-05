/**
 * Language class represents a language with code, name and native name.
 * It has two static methods to create a Language instance from code or name.
 */
export class Language<
  Code extends string = string,
  Name extends string = string
> {
  /**
   * Gets a Language instance by its language code.
   *
   * @param code - The language code.
   * @returns The Language instance for the given code, or a new Language instance with default values if not found.
   */
  declare static fromCode: <Code extends string>(
    code: Code
  ) => Code extends LanguageCode ? GetLanguageByCode<Code> : Language<Code>;

  /**
   * Gets a Language instance by language name.
   *
   * @param name - The language name
   * @returns The Language instance for the given name if found, otherwise a new Language instance with the name set
   */
  declare static fromName: <Name extends string>(
    name: Name
  ) => Name extends LanguageName
    ? GetLanguageByName<Name>
    : Language<string, Name>;

  /**
   * Creates a new `Language` object.
   *
   * @param code - The language code.
   * @param name - The language name.
   * @param nativeName - The language's name in its native script.
   */
  constructor(
    readonly code: Code,
    readonly name: Name,
    readonly nativeName: string
  ) {}
}

/**
 * Resolves to the appropriate language type based on the input type (code or name).
 */
export type GetLanguage<T extends string> = T extends LanguageCode
  ? GetLanguageByCode<T>
  : T extends LanguageName
  ? GetLanguageByName<T>
  : Language;

/**
 * Object containing `Language` instances indexed by their language codes.
 */
export const LANGUAGE_BY_CODE = Object.freeze({
  en: new Language("en", "English", "English"),
  es: new Language("es", "Spanish", "Español"),
  fr: new Language("fr", "French", "Français"),
  it: new Language("it", "Italian", "Italiano"),
  ja: new Language("ja", "Japanese", "日本語"),
  ko: new Language("ko", "Korean", "한국어"),
  pt: new Language("pt", "Portuguese", "Português"),
  ru: new Language("ru", "Russian", "Русский"),
  th: new Language("th", "Thai", "ไทย"),
  zh: new Language("zh", "Chinese", "中文"),
});

/**
 * Union of all available language codes.
 */
export type LanguageCode = keyof typeof LANGUAGE_BY_CODE;

/**
 * Resolves to the specific language type based on the input language code.
 */
export type GetLanguageByCode<C extends LanguageCode> =
  (typeof LANGUAGE_BY_CODE)[C];

/**
 * Object containing `Language` instances indexed by their language names.
 */
export const LANGUAGE_BY_NAME = Object.freeze({
  [LANGUAGE_BY_CODE.en.name]: LANGUAGE_BY_CODE.en,
  [LANGUAGE_BY_CODE.es.name]: LANGUAGE_BY_CODE.es,
  [LANGUAGE_BY_CODE.fr.name]: LANGUAGE_BY_CODE.fr,
  [LANGUAGE_BY_CODE.it.name]: LANGUAGE_BY_CODE.it,
  [LANGUAGE_BY_CODE.ja.name]: LANGUAGE_BY_CODE.ja,
  [LANGUAGE_BY_CODE.ko.name]: LANGUAGE_BY_CODE.ko,
  [LANGUAGE_BY_CODE.pt.name]: LANGUAGE_BY_CODE.pt,
  [LANGUAGE_BY_CODE.ru.name]: LANGUAGE_BY_CODE.ru,
  [LANGUAGE_BY_CODE.th.name]: LANGUAGE_BY_CODE.th,
  [LANGUAGE_BY_CODE.zh.name]: LANGUAGE_BY_CODE.zh,
});

/**
 * Union of all language names.
 */
export type LanguageName = keyof typeof LANGUAGE_BY_NAME;

/**
 * Resolves to the language code based on the input language name.
 */
export type GetLanguageByName<N extends LanguageName> =
  keyof (typeof LANGUAGE_BY_NAME)[N];

Language.fromCode = function fromCode(code) {
  return code in LANGUAGE_BY_CODE
    ? LANGUAGE_BY_CODE[code as LanguageCode]
    : new Language(code, "", "");
};

Language.fromName = function fromName(name) {
  return name in LANGUAGE_BY_NAME
    ? LANGUAGE_BY_NAME[name as LanguageName]
    : new Language("", name, "");
};
