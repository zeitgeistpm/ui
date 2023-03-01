import {
  MarketCurrencyFilter,
  MarketOrderByOption,
  MarketsListQuery,
  MarketsOrderBy,
  MarketStatusFilter,
  MarketTagFilter,
} from "lib/types/market-filter";
import { defaultTags, marketStatuses } from "./markets";

export const filterTypes = ["status", "tag", "currency"] as const;

export const marketStatusFilterOptions: MarketStatusFilter[] =
  marketStatuses.map((status) => ({
    type: "status",
    value: status,
    label: status,
  }));

export const marketTagFilterOptions: MarketTagFilter[] = defaultTags.map(
  (tag) => ({
    type: "tag",
    value: tag,
    label: tag,
  }),
);

export const marketCurrencyFilterOptions: MarketCurrencyFilter[] = [
  {
    type: "currency",
    value: "Ztg",
    label: "ZTG",
  },
];

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

export const categoryImages = [
  { name: "Sports", imagePath: "/category/sports.png" },
  { name: "Politics", imagePath: "/category/politics.png" },
  { name: "Technology", imagePath: "/category/technology.png" },
  { name: "Crypto", imagePath: "/category/crypto.png" },
  { name: "Science", imagePath: "/category/science.png" },
  { name: "E-Sports", imagePath: "/category/e-sports.png" },
  { name: "Zeitgeist", imagePath: "/category/zeitgeist.png" },
  { name: "Dotsama", imagePath: "/category/dotsama.png" },
  { name: "News", imagePath: "/category/news.png" },
] as const;

export const currencyImages = [
  { name: "ZTG", imagePath: "/currencies/ztg.jpg" },
  { name: "aUSD", imagePath: "/currenies/ausd.jpg" },
];
