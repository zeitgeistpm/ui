import { MarketOutcomeAssetId, ZTG, parseAssetId } from "@zeitgeistpm/sdk";
import MarketContextActionOutcomeSelector from "components/markets/MarketContextActionOutcomeSelector";
import FormTransactionButton from "components/ui/FormTransactionButton";
import Input from "components/ui/Input";
import Decimal from "decimal.js";
import { useAmm2Pool } from "lib/hooks/queries/amm2/useAmm2Pool";
import { useOrders } from "lib/hooks/queries/orderbook/useOrders";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { useBalance } from "lib/hooks/queries/useBalance";
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

// BUY
// max buy amount is price * base amount balance
// price needs to be worse than the best order

// SELL
// for sells, max sell amount is balance
// price needs to be worse than the best order

export const LimitBuyOrderForm = ({
  marketId,
  initialAsset,
}: {
  marketId: number;
  initialAsset?: MarketOutcomeAssetId;
}) => {
  const [sdk] = useSdkv2();
  const notificationStore = useNotifications();
  const wallet = useWallet();
  const { data: orders } = useOrders();
  const { data: market } = useMarket({
    marketId,
  });
  const outcomeAssets = market?.outcomeAssets.map(
    (assetIdString) =>
      parseAssetId(assetIdString).unwrap() as MarketOutcomeAssetId,
  );
  const [selectedAsset, setSelectedAsset] = useState<
    MarketOutcomeAssetId | undefined
  >(initialAsset ?? outcomeAssets?.[0]);
  const [price, setPrice] = useState<Decimal>();
  const baseAsset = parseAssetIdString(market?.baseAsset);

  const { data: assetMetadata } = useAssetMetadata(baseAsset);

  const { data: baseAssetBalance } = useBalance(wallet.realAddress, baseAsset);

  const maxAmount = baseAssetBalance?.div(price ?? 0) ?? new Decimal(0);

  return (
    <LimitOrderForm
      marketId={marketId}
      selectedAsset={selectedAsset}
      buttonText="Place Buy Order"
      onSubmit={() => {
        // place buy order
      }}
      onAssetChange={(asset) => {
        setSelectedAsset(asset);
      }}
      onPriceChange={(price) => {
        setPrice(price);
      }}
      maxAmount={maxAmount}
    />
  );
};

export const LimitSellOrderForm = ({
  marketId,
  initialAsset,
}: {
  marketId: number;
  initialAsset?: MarketOutcomeAssetId;
}) => {
  const { data: orders } = useOrders();

  return <LimitOrderForm marketId={marketId} buttonText="Place Buy Order" />;
};

const LimitOrderForm = ({
  marketId,
  selectedAsset,
  onAssetChange,
  onPriceChange,
  maxAmount,
  buttonText,
}: {
  marketId: number;
  selectedAsset?: MarketOutcomeAssetId; // todo: this can just be "asset" driven from parent
  maxPrice?: Decimal;
  minPrice?: Decimal;
  maxAmount?: Decimal;
  buttonText: string;
  onSubmit?: (price: Decimal, amount: Decimal) => void;
  onAssetChange?: (assetId: MarketOutcomeAssetId) => void;
  onPriceChange?: (price: Decimal) => void;
}) => {
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

  const { data: market } = useMarket({
    marketId,
  });
  const wallet = useWallet();
  const baseAsset = parseAssetIdString(market?.baseAsset);
  const { data: pool } = useAmm2Pool(marketId);

  const { data: spotPrices } = useMarketSpotPrices();
  // console.log(spotPrices);

  const { data: assetMetadata } = useAssetMetadata(baseAsset);
  const baseSymbol = assetMetadata?.symbol;

  const outcomeAssets = market?.outcomeAssets.map(
    (assetIdString) =>
      parseAssetId(assetIdString).unwrap() as MarketOutcomeAssetId,
  );
  // const [selectedAsset, setSelectedAsset] = useState<
  //   MarketOutcomeAssetId | undefined
  // >(initialAsset ?? outcomeAssets?.[0]);

  // const { data: selectedAssetBalance } = useBalance(
  //   wallet.realAddress,
  //   selectedAsset,
  // );
  const { data: baseAssetBalance } = useBalance(wallet.realAddress, baseAsset);

  // console.log(baseAssetBalance?.div(ZTG).toString());
  // console.log(selectedAssetBalance?.div(ZTG).toString());

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      const changedByUser = type != null;
      console.log(value, name);

      if (name === "price") {
        console.log("price", value.price);
        onPriceChange?.(new Decimal(value.price ?? 0));
      }
      if (
        !changedByUser ||
        // !selectedAssetBalance ||
        // selectedAssetBalance.eq(0) ||
        !maxAmount
      )
        return;

      if (name === "percentage") {
        // const max = selectedAssetBalance.greaterThan(maxAmountIn)
        //   ? maxAmountIn
        //   : selectedAssetBalance;
        const max = maxAmount;
        console.log(
          Number(
            max
              .mul(value.percentage)
              .abs()
              .div(100)
              .div(ZTG)
              .toFixed(3, Decimal.ROUND_DOWN),
          ),
        );

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
          new Decimal(value.amount).mul(ZTG).div(maxAmount).mul(100).toString(),
        );
      }
      trigger("amount");
    });
    return () => subscription.unsubscribe();
  }, [watch, maxAmount]);

  const onSubmit = () => {};
  return (
    <div className="flex w-full flex-col items-center gap-8 text-ztg-18-150 font-semibold">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full flex-col gap-y-4"
      >
        <div className="text-sm">Amount</div>

        <div className="flex w-full items-center justify-center rounded-md bg-white pr-2 font-mono">
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
                  onAssetChange?.(assetId);
                }}
              />
            )}
          </div>
        </div>
        <div className="text-sm">Price</div>
        <div className="center relative h-[56px] w-full rounded-md bg-white text-ztg-18-150 font-normal">
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
            <div className="center h-[20px] font-normal">{buttonText}</div>
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
