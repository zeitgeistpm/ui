import { motion } from "framer-motion";
import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react";
import Link from "next/link";

export interface TrendingMarketInfo {
  marketId: number;
  name: string;
  volume: string;
  img: string;
  outcomes: string;
  prediction: string;
  baseAsset: string;
}

const TrendingMarketCard = observer(
  ({
    marketId,
    name,
    volume,
    img,
    outcomes,
    prediction,
    baseAsset,
  }: TrendingMarketInfo) => {
    const { config } = useStore();

    return (
      <motion.div
        className="bg-sky-100 dark:bg-black rounded-ztg-10 p-ztg-15 w-full"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 1 }}
      >
        <Link href={`/markets/${marketId}`}>
          <a>
            <div className="flex-col">
              <div className="hidden sm:flex">
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
                <div className="flex flex-col ml-auto items-end">
                  <div className="text-sky-600 uppercase font-bold text-ztg-14-150">
                    Outcomes
                  </div>
                  <div>{outcomes}</div>
                </div>
              </div>
              <div className="text-ztg-14-120 mb-ztg-17 sm:my-ztg-17 line-clamp-2">
                {name}
              </div>
              <div className="flex">
                <div className="flex flex-col ">
                  <div className="text-sky-600 uppercase font-bold text-ztg-14-150">
                    Prediction
                  </div>
                  <div>{prediction}</div>
                </div>
                <div className="flex flex-col ml-auto items-end">
                  <div className="text-sky-600 uppercase font-bold text-ztg-14-150">
                    Volume
                  </div>
                  <div>
                    {volume} {baseAsset.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          </a>
        </Link>
      </motion.div>
    );
  },
);

export default TrendingMarketCard;
