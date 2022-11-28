import {
  CategoricalAssetId,
  getAssetWeight,
  getIndexOf,
  isIndexedData,
  ScalarAssetId,
  getMarketIdOf,
} from "@zeitgeistpm/sdk-next";
import { KeyringPairOrExtSigner } from "@zeitgeistpm/sdk/dist/types";
import { Decimal } from "decimal.js";
import { MAX_IN_OUT_RATIO, ZTG } from "lib/constants";
import { useAccountAssetBalance } from "lib/hooks/queries/useAccountAssetBalance";
import { usePool } from "lib/hooks/queries/usePool";
import { usePoolAccountId } from "lib/hooks/queries/usePoolAccountId";
import { useSaturatedPoolsIndex } from "lib/hooks/queries/useSaturatedPoolsIndex";
import { useZtgBalance } from "lib/hooks/queries/useZtgBalance";
import { calcInGivenOut, calcOutGivenIn } from "lib/math";
import { TradeSlipItem, useTradeSlipAtom } from "lib/state/TradeSlip";
import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react";
import { FC, useMemo } from "react";
import { X } from "react-feather";
import { AmountInput } from "../ui/inputs";

export type TradeSlipBoxProps = {
  item: TradeSlipItem;
  disabled?: boolean;
  value: Decimal;
  onChange: (value: Decimal) => void;
};

const TradeSlipContainer = observer<FC<TradeSlipBoxProps>>(
  ({ item: { assetId, action }, value, onChange, disabled }) => {
    const tradeslip = useTradeSlipAtom();
    const { config, wallets } = useStore();

    const marketId = getMarketIdOf(assetId);
    const signer = wallets.activeAccount ? wallets.getActiveSigner() : null;
    const assetIndex = getIndexOf(assetId);

    const { data: pool } = usePool({ marketId });
    const { data: poolAccountId } = usePoolAccountId(pool);
    const { data: saturatedIndex } = useSaturatedPoolsIndex(pool ? [pool] : []);

    const { data: traderZtgBalance } = useZtgBalance(signer);

    const { data: traderAssetBalance } = useAccountAssetBalance(
      signer,
      assetId,
    );

    const { data: poolZtgBalance } = useAccountAssetBalance(
      { address: poolAccountId } as KeyringPairOrExtSigner,
      { Ztg: null },
    );

    const { data: poolAssetBalance } = useAccountAssetBalance(
      { address: poolAccountId } as KeyringPairOrExtSigner,
      assetId,
    );

    const saturatedData = saturatedIndex?.[pool?.poolId];
    const asset = saturatedData?.assets[assetIndex];

    const loaded = Boolean(
      pool &&
        saturatedData &&
        traderZtgBalance &&
        traderAssetBalance &&
        poolZtgBalance &&
        poolAssetBalance &&
        asset,
    );

    const tradeablePoolBalance = new Decimal(
      poolAssetBalance?.free.toString() ?? 0,
    ).mul(MAX_IN_OUT_RATIO);

    const amount = value;

    const swapFee = isIndexedData(pool)
      ? new Decimal(pool?.swapFee || 0)
      : new Decimal(pool?.swapFee.isSome ? pool.swapFee.toString() : 0);

    const ztgWeight = pool
      ? getAssetWeight(pool, { Ztg: null }).unwrap()
      : undefined;
    const assetWeight = asset
      ? getAssetWeight(pool, asset?.assetId).unwrap()
      : undefined;

    const max = useMemo(() => {
      if (!loaded) return new Decimal(0);
      const ztg = new Decimal(traderZtgBalance?.free.toString() ?? 0);
      const assets = new Decimal(traderAssetBalance?.free.toString() ?? 0);
      if (action === "buy") {
        const maxTokens = ztg.div(asset?.price ?? 0);
        if (tradeablePoolBalance?.lte(maxTokens)) {
          return tradeablePoolBalance;
        } else {
          return maxTokens;
        }
      } else {
        if (tradeablePoolBalance?.lte(assets)) {
          return tradeablePoolBalance;
        }
        return assets;
      }
    }, [traderZtgBalance, tradeablePoolBalance]);

    const traded = useMemo(() => {
      if (!loaded) return new Decimal(0);
      if (action === "buy") {
        return calcInGivenOut(
          new Decimal(poolZtgBalance?.free.toString()).div(ZTG),
          ztgWeight.div(ZTG),
          new Decimal(poolAssetBalance?.free.toString()).div(ZTG),
          assetWeight.div(ZTG),
          amount,
          swapFee.div(ZTG),
        );
      } else {
        return calcOutGivenIn(
          poolAssetBalance?.free.toString(),
          assetWeight,
          poolZtgBalance?.free.toString(),
          ztgWeight,
          amount,
          swapFee,
        );
      }
    }, [
      action,
      poolZtgBalance,
      ztgWeight,
      poolAssetBalance,
      assetWeight,
      amount,
      swapFee,
    ]);

    if (!saturatedData || !traderAssetBalance) {
      return null;
    }

    return (
      <div className="rounded-ztg-10 mb-ztg-15">
        <div className="px-ztg-16 h-ztg-30 flex items-center rounded-t-ztg-10 bg-sky-300 dark:bg-sky-700">
          <div
            className={
              "w-ztg-33 text-ztg-14-150 uppercase font-space font-bold " +
              `${action === "buy" ? "text-sunglow-2" : "text-red-crayola"}`
            }
          >
            {action}
          </div>
          <div className="text-ztg-10-150 break-words whitespace-nowrap overflow-hidden overflow-ellipsis text-gray-dark-3 text-center font-lato font-bold uppercase flex-grow mx-ztg-10">
            {saturatedData?.market.slug}
          </div>
          <div className="w-ztg-16 h-ztg-16 rounded-full bg-sky-400 dark:bg-black center">
            <X
              size={16}
              className="cursor-pointer text-sky-600"
              onClick={() => tradeslip.removeAsset(assetId)}
            />
          </div>
        </div>
        <div className="py-ztg-8 px-ztg-16 bg-white dark:bg-sky-1000 flex flex-col items-center mb-ztg-8 rounded-b-ztg-10">
          {saturatedData && saturatedData.market.status !== "Active" ? (
            <div className="text-vermilion font-lato font-bold text-ztg-12-120 h-ztg-30 center">
              Market Ended
            </div>
          ) : (
            <>
              <div className="flex items-center h-ztg-30 w-full">
                <div
                  className="w-ztg-20 h-ztg-20 rounded-full border-2 border-sky-600 flex-shrink-0"
                  style={{ background: `${asset?.category.color}` }}
                ></div>
                <div className="uppercase font-space font-bold text-ztg-14-150 ml-ztg-8 mr-ztg-10 text-black dark:text-white">
                  {asset?.category.ticker}
                </div>
                <div className="font-lato font-bold text-ztg-12-150 ml-auto text-black dark:text-white">
                  @{asset?.price.div(ZTG).toFixed(4)} {config.tokenSymbol}
                </div>
              </div>
              <div className="h-ztg-15 w-full mb-ztg-10 font-lato text-ztg-10-150 flex items-center text-gray-dark-3">
                Balance:
                <div className="text-black dark:text-white ml-1">
                  {new Decimal(traderAssetBalance?.free.toString() ?? 0)
                    .div(ZTG)
                    .toNumber()
                    .toFixed(4)}
                </div>
              </div>
              <div className="flex w-full h-ztg-34 mb-ztg-10">
                <div className="h-full w-ztg-164">
                  <AmountInput
                    disabled={disabled}
                    value={value.toString()}
                    name={""}
                    containerClass="h-full"
                    className={
                      "!h-full w-full rounded-ztg-8 text-right mb-ztg-2"
                    }
                    onChange={(val) => onChange(new Decimal(val || 0))}
                    max={max.toString()}
                  />
                </div>
                <div className="ml-ztg-10 h-full flex flex-col text-sky-600 font-lato text-ztg-10-150 text-right flex-grow">
                  {action === "sell" ? (
                    <div>To Receive</div>
                  ) : (
                    <div>To Spend:</div>
                  )}
                  <div className="font-bold text-black dark:text-white">
                    {!traded ? "---" : traded?.toFixed(4, Decimal.ROUND_DOWN)}{" "}
                    {config.tokenSymbol}
                  </div>
                </div>
              </div>
              <div className="flex w-full font-lato text-ztg-10-150 text-gray-dark-3 mt-ztg-5">
                Trading Fee:
                <div className="text-black dark:text-white ml-1">
                  {amount.mul(swapFee.div(ZTG) ?? 0).toString()}{" "}
                  {action === "sell"
                    ? asset.category.ticker?.toUpperCase()
                    : config.tokenSymbol}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  },
);

export default TradeSlipContainer;
