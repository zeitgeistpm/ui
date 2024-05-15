import { union } from "lib/types/union";
import { prodTags } from "./markets";

const tags = [...prodTags, "untagged"] as const;

const generateImagePaths = (basePath: string, imageCount: number) => {
  return Array(imageCount)
    .fill(0)
    .map((_, index) => `${basePath}/${index + 1}.png`);
};
export const CATEGORY_IMAGES = union<(typeof tags)[number]>().exhaustAsRecord({
  Sports: generateImagePaths("/categories/sports", 5),
  Politics: generateImagePaths("/categories/politics", 4),
  Technology: generateImagePaths("/categories/tech", 4),
  Crypto: generateImagePaths("/categories/crypto", 4),
  Science: generateImagePaths("/categories/science", 4),
  News: generateImagePaths("/categories/news", 5),
  Dotsama: generateImagePaths("/categories/dotsama", 1),
  Zeitgeist: generateImagePaths("/categories/zeitgeist", 1),
  Finance: generateImagePaths("/categories/finance", 4),
  Entertainment: generateImagePaths("/categories/entertainment", 4),
  untagged: generateImagePaths("/categories/zeitgeist", 1),
});
