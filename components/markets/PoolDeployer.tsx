import PoolSettings, {
  PoolAssetRowData,
  poolRowDataFromOutcomes,
} from "components/liquidity/PoolSettings";
import TransactionButton from "components/ui/TransactionButton";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import MarketStore from "lib/stores/MarketStore";
import { useNotifications } from "lib/stores/NotificationStore";
import { useStore } from "lib/stores/Store";
import { MultipleOutcomeEntry } from "lib/types/create-market";
import { calculatePoolCost } from "lib/util/market";
import { extrinsicCallback } from "lib/util/tx";
import { observer } from "mobx-react";
import { useState } from "react";

const PoolDeployer = observer(
  ({
    marketStore,
    onPoolDeployed,
  }: {
    marketStore: MarketStore;
    onPoolDeployed: () => void;
  }) => {
    const [poolRows, setPoolRows] = useState<PoolAssetRowData[]>();
    const [swapFee, setSwapFee] = useState<string>();

    const store = useStore();
    const notificationStore = useNotifications();

    const poolCost =
      poolRows && calculatePoolCost(poolRows.map((row) => Number(row.amount)));

    const handleDeployClick = () => {
      const rows = poolRowDataFromOutcomes(
        marketStore.market.categories as MultipleOutcomeEntry[],
        store.config.tokenSymbol,
      );
      setPoolRows(rows);
    };

    const handleDeploySignClick = async () => {
      // We are assuming all rows have the same amount
      const amount = poolRows[0].amount;

      const weights = poolRows.slice(0, -1).map((row) => {
        return new Decimal(row.weight).mul(ZTG).toFixed(0, Decimal.ROUND_DOWN);
      });

      const signer = store.wallets.getActiveSigner();

      const deployPoolTx = () => {
        return new Promise<void>((resolve, reject) => {
          marketStore.market.deploySwapPoolAndAdditionalLiquidity(
            signer,
            swapFee,
            new Decimal(amount).mul(ZTG).toFixed(0),
            weights,
            extrinsicCallback({
              notificationStore,
              successCallback: () => {
                notificationStore.pushNotification("Liquidity pool deployed", {
                  type: "Success",
                });
                resolve();
              },
              failCallback: ({ index, error }) => {
                notificationStore.pushNotification(
                  store.getTransactionError(index, error),
                  {
                    type: "Error",
                  },
                );
                reject();
              },
            }),
          );
        });
      };

      try {
        await deployPoolTx();
        onPoolDeployed();
      } catch {
        console.log("Unable to deploy liquidity pool.");
      }
    };

    return (
      <>
        {marketStore?.poolExists === false ? (
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
                  onClick={handleDeploySignClick}
                  disabled={store.wallets.activeBalance.lessThan(poolCost)}
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
              {marketStore.is("Active") && (
                <button
                  className="my-ztg-20  font-bold text-ztg-16-150 text-sky-600 border-1 px-ztg-20 py-ztg-10 rounded-ztg-10 border-sky-600"
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
  },
);

export default PoolDeployer;
