import { range } from "lodash-es";
import { union } from "lib/types/union";
import { prodTags } from "./markets";

type T = typeof prodTags | "untagged";

const tags = [...prodTags, "untagged"] as const;

export const CATEGORY_IMAGES = union<(typeof tags)[any]>().exhaustAsRecord({
  Sports: range(1, 6).map((i) => `/categories/sports/${i}.png`),
  Politics: range(1, 5).map((i) => `/categories/politics/${i}.png`),
  Technology: range(1, 5).map((i) => `/categories/tech/${i}.png`),
  Crypto: range(1, 5).map((i) => `/categories/crypto/${i}.png`),
  Science: range(1, 5).map((i) => `/categories/science/${i}.png`),
  "E-Sports": range(1, 6).map((i) => `/categories/esports/${i}.png`),
  News: range(1, 6).map((i) => `/categories/news/${i}.png`),
  Dotsama: range(1, 2).map((i) => `/categories/dotsama/${i}.png`),
  Zeitgeist: range(1, 2).map((i) => `/categories/zeitgeist/${i}.png`),
  untagged: range(1, 2).map((i) => `/categories/zeitgeist/${i}.png`),
});

console.log(CATEGORY_IMAGES);
