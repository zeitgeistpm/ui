import { PollingTimeout, poll } from "@zeitgeistpm/avatara-util";
import { isIndexedSdk } from "@zeitgeistpm/sdk-next";
import { checkMarketExists } from "lib/gql/markets";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Loader from "react-spinners/BarLoader";

export const MarketAwait: NextPage = () => {
  const router = useRouter();
  const [sdk] = useSdkv2();
  const marketId = Array.isArray(router.query.marketid)
    ? router.query.marketid[0]
    : router.query.marketid;

  const [state, setState] = useState<"awaiting" | "success">("awaiting");

  useEffect(() => {
    if (marketId && isIndexedSdk(sdk)) {
      const indexedMarket = poll(
        async () => {
          return (await sdk.model.markets.get(marketId)).unwrap();
        },
        {
          intervall: 1000,
          timeout: Infinity,
        },
      );

      indexedMarket.then((market) => {
        if (market === PollingTimeout) throw new Error("should be unreachable");
        setState("success");
        setTimeout(() => {
          router.push(`/markets/${marketId}`);
        }, 3000);
      });
    }
  }, [sdk, marketId]);

  return (
    <div className="center py-20">
      <div className="center gap-4 md:min-w-[600px]">
        <div
          className="h-20 w-20 rounded-full animate-spin"
          style={{
            background:
              "linear-gradient(218deg, rgba(49,196,141,1) 35%, rgba(173,255,0,1) 100%)",
          }}
        >
          <div className="h-[90%] w-[90%] bg-white rounded-full mt-[5%] ml-[5%]"></div>
        </div>
        <div className="flex-1">
          <div>
            <h2
              className={`mr-4 transition-all text-black duration-300 ${
                state === "success" && "text-green-400"
              }`}
            >
              {state === "awaiting"
                ? "Waiting for market to be indexed.."
                : "Market has been indexed."}
            </h2>
            <p className="text-gray-500 text-sm">
              {state === "awaiting"
                ? "Market has been created on chain and is awaiting indexing by our platform."
                : "Redirecting you to the market page."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketAwait;