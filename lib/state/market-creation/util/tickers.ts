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
  const wordMap: Record<string, number> = {};

  for (const str of strings) {
    let token = "";
    const words = str.split(" ");

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const truncatedWord = word.slice(0, 4);
      const key = i === 0 ? truncatedWord : `${words[i - 1]}${truncatedWord}`;

      if (wordMap.hasOwnProperty(key)) {
        const count = wordMap[key] + 1;
        wordMap[key] = count;
        token += `${key}${count}`;
      } else {
        wordMap[key] = 0;
        token += truncatedWord;
      }

      if (token.length >= 4) {
        break;
      }
    }

    tokens[str] = token.toUpperCase();
  }

  return tokens;
};
