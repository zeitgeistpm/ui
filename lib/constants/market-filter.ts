import capitalize from "lodash-es/capitalize";
import {
  MarketCurrencyFilter,
  MarketOrderByOption,
  MarketsListQuery,
  MarketsOrderBy,
  MarketStatusFilter,
  MarketTagFilter,
} from "lib/types/market-filter";
import { defaultTags, marketStatuses } from "./markets";
import { allCurrencies } from ".";

export const filterTypes = ["status", "tag", "currency"] as const;

export const marketStatusFilterOptions: MarketStatusFilter[] =
  marketStatuses.map((status) => ({
    type: "status",
    value: status,
    label: status,
  }));

export const categoryImages: Record<typeof defaultTags[number], string> = {
  Sports: "/category/sports.png",
  Politics: "/category/politics.png",
  Technology: "/category/technology.png",
  Crypto: "/category/crypto.png",
  Science: "/category/science.png",
  "E-Sports": "/category/e-sports.png",
  Zeitgeist: "/category/zeitgeist.png",
  Dotsama: "/category/dotsama.png",
  News: "/category/news.png",
} as const;

export const currencyImages: Record<typeof allCurrencies[number], string> = {
  ZTG: "/currencies/ztg.jpg",
  // "aUSD": "/currencies/ausd.jpg
} as const;

export const marketTagFilterOptions: MarketTagFilter[] = defaultTags.map(
  (tag) => ({
    type: "tag",
    value: tag,
    label: tag,
    imageUrl: categoryImages[tag],
  }),
);

export const marketCurrencyFilterOptions: MarketCurrencyFilter[] =
  allCurrencies.map((currency) => ({
    type: "currency",
    value: capitalize(currency),
    label: currency,
    imageUrl: currencyImages[currency],
  }));

export const defaultMarketFilters = [
  ...marketStatusFilterOptions.filter((f) => f.value === "Active"),
];

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
