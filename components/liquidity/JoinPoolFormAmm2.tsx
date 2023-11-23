import { useQueryClient } from "@tanstack/react-query";
import { isRpcSdk, ZTG } from "@zeitgeistpm/sdk";
import FormTransactionButton from "components/ui/FormTransactionButton";
import Input from "components/ui/Input";
import Decimal from "decimal.js";
import { DEFAULT_SLIPPAGE_PERCENTAGE } from "lib/constants";
import { Amm2Pool, amm2PoolKey } from "lib/hooks/queries/amm2/useAmm2Pool";
import { useBalances } from "lib/hooks/queries/useBalances";
import { lookupAssetMetadata, useMarket } from "lib/hooks/queries/useMarket";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { isPresent } from "lib/types";
import { calculateRestrictivePoolAsset } from "lib/util/calculate-restrictive-pool-asset";
import { useEffect, useMemo, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

const JoinPoolForm = ({
  marketId,
  pool,
  baseAssetTicker,
  onSuccess,
}: {
  marketId: number;
  pool: Amm2Pool;
  baseAssetTicker?: string;
  onSuccess?: () => void;
}) => {
  const wallet = useWallet();
  const { register, watch, handleSubmit, setValue, getValues, formState } =
    useForm({ reValidateMode: "onChange", mode: "all" });
  const [sdk, id] = useSdkv2();
  const notificationStore = useNotifications();
  const [poolSharesToReceive, setPoolSharesToReceive] = useState<Decimal>();
  const { data: market } = useMarket({ marketId });
  const userAssetBalances = useBalances(pool.assetIds, wallet.realAddress)
    .map((res) => res.data)
    .filter(isPresent);

  const queryClient = useQueryClient();

  const { send: joinPool, isLoading } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk) && pool && poolSharesToReceive) {
        const formValue = getValues();
        const maxAmountsIn = pool?.assetIds.map((assetId, index) => {
          const assetAmount = formValue[index] ?? 0;
          return assetAmount === ""
            ? "0"
            : new Decimal(assetAmount)
                .mul(ZTG)
                .mul((100 + DEFAULT_SLIPPAGE_PERCENTAGE) / 100)
                .toFixed(0);
        });

        return sdk.api.tx.neoSwaps.join(
          marketId,
          poolSharesToReceive.toFixed(0),
          maxAmountsIn,
        );
      }
    },
    {
      onSuccess: () => {
        notificationStore.pushNotification("Joined pool", {
          type: "Success",
        });
        queryClient.invalidateQueries([id, amm2PoolKey, marketId]);
        onSuccess?.();
      },
    },
  );

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (!name) return;
      const changedByUser = type != null;
      const changedAsset = name;
      const userInput = value[changedAsset];
      const reserves = Array.from(pool.reserves).map((reserve) => reserve[1]);
      const restrictiveIndex = calculateRestrictivePoolAsset(
        reserves,
        userAssetBalances,
      );

      const maxInForRestrictiveAsset = userAssetBalances[restrictiveIndex!];

      if (name === "percentage" && changedByUser) {
        const percentage = Number(value["percentage"]);
        const restrictiveAssetAmount = maxInForRestrictiveAsset.mul(
          percentage / 100,
        ); //todo: div 100?
        const restrictiveAssetToPoolRatio = restrictiveAssetAmount.div(
          reserves[restrictiveIndex!],
        );

        reserves.forEach((reserve, index) => {
          setValue(
            index.toString(),
            reserve
              .mul(restrictiveAssetToPoolRatio)
              .div(ZTG)
              .toFixed(3, Decimal.ROUND_DOWN),
            { shouldValidate: true },
          );
        });

        setPoolSharesToReceive(
          pool.totalShares.mul(restrictiveAssetToPoolRatio),
        );
      } else if (
        changedAsset != null &&
        userInput != null &&
        userInput !== "" &&
        changedByUser &&
        userAssetBalances
      ) {
        console.log(userInput);

        const reserve = reserves[Number(changedAsset)];
        const inputToReserveRatio = new Decimal(userInput)
          .div(reserve)
          .mul(ZTG);
        console.log("ratio", inputToReserveRatio.toString());

        let restrictedAssetAmount: Decimal | undefined;
        reserves.forEach((reserve, index) => {
          const amount = reserve.mul(inputToReserveRatio).div(ZTG);

          if (index.toString() !== changedAsset) {
            setValue(index.toString(), amount.toFixed(3, Decimal.ROUND_DOWN), {
              shouldValidate: true,
            });
          }

          if (index === restrictiveIndex) {
            restrictedAssetAmount = amount;
          }
        });
        setPoolSharesToReceive(pool.totalShares.mul(inputToReserveRatio));

        setValue(
          "percentage",
          restrictedAssetAmount
            ?.div(maxInForRestrictiveAsset.div(ZTG))
            .mul(100)
            .toString(),
        );
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, userAssetBalances, pool]);

  const onSubmit: SubmitHandler<any> = () => {
    joinPool();
  };

  const prctSharesToReceive = useMemo(() => {
    if (!poolSharesToReceive) return new Decimal(0);
    return poolSharesToReceive
      .div(pool.totalShares.plus(poolSharesToReceive))
      .mul(100);
  }, [pool.totalShares, poolSharesToReceive]);

  return (
    <form
      className="flex flex-col gap-y-4 md:gap-y-6"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex max-h-[250px] flex-col gap-y-6 overflow-y-auto py-5 md:max-h-[400px]">
        {market &&
          pool?.assetIds.map((assetId, index) => {
            const assetName = lookupAssetMetadata(market, assetId)?.name;
            const userBalance = userAssetBalances[index]?.div(ZTG).toNumber();

            return (
              <div
                key={index}
                className="relative h-[56px] w-full text-ztg-18-150 font-medium "
              >
                <div className="absolute left-[15px] top-[14px] h-full w-[40%] truncate capitalize">
                  {assetName}
                </div>
                <Input
                  className={`h-[56px] w-full rounded-[5px] bg-anti-flash-white px-[15px] text-right outline-none
                            ${
                              formState.errors[index.toString()]?.message
                                ? "border-2 border-vermilion text-vermilion"
                                : ""
                            }
              `}
                  key={index}
                  type="number"
                  step="any"
                  {...register(index.toString(), {
                    value: 0,
                    required: {
                      value: true,
                      message: "Value is required",
                    },
                    validate: (value) => {
                      if (value > userBalance) {
                        return `Insufficient balance. Current balance: ${userBalance.toFixed(
                          3,
                        )}`;
                      } else if (value <= 0) {
                        return "Value cannot be zero or less";
                      }
                    },
                  })}
                />
                <div className="mt-[4px] text-ztg-12-120 text-vermilion">
                  <>{formState.errors[index.toString()]?.message}</>
                </div>
              </div>
            );
          })}
      </div>
      <input
        className="my-[20px] px-0"
        type="range"
        {...register("percentage", { min: 0, value: "0" })}
      />
      {market?.status !== "Active" && (
        <div className="rounded-md bg-provincial-pink p-4 text-sm">
          Market is closed. Cannot provide liquidity for closed market
        </div>
      )}
      <div className="center mb-2 flex gap-2 text-sm">
        <label className="block flex-1 font-bold">
          Expected Pool Ownership
        </label>
        {prctSharesToReceive.toFixed(1)} %
      </div>

      <FormTransactionButton
        disabled={
          formState.isValid === false ||
          isLoading ||
          market?.status !== "Active"
        }
      >
        Join Pool
      </FormTransactionButton>
    </form>
  );
};

export default JoinPoolForm;
