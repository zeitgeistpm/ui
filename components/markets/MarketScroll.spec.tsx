import { render } from "@testing-library/react";
import renderer from "react-test-renderer";
import MarketScroll from "./MarketScroll";
import "@testing-library/jest-dom";
import { IndexedMarketCardData } from "./market-card";

window.HTMLElement.prototype.scroll = function (
  opts: ScrollToOptions | number,
) {};

//@ts-ignore
window.ResizeObserver = function () {
  return { observe: () => {}, disconnect: () => {} };
};

const markets = [
  {
    marketId: 95,
    question: "Will ZTG be available for trading on a DEX by the end of May?",
    creation: "Advised",
    img: "QmYDFUevuzi1um7dS1KixdPtJGheZ4EVWavP6t643JQxUD",
    prediction: {
      name: "yes",
      price: 0.8073410184251611,
      percentage: 81,
    },
    volume: 1082.6691817611,
    baseAsset: "Ztg",
    outcomes: [
      {
        color: "#0E992D",
        name: "yes",
        ticker: "YES",
        assetId: '{"categoricalOutcome":[95,0]}',
        price: 0.8073410184251611,
      },
      {
        color: "#00A3FF",
        name: "no",
        ticker: "NO",
        assetId: '{"categoricalOutcome":[95,1]}',
        price: 0.19265934402954396,
      },
    ],
    pool: {
      poolId: 73,
      volume: "10826691817611",
      baseAsset: "Ztg",
    },
    marketType: {
      categorical: "2",
      scalar: null,
    },
    scalarType: null,
    tags: ["Dotsama", "Zeitgeist"],
    status: "Active",
    endDate: "1685570377881",
  },
  {
    marketId: 138,
    question: "Who will win LCS Spring Split 2023 Championship?",
    creation: "Advised",
    img: "QmW9LQnBsxqs3sYbQuN2AQTMFwyGznm8JRQuNoCnXtUizU",
    prediction: {
      name: "Cloud9",
      price: 0.3,
      percentage: 30,
    },
    volume: 0,
    baseAsset: "Ztg",
    outcomes: [
      {
        color: "#BF5C6D",
        name: "Counter Logic Gaming",
        ticker: "CLG",
        assetId: '{"categoricalOutcome":[138,0]}',
        price: 0.12,
      },
      {
        color: "#ABD8F2",
        name: "Cloud9",
        ticker: "C9",
        assetId: '{"categoricalOutcome":[138,1]}',
        price: 0.3,
      },
      {
        color: "#E1DFEB",
        name: "100 Thieves",
        ticker: "100T",
        assetId: '{"categoricalOutcome":[138,2]}',
        price: 0.2,
      },
      {
        color: "#38C0CE",
        name: "FlyQuest",
        ticker: "FLY",
        assetId: '{"categoricalOutcome":[138,3]}',
        price: 0.25,
      },
      {
        color: "#35A1CB",
        name: "Golden Guardians",
        ticker: "GG",
        assetId: '{"categoricalOutcome":[138,4]}',
        price: 0.05,
      },
      {
        color: "#15AF2A",
        name: "Evil Geniuses",
        ticker: "EG",
        assetId: '{"categoricalOutcome":[138,5]}',
        price: 0.08,
      },
    ],
    pool: {
      poolId: 114,
      volume: "0",
      baseAsset: "Ztg",
    },
    marketType: {
      categorical: "6",
      scalar: null,
    },
    scalarType: null,
    tags: ["E-Sports"],
    status: "Active",
    endDate: "1680832801709",
  },
  {
    marketId: 134,
    question: "Will @realDonaldTrump tweet before the end of April 2023 (UTC)?",
    creation: "Advised",
    img: "QmWYFL6Wy79R1JHEsjV1kkbyKDBL5GKxCZeKXMaC1Xb8jv",
    prediction: {
      name: "no",
      price: 0.7408246812108171,
      percentage: 74,
    },
    volume: 29.7087537648,
    baseAsset: "Ztg",
    outcomes: [
      {
        color: "#0E992D",
        name: "yes",
        ticker: "YES",
        assetId: '{"categoricalOutcome":[134,0]}',
        price: 0.25917619100160155,
      },
      {
        color: "#00A3FF",
        name: "no",
        ticker: "NO",
        assetId: '{"categoricalOutcome":[134,1]}',
        price: 0.7408246812108171,
      },
    ],
    pool: {
      poolId: 112,
      volume: "297087537648",
      baseAsset: "Ztg",
    },
    marketType: {
      categorical: "2",
      scalar: null,
    },
    scalarType: null,
    tags: ["Politics"],
    status: "Active",
    endDate: "1682287195790",
  },
];

jest.mock("lib/hooks/queries/useMarketsByIds", () => {
  return {
    useMarketsByIds: (_: any[]) => {
      return {
        data: markets,
      };
    },
  };
});

jest.mock("lib/hooks/queries/useMarketsStats", () => {
  return {
    useMarketsStats: () => {
      return {
        data: [
          {
            participants: 22,
            liquidity: "10833793610348",
            marketId: 95,
          },
          {
            participants: 4,
            liquidity: "11852734028260",
            marketId: 134,
          },
          {
            participants: 1,
            liquidity: "20000000000000",
            marketId: 138,
          },
        ],
      };
    },
  };
});

const title = "Title";
const cta = "CTA";
const link = "#link";

describe("MarketScroll", () => {
  it("renders correctly", () => {
    const tree = renderer
      .create(
        <MarketScroll markets={markets} title={title} cta={cta} link={link} />,
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
