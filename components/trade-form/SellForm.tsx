import { MarketOutcomeAssetId, parseAssetId, ZTG } from "@zeitgeistpm/sdk-next";
import MarketContextActionOutcomeSelector from "components/markets/MarketContextActionOutcomeSelector";
import FormTransactionButton from "components/ui/FormTransactionButton";
import Input from "components/ui/Input";
import Decimal from "decimal.js";
import { useBalance } from "lib/hooks/queries/useBalance";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";

const SellForm = ({
  marketId,
  initialAsset,
}: {
  marketId: number;
  initialAsset?: MarketOutcomeAssetId;
}) => {
  const { data: constants } = useChainConstants();
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
  const { data: baseAssetBalance } = useBalance(wallet.realAddress, baseAsset);

  const outcomeAssets = market?.outcomeAssets.map(
    (assetIdString) =>
      parseAssetId(assetIdString).unwrap() as MarketOutcomeAssetId,
  );
  const [selectedAsset, setSelectedAsset] = useState<
    MarketOutcomeAssetId | undefined
  >(initialAsset ?? outcomeAssets?.[0]);

  //   const { isLoading, send, fee } = useExtrinsic(
  //     () => {
  //       const amount = getValues("amount");
  //       if (!isRpcSdk(sdk) || !amount) return;

  //       return sdk.api.tx.court.delegate(
  //         new Decimal(amount).mul(ZTG).toFixed(0),
  //         [],
  //       );
  //     },
  //     {
  //       onSuccess: () => {
  //         notificationStore.pushNotification(`Successfully traded`, {
  //           type: "Success",
  //         });
  //       },
  //     },
  //   );

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      const changedByUser = type != null;

      if (!changedByUser || !baseAssetBalance) return;

      if (name === "percentage") {
        setValue(
          "amount",
          baseAssetBalance.mul(value.percentage).div(100).div(ZTG).toNumber(),
        );
      } else if (name === "amount" && value.amount !== "") {
        setValue(
          "percentage",
          new Decimal(value.amount)
            .mul(ZTG)
            .div(baseAssetBalance)
            .mul(100)
            .toString(),
        );
      }
      trigger("amount");
    });
    return () => subscription.unsubscribe();
  }, [watch, baseAssetBalance]);

  const onSubmit = () => {
    // send();
  };
  return (
    <div className="flex flex-col w-full items-center gap-8 mt-[20px] text-ztg-18-150 font-semibold">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full flex flex-col items-center gap-y-4"
      >
        <div className="flex w-full items-center justify-center rounded-md p-2 bg-anti-flash-white">
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
              validate: (value) => {
                if (value > (baseAssetBalance?.div(ZTG).toNumber() ?? 0)) {
                  return `Insufficient balance. Current balance: ${baseAssetBalance
                    ?.div(ZTG)
                    .toFixed(3)}`;
                } else if (value <= 0) {
                  return "Value cannot be zero or less";
                }
              },
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
                  //   reset();
                  //   setTradeItem({
                  //     action: tradeItem.action,
                  //     assetId,
                  //   });
                }}
              />
            )}
          </div>
        </div>
        <div>For</div>
        <div className="h-[56px] center text-ztg-18-150 relative font-normal w-full border border-black">
          <div className="mr-auto">{1000}</div>

          <div className="mr-[10px] absolute right-0">
            {constants?.tokenSymbol}
          </div>
        </div>
        <input
          className="mt-[30px] mb-[10px] w-full"
          type="range"
          disabled={!baseAssetBalance || baseAssetBalance.lessThanOrEqualTo(0)}
          {...register("percentage", { value: "0" })}
        />
        <div className="text-vermilion text-ztg-12-120 my-[4px] h-[16px]">
          <>{formState.errors["amount"]?.message}</>
        </div>
        <div className="center font-normal text-ztg-12-120 mb-[10px] text-sky-600">
          {/* <span className="text-black ml-1">
              Network Fee: {fee ? fee.amount.div(ZTG).toFixed(3) : 0}{" "}
              {fee?.symbol}
            </span> */}
        </div>
        <FormTransactionButton
          className="w-full max-w-[250px]"
          disabled={
            formState.isValid === false
            // || isLoading
          }
          disableFeeCheck={true}
        >
          Swap
        </FormTransactionButton>
      </form>
    </div>
  );
};

export default SellForm;
