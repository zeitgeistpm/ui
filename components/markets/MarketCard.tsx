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

import MarketStore from "lib/stores/MarketStore";
import MarketTable from "./MarketTable";
import { motion, Variants } from "framer-motion";
import ScalarPriceRange from "./ScalarPriceRange";
import Decimal from "decimal.js";

export interface MarketCardProps {
  marketStore: MarketStore;
}

const MarketCard: FC<{ marketStore: MarketStore }> = observer(
  ({ marketStore }) => {
    const [expanded, setExpanded] = useState(false);
    const [prediction, setPrediction] = useState<string | null>(null);
    const { poolExists, status } = marketStore;
    const [innerStatus, setInnerStatus] = useState<string>(status);
    const [longPrice, setLongPrice] = useState<number>();
    const [shortPice, setShortPrice] = useState<number>();

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
        // onStatusChange();
        setInnerStatus(status);
      }
    }, [status]);

    const buttonVariants: Variants = {
      closed: { rotate: 180 },
      open: { rotate: 0 },
    };

    const tagsText = useMemo(() => {
      return marketStore.tags == null ? "" : marketStore.tags.join(" / ");
    }, [marketStore.tags]);
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
                marketStore.creation === "Permissionless" ? (
                  <AlertTriangle size={12} className="text-vermilion" />
                ) : marketStore.status === "Proposed" ? (
                  <Clock size={12} className="text-info-blue" />
                ) : (
                  <Smile size={12} className="text-sheen-green" />
                )
              }
            </div>
            <div className="text-ztg-10-150 font-bold">{tagsText}</div>
            <div className="text-ztg-10-150 font-bold ml-auto mr-ztg-15">
              {marketStore.marketStatusString}
            </div>
            <div className="font-medium text-ztg-10-150 px-ztg-10 h-ztg-20 flex items-center justify-center rounded-full bg-black text-white cursor-pointer uppercase">
              {marketStore.status}
            </div>
          </div>
        </div>
        <div
          className="h-ztg-100 bg-sky-100 dark:bg-black"
          style={{ zIndex: 1 }}
        >
          <div className="flex items-center mx-ztg-16 h-full">
            <Link href={`/markets/${marketStore.id}`}>
              <a className="flex items-center h-full">
                <div className="w-ztg-70 h-ztg-70 rounded-ztg-10 flex-shrink-0 bg-sky-600">
                  <div
                    className="w-ztg-70 h-ztg-70 rounded-ztg-10 flex-shrink-0"
                    style={{
                      backgroundImage:
                        marketStore?.img == null
                          ? "url(/icons/default-market.png)"
                          : `url(${marketStore.img})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  ></div>
                </div>

                <div className=" ml-ztg-16 mr-ztg-16 h-ztg-70 overflow-auto cursor-pointer">
                  <div className="text-ztg-12-120 font-bold uppercase text-sky-600">
                    {marketStore.slug}
                  </div>
                  <div className="text-ztg-14-120 text-black dark:text-white">
                    {marketStore.question}
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
              <Link href={`/markets/${marketStore.id}`}>
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
          <motion.div
            style={{ zIndex: 0 }}
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, type: "tween" }}
            className="h-auto px-ztg-20 pb-ztg-5 pt-ztg-4 dark:bg-black bg-sky-100"
          >
            {marketStore.type === "scalar" && (
              <ScalarPriceRange
                lowerBound={marketStore.bounds[0]}
                upperBound={marketStore.bounds[1]}
                shortPrice={shortPice}
                longPrice={longPrice}
              />
            )}
            <MarketTable marketStore={marketStore} />
          </motion.div>
        )}
      </div>
    );
  },
);

export default MarketCard;
