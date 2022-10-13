import Link from "next/link";
import React, { FC, useState, useMemo, useEffect } from "react";
import { observer } from "mobx-react";
import {
  ExternalLink,
  ChevronUp,
  AlertTriangle,
  Smile,
  Clock,
} from "react-feather";

import { MarketPreload } from "lib/gql/markets";
import { MarketStatus } from "lib/types";
import MarketStore from "lib/stores/MarketStore";
import MarketTable from "./MarketTable";
import { motion, Variants } from "framer-motion";
import ScalarPriceRange from "./ScalarPriceRange";
import Decimal from "decimal.js";
import { useMarketsStore } from "lib/stores/MarketsStore";
import { from } from "rxjs";
import { MarketCreation } from "@zeitgeistpm/sdk/dist/types";

export interface MarketCardProps {
  marketStore: MarketStore;
}

type CardData = {
  status: MarketStatus;
  marketStatusString?: string;
  id: number;
  img?: string;
  slug: string;
  question: string;
  creation: MarketCreation;
  prediction?: string;
  tags?: string[];
  poolExists?: boolean;
  type: "categorical" | "scalar";
  bounds?: [number, number];
  shortPrice?: number;
  longPrice?: number
}

const Card = observer(
  ({
    id,
    status,
    marketStatusString,
    tags,
    img,
    slug,
    question,
    creation,
    prediction,
    type,
    poolExists = false,
    bounds,
    shortPrice,
    longPrice,
  }: CardData) => {
    const [expanded, setExpanded] = useState(false);
    const tagsText = tags == null ? "" : tags.join(" / ");

    const buttonVariants: Variants = {
      closed: { rotate: 180 },
      open: { rotate: 0 },
    };

    return (
      <div
        className={`rounded-ztg-10 w-full mb-ztg-15
          flex flex-col overflow-hidden justify-between`}
      >
        <div className="w-full h-ztg-36 flex-shrink-0 bg-sky-300 dark:bg-sky-700 font-lato font-bold text-sky-600">
          <div className="flex flex-row items-center mx-ztg-16 h-full">
            <div className="w-ztg-24">
              {
                //@ts-ignore
                creation === "Permissionless" ? (
                  <AlertTriangle size={12} className="text-vermilion" />
                ) : status === "Proposed" ? (
                  <Clock size={12} className="text-info-blue" />
                ) : (
                  <Smile size={12} className="text-sheen-green" />
                )
              }
            </div>
            <div className="text-ztg-10-150 font-bold">{tagsText}</div>
            <div className="text-ztg-10-150 font-bold ml-auto mr-ztg-15">
              {marketStatusString}
            </div>
            <div className="font-medium text-ztg-10-150 px-ztg-10 h-ztg-20 flex items-center justify-center rounded-full bg-black text-white cursor-pointer uppercase">
              {status}
            </div>
          </div>
        </div>
        <div
          className="h-ztg-100 bg-sky-100 dark:bg-black"
          style={{ zIndex: 1 }}
        >
          <div className="flex items-center mx-ztg-16 h-full">
            <Link href={`/markets/${id}`}>
              <a className="flex items-center h-full">
                <div className="w-ztg-70 h-ztg-70 rounded-ztg-10 flex-shrink-0 bg-sky-600">
                  <div
                    className="w-ztg-70 h-ztg-70 rounded-ztg-10 flex-shrink-0"
                    style={{
                      backgroundImage:
                        img == null
                          ? "url(/icons/default-market.png)"
                          : `url(${img})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  ></div>
                </div>

                <div className=" ml-ztg-16 mr-ztg-16 h-ztg-70 overflow-auto cursor-pointer">
                  <div className="text-ztg-12-120 font-bold uppercase text-sky-600">
                    {slug}
                  </div>
                  <div className="text-ztg-14-120 text-black dark:text-white">
                    {question}
                  </div>
                </div>
              </a>
            </Link>

            <div
              className="flex flex-col justify-center ml-auto border-l-1 pl-ztg-16 border-sky-600 h-ztg-75 max-w-ztg-164 w-full"
              style={{ maxWidth: "150px" }}
            >
              <div className="text-ztg-12-120 text-sky-600 uppercase font-bold">
                Prediction
              </div>
              <div className="flex flex-row">
                <div className="text-ztg-16-120 font-bold text-black dark:text-white mt-ztg-4">
                  {/* todo */}
                  {prediction ?? "--"}
                </div>
              </div>
            </div>
            <div className="hidden sm:flex items-center h-full text-sky-600">
              {/* TODO */}
              {/* <Star size={24} className="mr-ztg-10 cursor-pointer" /> */}
              <Link href={`/markets/${id}`}>
                <a>
                  <ExternalLink size={24} className="cursor-pointer" />
                </a>
              </Link>
              <div className="w-ztg-43">
                <motion.button
                  variants={buttonVariants}
                  animate={expanded ? "open" : "closed"}
                  transition={{ duration: 0.3 }}
                  className="w-ztg-30 h-ztg-30 bg-sky-600 text-white dark:text-black ml-auto rounded-full flex items-center justify-center focus:outline-none disabled:opacity-50 disabled:cursor-default"
                  onClick={() => setExpanded(!expanded)}
                  disabled={!poolExists}
                >
                  <ChevronUp size={24} />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
        {expanded && poolExists && (
          <PoolExpandable
            marketId={id}
            type={type}
            bounds={bounds}
            shortPrice={shortPrice}
            longPrice={longPrice}
          />
        )}
      </div>
    );
  },
);

type PoolExpandableProps = {
  marketId: number;
  type: "scalar" | "categorical"
  bounds: [number, number];
  shortPrice: number;
  longPrice: number;
} 

const PoolExpandable = observer(
  ({ marketId, bounds, shortPrice, longPrice, type }: PoolExpandableProps) => {
    const marketsStore = useMarketsStore();
    const [marketStore, setMarketStore] = useState<MarketStore>();

    useEffect(() => {
      const sub = from(marketsStore.getMarket(marketId)).subscribe((s) => {
        setMarketStore(s);
      });
      return () => sub.unsubscribe();
    }, [marketId]);

    return (
      <motion.div
        style={{ zIndex: 0 }}
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "tween" }}
        className="h-auto px-ztg-20 pb-ztg-5 pt-ztg-4 dark:bg-black bg-sky-100"
      >
        {type === "scalar" && (
          <ScalarPriceRange
            lowerBound={bounds[0]}
            upperBound={bounds[1]}
            shortPrice={shortPrice}
            longPrice={longPrice}
          />
        )}
        {marketStore && <MarketTable marketStore={marketStore} />}
      </motion.div>
    );
  },
);

const MarketCard: FC<MarketCardProps> = observer(
  ({ marketStore }) => {
    const [prediction, setPrediction] = useState<string | null>(null);
    const { poolExists, status } = marketStore;
    const [innerStatus, setInnerStatus] = useState<string>(status);
    const [longPrice, setLongPrice] = useState<number>();
    const [shortPrice, setShortPrice] = useState<number>();

    useEffect(() => {
      if (!poolExists) {
        return setPrediction(null);
      }
      (async () => {
        const pricePromises = marketStore.marketOutcomes
          .filter((o) => o.metadata !== "ztg")
          .map(async (outcome) => {
            return {
              assetId: outcome.asset,
              price: await marketStore.assetPriceInZTG(outcome.asset),
            };
          });
        const prices = await Promise.all(pricePromises);
        if (marketStore.type === "categorical") {
          prices.sort((a, b) => b.price.sub(a.price).toNumber());

          setPrediction(
            marketStore.getMarketOutcome(prices[0].assetId).metadata["ticker"],
          );
        } else {
          const bounds = marketStore.bounds;
          const range = new Decimal(bounds[1] - bounds[0]);

          const lPrice = prices[0].price;
          const sPrice = prices[1].price;

          const shortPricePrediction = range
            .mul(new Decimal(1).minus(sPrice))
            .add(bounds[0]);
          const longPricePrediction = range.mul(lPrice).add(bounds[0]);
          const averagePricePrediction = longPricePrediction
            .plus(shortPricePrediction)
            .div(2);

          setPrediction(averagePricePrediction.toFixed(0));
          setLongPrice(lPrice.toNumber());
          setShortPrice(sPrice.toNumber());
        }
      })();
    }, [marketStore, poolExists, marketStore.pool]);

    useEffect(() => {
      const statusChanged = innerStatus !== status;
      if (statusChanged) {
        setInnerStatus(status);
      }
    }, [status]);

    return (
      <Card
        id={marketStore.id}
        img={marketStore.img}
        poolExists={poolExists}
        question={marketStore.question}
        slug={marketStore.slug}
        status={marketStore.status}
        type={marketStore.type}
        marketStatusString={marketStore.marketStatusString}
        bounds={marketStore.bounds}
        longPrice={longPrice}
        shortPrice={shortPrice}
        tags={marketStore.tags}
        creation={marketStore.creation}
        prediction={prediction}
      />
    );
  },
);

export const MarketCardPreload: FC<{ market: MarketPreload }> = observer(
  ({ market }) => {
    return (
      <Card
        id={market.marketId}
        question={market.question}
        slug={market.slug}
        status={market.status}
        type={market.type}
        tags={market.tags}
        creation={market.creation}
      />
    );
  },
);

export default MarketCard;
