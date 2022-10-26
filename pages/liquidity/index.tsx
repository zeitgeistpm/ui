import { useQuery } from "@tanstack/react-query";
import { ZTG } from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { sortBy } from "lodash";
import { observer } from "mobx-react";
import { NextPage } from "next";

const LiquidityPools: NextPage = observer(() => {
  const sdk = useSdkv2();

  const pools = useQuery(
    ["pools"],
    async () => {
      const pools = await sdk.model.swaps.listPools({});
      return sortBy(pools, "poolId", "desc").reverse();
    },
    {
      enabled: Boolean(sdk),
    },
  );

  const assetIndex = useQuery(
    ["pools-asset-index"],
    async () => {
      return sdk.model.swaps.assetsIndex(pools.data);
    },
    {
      enabled: Boolean(sdk) && Boolean(pools.data),
    },
  );

  return (
    <div>
      {pools.data?.map((pool) => {
        return (
          <div>
            <div>
              {pool.poolId}:{" "}
              {assetIndex.data?.[pool.poolId].liquidity
                .dividedBy(ZTG)
                .toString()}
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default LiquidityPools;
