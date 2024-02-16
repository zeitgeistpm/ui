import {
  MarketCurrencyFilter,
  MarketOrderByOption,
  MarketsListQuery,
  MarketsOrderBy,
  MarketStatusFilter,
  MarketTagFilter,
} from "lib/types/market-filter";
import { FOREIGN_ASSET_METADATA } from "./foreign-asset";
import { defaultTags, marketStatuses } from "./markets";
import { CATEGORIES } from "components/front-page/PopularCategories";

export const filterTypes = ["status", "tag", "currency"] as const;

export const marketStatusFilterOptions: MarketStatusFilter[] =
  marketStatuses.map((status) => ({
    type: "status",
    value: status,
    label: status,
  }));

export const categoryImages: Record<
  (typeof CATEGORIES)[number]["name"],
  string
> = {
  Sports: "/category/sports.png",
  Politics: "/category/politics.png",
  Technology: "/category/technology.png",
  Crypto: "/category/crypto.png",
  Science: "/category/science.png",
  Zeitgeist: "/category/zeitgeist.png",
  Dotsama: "/category/dotsama.png",
  News: "/category/news.png",
  Entertainment: "/category/entertainment.png",
  Finance: "/category/finance.png",
} as const;

export const marketTagFilterOptions: MarketTagFilter[] = defaultTags.map(
  (tag) => ({
    type: "tag" as const,
    value: tag,
    label: tag,
    imageUrl: categoryImages[tag],
  }),
);

const createCurrencyFilters = () => {
  const filters: MarketCurrencyFilter[] = [];
  for (const [id, asset] of Object.entries(FOREIGN_ASSET_METADATA)) {
    filters.push({
      type: "currency",
      value: `{"foreignAsset":${id}}`,
      label: asset.tokenSymbol,
      imageUrl: asset.image,
    });
  }

  filters.push({
    type: "currency",
    value: "Ztg",
    label: "ZTG",
    imageUrl: "/currencies/ztg.jpg",
  });

  return filters;
};

export const marketCurrencyFilterOptions: MarketCurrencyFilter[] =
  createCurrencyFilters();

export const defaultMarketsQueryState: MarketsListQuery = {
  filters: {
    status: ["Active"],
    tag: [],
    currency: [],
  },
  ordering: MarketsOrderBy.MostVolume,
  liquidityOnly: true,
};

export const marketsOrderByOptions: MarketOrderByOption[] = Object.values(
  MarketsOrderBy,
).map((value) => {
  return { value, label: value };
});
