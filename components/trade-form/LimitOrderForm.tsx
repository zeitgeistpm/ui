import { MarketOutcomeAssetId, ZTG, parseAssetId } from "@zeitgeistpm/sdk";
import MarketContextActionOutcomeSelector from "components/markets/MarketContextActionOutcomeSelector";
import FormTransactionButton from "components/ui/FormTransactionButton";
import Input from "components/ui/Input";
import Decimal from "decimal.js";
import { useAmm2Pool } from "lib/hooks/queries/amm2/useAmm2Pool";
import { useOrders } from "lib/hooks/queries/orderbook/useOrders";
import { useAmm2MarketSpotPrices } from "lib/hooks/queries/useAmm2MarketSpotPrices";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useMarketSpotPrices } from "lib/hooks/queries/useMarketSpotPrices";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

// for buys, max buy is price * base amount balanace
// for sells, max sell is balance
// default price to spot price

const LimitOrderForm = ({
  marketId,
  initialAsset,
}: {
  marketId: number;
  initialAsset?: MarketOutcomeAssetId;
}) => {
  const { data: orders } = useOrders();
  const {
    register,
    handleSubmit,
    getValues,
    formState,
    watch,
    setValue,
    trigger,
  } = useForm({
    reValidateMode: "onChange",
    mode: "onChange",
  });
  const [sdk] = useSdkv2();
  const notificationStore = useNotifications();
  const { data: market } = useMarket({
    marketId,
  });
  const wallet = useWallet();
  const baseAsset = parseAssetIdString(market?.baseAsset);
  const { data: pool } = useAmm2Pool(marketId);

  const { data: spotPrices } = useMarketSpotPrices();
  console.log(spotPrices);

  const { data: assetMetadata } = useAssetMetadata(baseAsset);
  const baseSymbol = assetMetadata?.symbol;

  const outcomeAssets = market?.outcomeAssets.map(
    (assetIdString) =>
      parseAssetId(assetIdString).unwrap() as MarketOutcomeAssetId,
  );
  const [selectedAsset, setSelectedAsset] = useState<
    MarketOutcomeAssetId | undefined
  >(initialAsset ?? outcomeAssets?.[0]);

  const selectedAssetBalance = new Decimal(ZTG);

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      const changedByUser = type != null;

      if (
        !changedByUser ||
        !selectedAssetBalance ||
        selectedAssetBalance.eq(0)
        // ||
        // !maxAmountIn
      )
        return;

      if (name === "percentage") {
        // const max = selectedAssetBalance.greaterThan(maxAmountIn)
        //   ? maxAmountIn
        //   : selectedAssetBalance;
        const max = selectedAssetBalance;
        setValue(
          "amount",
          Number(
            max
              .mul(value.percentage)
              .abs()
              .div(100)
              .div(ZTG)
              .toFixed(3, Decimal.ROUND_DOWN),
          ),
        );
      } else if (name === "amount" && value.amount !== "") {
        setValue(
          "percentage",
          new Decimal(value.amount)
            .mul(ZTG)
            .div(selectedAssetBalance)
            .mul(100)
            .toString(),
        );
      }
      trigger("amount");
    });
    return () => subscription.unsubscribe();
  }, [watch, selectedAssetBalance]);

  const onSubmit = () => {};
  return (
    <div className="flex w-full flex-col items-center gap-8 text-ztg-18-150 font-semibold">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full flex-col gap-y-4"
      >
        <div className="text-sm">Amount</div>

        <div className="flex w-full items-center justify-center rounded-md bg-anti-flash-white pr-2 font-mono">
          <Input
            type="number"
            className="w-full bg-transparent outline-none"
            step="any"
            {...register("amount", {
              value: 0,
              required: {
                value: true,
                message: "Value is required",
              },
              //   validate: (value) => {
              //     if (value > (selectedAssetBalance?.div(ZTG).toNumber() ?? 0)) {
              //       return `Insufficient balance. Current balance: ${selectedAssetBalance
              //         ?.div(ZTG)
              //         .toFixed(3)}`;
              //     } else if (value <= 0) {
              //       return "Value cannot be zero or less";
              //     } else if (maxAmountIn?.div(ZTG)?.lessThanOrEqualTo(value)) {
              //       return `Maximum amount that can be traded is ${maxAmountIn
              //         .div(ZTG)
              //         .toFixed(3)}`;
              //     }
              //   },
            })}
          />
          <div>
            {market && selectedAsset && (
              <MarketContextActionOutcomeSelector
                market={market}
                selected={selectedAsset}
                options={outcomeAssets}
                onChange={(assetId) => {
                  setSelectedAsset(assetId);
                }}
              />
            )}
          </div>
        </div>
        <div className="text-sm">Price</div>
        <div className="center relative h-[56px] w-full rounded-md bg-anti-flash-white text-ztg-18-150 font-normal">
          <Input
            type="number"
            className="w-full bg-transparent font-mono outline-none"
            step="any"
            {...register("price", {
              value: 0,
              required: {
                value: true,
                message: "Value is required",
              },
              //   validate: (value) => {
              //     if (value > (maxSpendableBalance?.div(ZTG).toNumber() ?? 0)) {
              //       return `Insufficient balance (${maxSpendableBalance
              //         ?.div(ZTG)
              //         .toFixed(3)}${baseSymbol})`;
              //     } else if (value <= 0) {
              //       return "Value cannot be zero or less";
              //     } else if (maxAmountIn?.div(ZTG)?.lessThanOrEqualTo(value)) {
              //       return `Maximum amount of ${baseSymbol} that can be traded is ${maxAmountIn
              //         .div(ZTG)
              //         .toFixed(3)}`;
              //     }
              //   },
            })}
          />
          <div className="absolute right-0 mr-[10px]">{baseSymbol}</div>
        </div>
        <input
          className="mb-[10px] mt-[30px] w-full"
          type="range"
          //   disabled={
          //     !maxSpendableBalance || maxSpendableBalance.lessThanOrEqualTo(0)
          //   }
          {...register("percentage", { value: "0" })}
        />
        <div className="mb-[10px] flex w-full flex-col items-center gap-2 text-xs font-normal text-sky-600 ">
          {/* <div className="h-[16px] text-xs text-vermilion">
            <>{formState.errors["amount"]?.message}</>
          </div>
          <div className="flex w-full justify-between">
            <div>Max profit:</div>
            <div className="text-black">
              {maxProfit.div(ZTG).toFixed(2)} {baseSymbol}
            </div>
          </div>
          <div className="flex w-full justify-between">
            <div>Price after trade:</div>
            <div className="text-black">
              {newSpotPrice?.toFixed(2)} ({priceImpact?.toFixed(2)}%)
            </div>
          </div> */}
        </div>
        <FormTransactionButton
          className="w-full max-w-[250px]"
          //   disabled={formState.isValid === false || isLoading}
          disableFeeCheck={true}
        >
          <div>
            <div className="center h-[20px] font-normal">Place Order</div>
            {/* <div className="center h-[20px] text-ztg-12-120 font-normal">
              Network fee:{" "}
              {formatNumberCompact(fee?.amount.div(ZTG).toNumber() ?? 0)}{" "}
              {fee?.symbol}
            </div> */}
          </div>
        </FormTransactionButton>
      </form>
    </div>
  );
};

export default LimitOrderForm;
