import { MarketMetadata } from "@zeitgeistpm/sdk-next";
import { Answers } from "../types/form";

/**
 * Generate tickers and appropriate names for answers form data.
 */
export const tickersForAnswers = (
  answers: Answers,
): MarketMetadata["categories"] => {
  let metadataCategories: MarketMetadata["categories"] = [];

  if (answers.type === "scalar") {
    metadataCategories = [
      { name: "Short", ticker: "SRT" },
      { name: "Long", ticker: "LNG" },
    ];
  } else if (answers.type === "yes/no") {
    metadataCategories = [
      { name: "Yes", ticker: "YES" },
      { name: "No", ticker: "NO" },
    ];
  } else {
    const tickers = createCategoricalTickers(answers.answers as string[]);
    metadataCategories = answers.answers.map(
      (answer: string, index: number) => ({
        name: answer,
        ticker: tickers[answer],
      }),
    );
  }

  return metadataCategories;
};

/**
 * Generate appropriate tickers for categorical answers.
 */
export const createCategoricalTickers = (
  strings: string[],
): Record<string, string> => {
  const tokens: Record<string, string> = {};

  for (const str of strings) {
    const words = str.split(" ");
    let token = "";

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const truncatedWord = word.slice(0, 3);

      if (i === words.length - 1) {
        token += truncatedWord.toUpperCase();
      } else {
        token += truncatedWord;
      }
    }

    tokens[str] = token;
  }

  return tokens;
};

const input = ["foo bar", "foo bar baz", "foo bar baz qux"];

const output = {
  "foo bar": "FOOBAR",
  "foo bar baz": "FOOBAZ",
  "foo bar baz qux": "FOOQUX",
};
