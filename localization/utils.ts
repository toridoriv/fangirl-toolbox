import {
  KuromojiAnalyzer,
  Kuroshiro,
  natural,
  toolkit,
  transliterateRussian,
} from "@dependencies";
import { LanguageCode } from "./enums.ts";

const kuroshiro = new Kuroshiro();
const wordTokenizer = new natural.WordTokenizer();

await kuroshiro.init(new KuromojiAnalyzer());

const RubyTemplate = new toolkit.Template(
  `<ruby>{original}<rp>(</rp><rt role="presentation" aria-hidden="true">{transliteration}</rt><rp>)</rp></ruby>`,
);

/**
 * Mapping of language codes to functions that can generate rich text annotations for
 * words in that language.
 */
export const RichTextByLanguageCode = {
  [LanguageCode.EN]: passthrough,
  [LanguageCode.ES]: passthrough,
  [LanguageCode.FR]: passthrough,
  [LanguageCode.IT]: passthrough,
  [LanguageCode.JA]: japanese,
  [LanguageCode.KO]: passthrough,
  [LanguageCode.PT]: passthrough,
  [LanguageCode.RU]: russian,
  [LanguageCode.ZH]: passthrough,
};

async function japanese(value: string) {
  const result = await kuroshiro.convert(value, {
    mode: "furigana",
    to: "hiragana",
  });

  return result.replaceAll("<rt>", `<rt role="presentation" aria-hidden="true">`);
}

function russian(value: string): string {
  const words = getUniqueWords(value).map(toRussianRubyTransliteration);
  let result = value;

  for (const word of words) {
    result = result.replaceAll(word.value, word.annotation);
  }

  return result;
}

// deno-lint-ignore no-unused-vars
function passthrough(value: string) {
  return "";
}

function getUniqueWords(value: string) {
  const result = wordTokenizer.tokenize(value);

  if (!result) {
    throw new Error(`There was an error getting the words from ${value}`);
  }

  return [...new Set(result)];
}

function toRussianRubyTransliteration(original: string) {
  const transliteration = transliterateRussian(original);

  return {
    value: original,
    annotation: RubyTemplate.render({ original, transliteration }),
  };
}
