import { MarketMetadata } from "@zeitgeistpm/sdk-next";
import { Unpacked } from "@zeitgeistpm/utility/dist/array";
import { Answers } from "../types/form";

export const tickersFor = (answers: Answers): MarketMetadata["categories"] => {
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

export const createCategoricalTickers = (
  answers: string[],
): { [key: string]: string } => {
  const tickers: { [key: string]: string } = {};
  const usedTickers: { [key: string]: boolean } = {};

  for (const description of answers) {
    const words = description.split(" ");

    // Generate initial ticker
    let ticker = (
      words[0].slice(0, 3) + words[words.length - 1].slice(0, 3)
    ).toUpperCase();

    // Check if ticker already exists or is a reserved keyword
    if (usedTickers[ticker]) {
      let count = 1;
      let newTicker = ticker;
      while (usedTickers[newTicker]) {
        count++;
        newTicker = ticker + String(count);
      }
      ticker = newTicker;
    }

    usedTickers[ticker] = true;
    tickers[description] = ticker;
  }

  return tickers;
};
