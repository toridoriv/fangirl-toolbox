/**
 * Represents the code of a language available in the application.
 *
 * @readonly
 */
export const LANGUAGE_CODE = Object.freeze({
  EN: "en",
  ES: "es",
  PT: "pt",
  IT: "it",
  FR: "fr",
  JA: "ja",
  ZH: "zh",
  KO: "ko",
  RU: "ru",
  XX: "xx",
});

/**
 * Represents the name of a language available in the application.
 *
 * @readonly
 */
export const LANGUAGE_NAME = Object.freeze({
  ENGLISH: "English",
  SPANISH: "Spanish",
  PORTUGUESE: "Portuguese",
  ITALIAN: "Italian",
  FRENCH: "French",
  JAPANESE: "Japanese",
  CHINESE: "Chinese",
  KOREAN: "Korean",
  RUSSIAN: "Russian",
  UNDETERMINED: "Undetermined",
});

/**
 * Mapping between language codes and their corresponding language information.
 *
 * @readonly
 */
export const LANGUAGE_BY_CODE = Object.freeze({
  [LANGUAGE_CODE.EN]: Object.freeze({
    code: "en",
    name: "English",
  }),
  [LANGUAGE_CODE.ES]: Object.freeze({
    code: "es",
    name: "Spanish",
  }),
  [LANGUAGE_CODE.PT]: Object.freeze({
    code: "pt",
    name: "Portuguese",
  }),
  [LANGUAGE_CODE.IT]: Object.freeze({
    code: "it",
    name: "Italian",
  }),
  [LANGUAGE_CODE.FR]: Object.freeze({
    code: "fr",
    name: "French",
  }),
  [LANGUAGE_CODE.JA]: Object.freeze({
    code: "ja",
    name: "Japanese",
  }),
  [LANGUAGE_CODE.ZH]: Object.freeze({
    code: "zh",
    name: "Chinese",
  }),
  [LANGUAGE_CODE.KO]: Object.freeze({
    code: "ko",
    name: "Korean",
  }),
  [LANGUAGE_CODE.RU]: Object.freeze({
    code: "ru",
    name: "Russian",
  }),
  [LANGUAGE_CODE.XX]: Object.freeze({
    code: "xx",
    name: "Undetermined",
  }),
});

/**
 * Mapping between language names and their corresponding language information.
 *
 * @readonly
 */
export const LANGUAGE_BY_NAME = Object.freeze({
  [LANGUAGE_NAME.ENGLISH]: Object.freeze({
    code: "en",
    name: "English",
  }),
  [LANGUAGE_NAME.SPANISH]: Object.freeze({
    code: "es",
    name: "Spanish",
  }),
  [LANGUAGE_NAME.PORTUGUESE]: Object.freeze({
    code: "pt",
    name: "Portuguese",
  }),
  [LANGUAGE_NAME.ITALIAN]: Object.freeze({
    code: "it",
    name: "Italian",
  }),
  [LANGUAGE_NAME.FRENCH]: Object.freeze({
    code: "fr",
    name: "French",
  }),
  [LANGUAGE_NAME.JAPANESE]: Object.freeze({
    code: "ja",
    name: "Japanese",
  }),
  [LANGUAGE_NAME.CHINESE]: Object.freeze({
    code: "zh",
    name: "Chinese",
  }),
  [LANGUAGE_NAME.KOREAN]: Object.freeze({
    code: "ko",
    name: "Korean",
  }),
  [LANGUAGE_NAME.RUSSIAN]: Object.freeze({
    code: "ru",
    name: "Russian",
  }),
  [LANGUAGE_NAME.UNDETERMINED]: Object.freeze({
    code: "xx",
    name: "Undetermined",
  }),
});
