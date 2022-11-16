import Link from "next/link";
import { motion, Variants } from "framer-motion";
import Decimal from "decimal.js";
import moment from "moment";
import { Skeleton } from "@material-ui/lab";
import { combineLatest, from, map, Subscription } from "rxjs";
import React, {
  FC,
  useState,
  useEffect,
  createContext,
  useContext,
  useRef,
} from "react";
import { observer } from "mobx-react";
import {
  ExternalLink,
  ChevronUp,
  AlertTriangle,
  Smile,
  Clock,
} from "react-feather";
import { omit } from "lodash";

import { isPreloadedMarket, MarketCardData } from "lib/gql/markets-list";
import MarketStore from "lib/stores/MarketStore";
import { getPoolAssets } from "lib/gql/pool";
import { getAssetPriceHistory, AssetPrice } from "lib/gql/prices";
import { useStore } from "lib/stores/Store";
import { DAY_SECONDS } from "lib/constants";

import MarketTable from "./MarketTable";
import ScalarPriceRange from "./ScalarPriceRange";
import MarketImage from "components/ui/MarketImage";

const MarketCardContext = createContext<{
  market: MarketCardData;
  assets: { price: number; assetId: string }[];
}>(null);

const useMarketCardContext = () => useContext(MarketCardContext);

type CardProps = {
  prediction?: string;
  shortPrice?: number;
  longPrice?: number;
  expanded?: boolean;
  onChangeExpanded?: (expanded: boolean) => void;
};

const Card = observer(
  ({
    prediction,
    expanded = false,
    shortPrice,
    longPrice,
    onChangeExpanded,
  }: CardProps) => {
    const cardContext = useMarketCardContext();

    const { market } = cardContext;
    const tagsText = market.tags == null ? "" : market.tags.join(" / ");
    const preloaded = isPreloadedMarket(market);

    const getPredictionHumanReadable = () => {
      if (market.poolExists === false) {
        return "--";
      }
      if (market.scalarType === "date") {
        const humanReadable = moment(Number(prediction)).format(
          "d/MM/D/YY, hh:mm",
        );
        return humanReadable;
      } else {
        return `${prediction}`;
      }
    };

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
                market.creation === "Permissionless" ? (
                  <AlertTriangle size={12} className="text-vermilion" />
                ) : market.status === "Proposed" ? (
                  <Clock size={12} className="text-info-blue" />
                ) : (
                  <Smile size={12} className="text-sheen-green" />
                )
              }
            </div>
            <div className="text-ztg-10-150 font-bold">{tagsText}</div>
            <div className="text-ztg-10-150 font-bold ml-auto mr-ztg-15">
              {preloaded ? "" : market.marketStatusString}
            </div>
            <div className="font-medium text-ztg-10-150 px-ztg-10 h-ztg-20 flex items-center justify-center rounded-full bg-black text-white cursor-pointer uppercase">
              {market.status}
            </div>
          </div>
        </div>
        <div
          className="h-ztg-100 bg-sky-100 dark:bg-black"
          style={{ zIndex: 1 }}
        >
          <div className="flex items-center mx-ztg-16 h-full">
            <Link href={`/markets/${market.id}`}>
              <div className="flex items-center h-full">
                <MarketImage
                  image={preloaded ? undefined : market.img}
                  alt={`Image depicting ${market.question}`}
                />

                <div className=" ml-ztg-16 mr-ztg-16 h-ztg-70 overflow-auto cursor-pointer">
                  <div className="text-ztg-12-120 font-bold uppercase text-sky-600">
                    {market.slug}
                  </div>
                  <div className="text-ztg-14-120 text-black dark:text-white">
                    {market.question}
                  </div>
                </div>
              </div>
            </Link>

            <div
              className="flex flex-col justify-center ml-auto border-l-1 pl-ztg-16 border-sky-600 h-ztg-75 max-w-ztg-164 w-full"
              style={{ maxWidth: "150px" }}
            >
              <div className="text-ztg-12-120 text-sky-600 uppercase font-bold">
                Prediction
              </div>
              <div className="flex flex-row">
                {preloaded &&
                  (market.poolExists ? (
                    prediction == null ? (
                      <Skeleton className="!transform-none !w-[50px] !h-[20px] !mt-ztg-4" />
                    ) : (
                      getPredictionHumanReadable()
                    )
                  ) : (
                    "--"
                  ))}
                {!preloaded && (
                  <div className="text-ztg-16-120 font-bold text-black dark:text-white mt-ztg-4">
                    {getPredictionHumanReadable()}
                  </div>
                )}
              </div>
            </div>
            <div className="hidden sm:flex items-center h-full text-sky-600">
              {/* TODO */}
              {/* <Star size={24} className="mr-ztg-10 cursor-pointer" /> */}
              <Link href={`/markets/${market.id}`}>
                <span>
                  <ExternalLink size={24} className="cursor-pointer" />
                </span>
              </Link>
              <div className="w-ztg-43">
                <motion.button
                  variants={buttonVariants}
                  animate={expanded ? "open" : "closed"}
                  transition={{ duration: 0.3 }}
                  className="w-ztg-30 h-ztg-30 bg-sky-600 text-white dark:text-black ml-auto rounded-full flex items-center justify-center focus:outline-none disabled:opacity-50 disabled:cursor-default"
                  onClick={() => onChangeExpanded(!expanded)}
                  disabled={!market.poolExists}
                >
                  <ChevronUp size={24} />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
        {expanded && market.poolExists && (
          <PoolExpandable
            type={market.type}
            bounds={market.bounds}
            shortPrice={shortPrice}
            longPrice={longPrice}
          />
        )}
      </div>
    );
  },
);

type PoolExpandableProps = {
  type: "scalar" | "categorical";
  bounds: [number, number];
  shortPrice: number;
  longPrice: number;
};

const PoolExpandable = observer(
  ({ bounds, shortPrice, longPrice, type }: PoolExpandableProps) => {
    const { market, assets } = useMarketCardContext();
    const store = useStore();

    const showScalarPriceRange =
      market.poolExists &&
      market.type === "scalar" &&
      shortPrice != null &&
      longPrice != null;

    const [priceHistories, setPriceHistories] = useState<{
      [key: string]: AssetPrice[];
    }>();
    const priceHistoriesGqlSubRef = useRef<Subscription>();

    useEffect(() => {
      if (!isPreloadedMarket(market)) {
        return;
      }
      if (assets == null || store.graphQLClient == null) {
        return;
      }
      if (priceHistoriesGqlSubRef.current != null) {
        return;
      }

      const dateOneWeekAgo = new Date(
        new Date().getTime() - DAY_SECONDS * 7 * 1000,
      ).toISOString();
      const assetsObs = assets.map((asset) => {
        return from(
          getAssetPriceHistory(
            store.graphQLClient,
            asset.assetId,
            dateOneWeekAgo,
          ),
        ).pipe(map((val) => ({ [asset.assetId]: val })));
      });
      priceHistoriesGqlSubRef.current = combineLatest(assetsObs).subscribe(
        (res) => {
          let histories = {};
          for (const history of res) {
            histories = { ...histories, ...history };
          }
          setPriceHistories(histories);
        },
      );
      return () => priceHistoriesGqlSubRef.current.unsubscribe();
    }, [assets, store.graphQLClient]);

    useEffect(() => {
      if (isPreloadedMarket(market)) {
        return;
      }

      if (
        priceHistoriesGqlSubRef.current != null &&
        priceHistoriesGqlSubRef.current.closed === false
      ) {
        priceHistoriesGqlSubRef.current.unsubscribe();
      }

      const rawMarket = market.market;
      const dateOneWeekAgo = new Date(
        new Date().getTime() - DAY_SECONDS * 7 * 1000,
      ).toISOString();

      const priceHistoryObs = rawMarket.outcomeAssets.map((asset) => {
        const assetId = asset.toString();
        return from(
          store.sdk.models.getAssetPriceHistory(
            rawMarket.marketId,
            asset.isCategoricalOutcome
              ? asset.asCategoricalOutcome[1].toNumber()
              : asset.asScalarOutcome[1].toString(),
            dateOneWeekAgo,
          ),
        ).pipe(map((val) => ({ [assetId]: val })));
      });
      const sub = combineLatest(priceHistoryObs).subscribe((res) => {
        let histories = {};
        for (const history of res) {
          histories = { ...histories, ...history };
        }
        setPriceHistories(histories);
      });
      return () => sub.unsubscribe();
    }, [market, (market as MarketStore).pool]);

    return (
      <motion.div
        style={{ zIndex: 0 }}
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "tween" }}
        className="h-auto px-ztg-20 pb-ztg-5 pt-ztg-4 dark:bg-black bg-sky-100"
      >
        {showScalarPriceRange ? (
          <ScalarPriceRange
            lowerBound={bounds?.[0]}
            upperBound={bounds?.[1]}
            shortPrice={shortPrice}
            longPrice={longPrice}
            scalarType={market.scalarType}
          />
        ) : (
          market.type === "scalar" && (
            <Skeleton className="!transform-none !h-[93px]" />
          )
        )}
        {market && (
          <MarketTable
            marketStore={market}
            priceHistories={priceHistories}
            assets={assets}
          />
        )}
      </motion.div>
    );
  },
);

export interface MarketCardProps {
  market: MarketCardData;
}

const MarketCard: FC<MarketCardProps> = observer(({ market }) => {
  const [prediction, setPrediction] = useState<string>();
  const [expanded, setExpanded] = useState(false);
  const store = useStore();

  const status: string = market.status;

  const [innerStatus, setInnerStatus] = useState<string>(status);
  const [longPrice, setLongPrice] = useState<number>();
  const [shortPrice, setShortPrice] = useState<number>();
  const [assets, setAssets] = useState<{ price: number; assetId: string }[]>();

  const marketStore = isPreloadedMarket(market) ? undefined : market;
  const marketStorePool = marketStore?.pool;

  const getAssetsFromChain = async (
    market: MarketStore,
  ): Promise<typeof assets> => {
    const assetIds = market.outcomeAssetIds;
    let result: typeof assets = [];
    for (const assetId of assetIds) {
      result = [
        ...result,
        {
          assetId: JSON.stringify(assetId),
          price: (await market.assetPriceInZTG(assetId)).toNumber(),
        },
      ];
    }
    return result;
  };

  const preloadAssetsSubRef = useRef<Subscription>();

  useEffect(() => {
    if (!isPreloadedMarket(market)) {
      return;
    }
    if (preloadAssetsSubRef.current != null) {
      return;
    }
    if (store.graphQLClient && market.poolExists === true) {
      preloadAssetsSubRef.current = from(
        getPoolAssets(store.graphQLClient, market.poolId),
      ).subscribe((res) =>
        setAssets(res.map((r) => omit(r, ["amountInPool"]))),
      );
      return () => preloadAssetsSubRef.current.unsubscribe();
    }
  }, [market, store.graphQLClient]);

  useEffect(() => {
    if (isPreloadedMarket(market)) {
      return;
    }

    if (
      preloadAssetsSubRef.current != null &&
      preloadAssetsSubRef.current.closed === false
    ) {
      preloadAssetsSubRef.current.unsubscribe();
    }

    const sub = from(getAssetsFromChain(market)).subscribe((assets) => {
      setAssets(assets);
    });

    return () => sub.unsubscribe();
  }, [market, marketStorePool]);

  useEffect(() => {
    if (assets == null) {
      return setPrediction(null);
    }
    const preloaded = isPreloadedMarket(market);
    if (market.type === "categorical") {
      if (preloaded) {
        let assetIndex: number;
        for (let index = 0; index < assets.length; index++) {
          if (index === 0) {
            assetIndex = 0;
            continue;
          }
          const element = assets[index];
          if (element.price > assets[assetIndex].price) {
            assetIndex = index;
          }
        }
        const { ticker } = market.categories[assetIndex];
        setPrediction(ticker);
      } else {
        const sortedAssets = [...assets].sort((a, b) => b.price - a.price);
        setPrediction(
          marketStore.getMarketOutcome(sortedAssets[0].assetId).metadata[
            "ticker"
          ],
        );
      }
    } else {
      const bounds = market.bounds;
      const range = new Decimal(bounds[1] - bounds[0]);

      const lPrice = assets[0].price;
      const sPrice = assets[1].price;

      const shortPricePrediction = range
        .mul(new Decimal(1).minus(sPrice))
        .add(bounds[0]);
      const longPricePrediction = range.mul(lPrice).add(bounds[0]);
      const averagePricePrediction = longPricePrediction
        .plus(shortPricePrediction)
        .div(2);

      setPrediction(averagePricePrediction.toFixed(0));
      setLongPrice(lPrice);
      setShortPrice(sPrice);
    }
  }, [assets]);

  useEffect(() => {
    const statusChanged = innerStatus !== status;
    if (statusChanged) {
      setInnerStatus(status);
    }
  }, [status]);

  return (
    <MarketCardContext.Provider value={{ market, assets }}>
      <Card
        longPrice={longPrice}
        shortPrice={shortPrice}
        prediction={prediction}
        expanded={expanded}
        onChangeExpanded={setExpanded}
      />
    </MarketCardContext.Provider>
  );
});

export default MarketCard;
