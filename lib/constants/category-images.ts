import { union } from "lib/types/union";
import { prodTags } from "./markets";

type T = typeof prodTags | "untagged";

const tags = [...prodTags, "untagged"] as const;

export const CATEGORY_IMAGES = union<(typeof tags)[any]>().exhaustAsRecord({
  Sports: ["/category/sports.png"],
  Politics: ["/category/politics.png"],
  Technology: ["/category/technology.png"],
  Crypto: ["/category/crypto.png"],
  Science: ["/category/science.png"],
  "E-Sports": ["/category/e-sports.png"],
  News: ["/category/news.png"],
  Dotsama: ["/category/dotsama.png"],
  Zeitgeist: ["/category/zeitgeist.png"],
  untagged: ["/category/zeitgeist.png"],
});
