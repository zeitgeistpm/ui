import React from "react";
import MarketScroll from "./MarketScroll";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { IndexedMarketCardData } from "./market-card";

import "styles/index.css";

const queryClient = new QueryClient();

const markets: IndexedMarketCardData[] = [
  {
    marketId: 95,
    question: "Will ZTG be available for trading on a DEX by the end of May?",
    creation: "Advised",
    img: "QmYDFUevuzi1um7dS1KixdPtJGheZ4EVWavP6t643JQxUD",
    prediction: { name: "yes", price: 0.7730729358954956 },
    volume: 852.0887920263,
    baseAsset: "Ztg",
    outcomes: [
      {
        color: "#0E992D",
        name: "yes",
        ticker: "YES",
        assetId: '{"categoricalOutcome":[95,0]}',
        price: 0.7730729358954956,
      },
      {
        color: "#00A3FF",
        name: "no",
        ticker: "NO",
        assetId: '{"categoricalOutcome":[95,1]}',
        price: 0.22692552817041428,
      },
    ],
    pool: { poolId: 73, volume: "8520887920263", baseAsset: "Ztg" },
    marketType: { categorical: "2", scalar: null },
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
    prediction: { name: "Cloud9", price: 0.3 },
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
    pool: { poolId: 114, volume: "0", baseAsset: "Ztg" },
    marketType: { categorical: "6", scalar: null },
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
    prediction: { name: "no", price: 0.7377430890611961 },
    volume: 24.7087537648,
    baseAsset: "Ztg",
    outcomes: [
      {
        color: "#0E992D",
        name: "yes",
        ticker: "YES",
        assetId: '{"categoricalOutcome":[134,0]}',
        price: 0.26225970834955403,
      },
      {
        color: "#00A3FF",
        name: "no",
        ticker: "NO",
        assetId: '{"categoricalOutcome":[134,1]}',
        price: 0.7377430890611961,
      },
    ],
    pool: { poolId: 112, volume: "247087537648", baseAsset: "Ztg" },
    marketType: { categorical: "2", scalar: null },
    scalarType: null,
    tags: ["Politics"],
    status: "Active",
    endDate: "1682287195790",
  },
  {
    marketId: 137,
    question: "Will USDC be $1 at the end of March?",
    creation: "Advised",
    img: null,
    prediction: {
      name: "Yes",
      price: 0.9206815059198473,
    },
    volume: 157,
    baseAsset: "Ztg",
    outcomes: [
      {
        color: "#0E992D",
        name: "Yes",
        ticker: "YES",
        assetId: '{"categoricalOutcome":[137,0]}',
        price: 0.9206815059198473,
      },
      {
        color: "#00A3FF",
        name: "No",
        ticker: "NO",
        assetId: '{"categoricalOutcome":[137,1]}',
        price: 0.07931769161281364,
      },
    ],
    pool: {
      volume: "1570399684036",
      baseAsset: "Ztg",
    },
    marketType: {
      categorical: "2",
      scalar: null,
    },
    tags: ["Crypto"],
    status: "Active",
    scalarType: null,
    endDate: "1679698778597",
  },
];

describe("MarketScroll component", () => {
  const title = "Featured markets";
  const cta = "Go To Markets";
  const link = "/markets";

  it("renders", () => {
    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MarketScroll title={title} cta={cta} link={link} markets={[]} />
      </QueryClientProvider>,
    );
    const ctaEl = cy.get("[data-testid=horizontalScroll__cta]");

    ctaEl.should("exist").should("have.attr", "href", "/markets");
    ctaEl.should("contains.text", "Go To Markets");

    const leftBtn = cy.get("[data-testid=horizontalScroll__leftBtn]");
    const rightBtn = cy.get("[data-testid=horizontalScroll__rightBtn]");
    leftBtn.should("exist").should("be.disabled");
    rightBtn.should("exist").should("be.disabled");

    cy.get("[data-testid=marketScroll__title]").should("contains.text", title);
  });

  it("renders with three markets", () => {
    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MarketScroll
          title={title}
          cta={cta}
          link={link}
          markets={markets.slice(0, 3)}
        />
      </QueryClientProvider>,
    );
    const ctaEl = cy.get("[data-testid=horizontalScroll__cta]");

    ctaEl.should("exist").should("have.attr", "href", "/markets");
    ctaEl.should("contains.text", "Go To Markets");

    const leftBtn = cy.get("[data-testid=horizontalScroll__leftBtn]");
    leftBtn.should("exist").should("be.disabled");

    const rightBtn = cy.get("[data-testid=horizontalScroll__rightBtn]");
    rightBtn.should("exist").should("be.disabled");

    cy.get("[data-testid=marketScroll__title]").should("contains.text", title);
  });

  it("renders with more than three markets", () => {
    cy.mount(
      <QueryClientProvider client={queryClient}>
        <MarketScroll title={title} cta={cta} link={link} markets={markets} />
      </QueryClientProvider>,
    );

    const marketsLen = markets.length;

    const ctaEl = cy.get("[data-testid=horizontalScroll__cta]");

    ctaEl.should("exist").should("have.attr", "href", "/markets");
    ctaEl.should("contains.text", "Go To Markets");

    const leftBtn = cy.get("[data-testid=horizontalScroll__leftBtn]");
    leftBtn.should("exist").should("be.disabled");

    const rightBtn = cy.get("[data-testid=horizontalScroll__rightBtn]");
    rightBtn.should("exist").should("be.enabled");

    cy.get("[data-testid=marketScroll__title]").should("contains.text", title);
  });
});
