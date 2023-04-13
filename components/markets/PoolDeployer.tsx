import { useQueryClient } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import PoolSettings, {
  PoolAssetRowData,
  poolRowDataFromOutcomes,
} from "components/liquidity/PoolSettings";
import TransactionButton from "components/ui/TransactionButton";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { accountPoolAssetBalancesRootKey } from "lib/hooks/queries/useAccountPoolAssetBalances";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useMarketPoolId } from "lib/hooks/queries/useMarketPoolId";
import { useRpcMarket } from "lib/hooks/queries/useRpcMarket";
import {
  useZtgBalance,
  ztgBalanceRootKey,
} from "lib/hooks/queries/useZtgBalance";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useStore } from "lib/stores/Store";
import { useWallet } from "lib/state/wallet";
import { MultipleOutcomeEntry } from "lib/types/create-market";
import { calculatePoolCost } from "lib/util/market";
import { observer } from "mobx-react";
import { useState } from "react";

const PoolDeployer = observer(({ marketId }: { marketId: number }) => {
  const [poolRows, setPoolRows] = useState<PoolAssetRowData[]>();
  const [swapFee, setSwapFee] = useState<string>();

  const wallet = useWallet();
  const { data: poolId } = useMarketPoolId(marketId);
  const { data: market } = useMarket({ marketId });
  const queryClient = useQueryClient();
  const store = useStore();
  const notificationStore = useNotifications();
  const [sdk, id] = useSdkv2();

  const { data: activeBalance } = useZtgBalance(wallet.selectedAddress);

  const { send: deployPool, isLoading } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk)) {
        // We are assuming all rows have the same amount
        const amount = poolRows[0].amount;

        const weights = poolRows.slice(0, -1).map((row) => {
          return new Decimal(row.weight)
            .mul(ZTG)
            .toFixed(0, Decimal.ROUND_DOWN);
        });

        return sdk.api.tx.predictionMarkets.deploySwapPoolAndAdditionalLiquidity(
          marketId,
          swapFee,
          new Decimal(amount).mul(ZTG).toFixed(0),
          weights,
        );
      }
    },
    {
      onSuccess: () => {
        notificationStore.pushNotification("Liquidity pool deployed", {
          type: "Success",
        });
        queryClient.invalidateQueries([id, ztgBalanceRootKey]);
        queryClient.invalidateQueries([id, accountPoolAssetBalancesRootKey]);
      },
    },
  );

  const poolCost =
    poolRows && calculatePoolCost(poolRows.map((row) => Number(row.amount)));

  const handleDeployClick = () => {
    const rows = poolRowDataFromOutcomes(
      market.categories as MultipleOutcomeEntry[],
      store.config.tokenSymbol,
    );
    setPoolRows(rows);
  };

  return (
    <>
      {poolId == null ? (
        poolRows ? (
          <div className="my-ztg-20">
            <h4 className="mt-10 mb-4">Deploy Pool</h4>
            <PoolSettings
              data={poolRows}
              onChange={(v) => {
                setPoolRows(v);
              }}
              onFeeChange={(fee: Decimal) => {
                setSwapFee(fee.toString());
              }}
            />
            <div className="flex items-center">
              <TransactionButton
                className="w-ztg-266 ml-ztg-8"
                onClick={deployPool}
                disabled={
                  activeBalance?.div(ZTG).lessThan(poolCost) || isLoading
                }
              >
                Deploy Pool
              </TransactionButton>
              <div className="text-ztg-12-150 text-sky-600 font-bold ml-[27px]">
                Total Cost:
                <span className="font-mono">
                  {" "}
                  {poolCost} {store.config.tokenSymbol}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {market?.status === "Active" && (
              <button
                className="my-ztg-20 font-bold text-ztg-16-150 text-sky-600 border-1 px-ztg-20 py-ztg-10 rounded-ztg-10 border-sky-600"
                data-test="deployLiquidityButton"
                onClick={handleDeployClick}
              >
                Deploy Liquidity Pool
              </button>
            )}
          </>
        )
      ) : (
        <></>
      )}
    </>
  );
});

export default PoolDeployer;
