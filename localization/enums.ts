/** Represents the code of a language available in the application. */
export enum LanguageCode {
  EN = "en",
  ES = "es",
  FR = "fr",
  IT = "it",
  JA = "ja",
  KO = "ko",
  PT = "pt",
  RU = "ru",
  XX = "xx",
  ZH = "zh",
}

/** Represents the name of a language available in the application. */
export enum LanguageName {
  ENGLISH = "English",
  SPANISH = "Spanish",
  FRENCH = "French",
  ITALIAN = "Italian",
  JAPANESE = "Japanese",
  KOREAN = "Korean",
  PORTUGUESE = "Portuguese",
  RUSSIAN = "Russian",
  UNDETERMINED = "Undetermined",
  CHINESE = "Chinese",
}

/** Mapping between language codes and their corresponding language information. */
export const LANGUAGE_BY_CODE = {
  [LanguageCode.EN]: Object.freeze({
    code: LanguageCode.EN,
    name: LanguageName.ENGLISH,
  }),
  [LanguageCode.ES]: Object.freeze({
    code: LanguageCode.ES,
    name: LanguageName.SPANISH,
  }),
  [LanguageCode.FR]: Object.freeze({
    code: LanguageCode.FR,
    name: LanguageName.FRENCH,
  }),
  [LanguageCode.IT]: Object.freeze({
    code: LanguageCode.IT,
    name: LanguageName.ITALIAN,
  }),
  [LanguageCode.JA]: Object.freeze({
    code: LanguageCode.JA,
    name: LanguageName.JAPANESE,
  }),
  [LanguageCode.KO]: Object.freeze({
    code: LanguageCode.KO,
    name: LanguageName.KOREAN,
  }),
  [LanguageCode.PT]: Object.freeze({
    code: LanguageCode.PT,
    name: LanguageName.PORTUGUESE,
  }),
  [LanguageCode.RU]: Object.freeze({
    code: LanguageCode.RU,
    name: LanguageName.RUSSIAN,
  }),
  [LanguageCode.XX]: Object.freeze({
    code: LanguageCode.XX,
    name: LanguageName.UNDETERMINED,
  }),
  [LanguageCode.ZH]: Object.freeze({
    code: LanguageCode.ZH,
    name: LanguageName.CHINESE,
  }),
};

/** Mapping between language names and their corresponding language information. */
export const LANGUAGE_BY_NAME = {
  [LanguageName.ENGLISH]: Object.freeze({
    code: LanguageCode.EN,
    name: LanguageName.ENGLISH,
  }),
  [LanguageName.SPANISH]: Object.freeze({
    code: LanguageCode.ES,
    name: LanguageName.SPANISH,
  }),
  [LanguageName.FRENCH]: Object.freeze({
    code: LanguageCode.FR,
    name: LanguageName.FRENCH,
  }),
  [LanguageName.ITALIAN]: Object.freeze({
    code: LanguageCode.IT,
    name: LanguageName.ITALIAN,
  }),
  [LanguageName.JAPANESE]: Object.freeze({
    code: LanguageCode.JA,
    name: LanguageName.JAPANESE,
  }),
  [LanguageName.KOREAN]: Object.freeze({
    code: LanguageCode.KO,
    name: LanguageName.KOREAN,
  }),
  [LanguageName.PORTUGUESE]: Object.freeze({
    code: LanguageCode.PT,
    name: LanguageName.PORTUGUESE,
  }),
  [LanguageName.RUSSIAN]: Object.freeze({
    code: LanguageCode.RU,
    name: LanguageName.RUSSIAN,
  }),
  [LanguageName.UNDETERMINED]: Object.freeze({
    code: LanguageCode.XX,
    name: LanguageName.UNDETERMINED,
  }),
  [LanguageName.CHINESE]: Object.freeze({
    code: LanguageCode.ZH,
    name: LanguageName.CHINESE,
  }),
};