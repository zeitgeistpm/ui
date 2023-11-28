import { useQueryClient } from "@tanstack/react-query";
import { isRpcSdk, ZTG } from "@zeitgeistpm/sdk";
import FormTransactionButton from "components/ui/FormTransactionButton";
import Input from "components/ui/Input";
import Decimal from "decimal.js";
import { DEFAULT_SLIPPAGE_PERCENTAGE } from "lib/constants";
import { useMarket } from "lib/hooks/queries/useMarket";
import { usePool } from "lib/hooks/queries/usePool";
import { poolTotalIssuanceRootQueryKey } from "lib/hooks/queries/useTotalIssuanceForPools";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useEffect, useMemo, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { assetObjStringToId, PoolBalances } from "./LiquidityModal";

const JoinPoolForm = ({
  poolBalances,
  poolId,
  totalPoolShares,
  baseAssetTicker,
  onSuccess,
}: {
  poolBalances: PoolBalances;
  poolId: number;
  totalPoolShares: Decimal;
  baseAssetTicker?: string;
  onSuccess?: () => void;
}) => {
  const { register, watch, handleSubmit, setValue, getValues, formState } =
    useForm({ reValidateMode: "onChange", mode: "all" });

  const { data: pool } = usePool({ poolId });
  const [sdk, id] = useSdkv2();
  const notificationStore = useNotifications();
  const [poolSharesToReceive, setPoolSharesToReceive] = useState<Decimal>();
  const { data: market } = useMarket({ poolId });
  const queryClient = useQueryClient();

  const { send: joinPool, isLoading } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk) && pool && poolSharesToReceive) {
        const formValue = getValues();
        const maxAmountsIn = pool?.weights.map((asset) => {
          const id = assetObjStringToId(asset.assetId);
          const assetAmount = formValue[id] ?? 0;
          return assetAmount === ""
            ? "0"
            : new Decimal(assetAmount)
                .mul(ZTG)
                .mul((100 + DEFAULT_SLIPPAGE_PERCENTAGE) / 100)
                .toFixed(0);
        });

        return sdk.api.tx.swaps.poolJoin(
          poolId,
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
        queryClient.invalidateQueries([
          id,
          poolTotalIssuanceRootQueryKey,
          poolId,
        ]);
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

      if (name === "baseAssetPercentage" && changedByUser) {
        const percentage = Number(value["baseAssetPercentage"]);
        const baseBalances = poolBalances["base"];
        const userBaseAssetBalance = baseBalances.user;

        const newBaseAssetAmount = userBaseAssetBalance.mul(percentage / 100);
        const poolToInputRatio = baseBalances.pool.div(newBaseAssetAmount);
        for (const assetKey in poolBalances) {
          setValue(
            assetKey,
            poolBalances[assetKey].pool
              .div(poolToInputRatio)
              .div(ZTG)
              .toFixed(3, Decimal.ROUND_DOWN),
            { shouldValidate: true },
          );
        }
        setPoolSharesToReceive(totalPoolShares.div(poolToInputRatio));
      } else if (
        changedAsset != null &&
        userInput != null &&
        userInput !== "" &&
        changedByUser &&
        poolBalances
      ) {
        const changedAssetBalances = poolBalances[changedAsset];
        const poolToInputRatio = changedAssetBalances.pool
          .div(ZTG)
          .div(userInput);

        // recalculate asset amounts to keep ratio with user input
        for (const assetKey in poolBalances) {
          if (assetKey !== changedAsset) {
            setValue(
              assetKey,
              poolBalances[assetKey].pool
                .div(poolToInputRatio)
                .div(ZTG)
                .toFixed(3),
              { shouldValidate: true },
            );
          }
        }

        setPoolSharesToReceive(totalPoolShares.div(poolToInputRatio));

        const userBaseAssetBalance = poolBalances["base"].user;
        const baseInputAmount = getValues("base");

        setValue(
          "baseAssetPercentage",
          new Decimal(baseInputAmount)
            .div(userBaseAssetBalance.div(ZTG))
            .mul(100)
            .toString(),
        );
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, poolBalances]);

  const onSubmit: SubmitHandler<any> = () => {
    joinPool();
  };

  const prctSharesToReceive = useMemo(() => {
    if (!poolSharesToReceive) return new Decimal(0);
    return poolSharesToReceive
      .div(totalPoolShares.plus(poolSharesToReceive))
      .mul(100);
  }, [totalPoolShares, poolSharesToReceive]);

  return (
    <form
      className="flex flex-col gap-y-4 md:gap-y-6"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex max-h-[250px] flex-col gap-y-6 overflow-y-auto py-5 md:max-h-[400px]">
        {pool?.weights.map((asset, index) => {
          const id = assetObjStringToId(asset.assetId);
          const assetName =
            market?.categories?.[index]?.name ?? baseAssetTicker;
          const userAssetBalance =
            poolBalances?.[id]?.user.div(ZTG).toNumber() ?? 0;

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
                              formState.errors[id.toString()]?.message
                                ? "border-2 border-vermilion text-vermilion"
                                : ""
                            }
              `}
                key={index}
                type="number"
                step="any"
                {...register(id.toString(), {
                  value: 0,
                  required: {
                    value: true,
                    message: "Value is required",
                  },
                  validate: (value) => {
                    if (value > userAssetBalance) {
                      return `Insufficient balance. Current balance: ${userAssetBalance.toFixed(
                        3,
                      )}`;
                    } else if (value <= 0) {
                      return "Value cannot be zero or less";
                    }
                  },
                })}
              />
              <div className="mt-[4px] text-ztg-12-120 text-vermilion">
                <>{formState.errors[id.toString()]?.message}</>
              </div>
            </div>
          );
        })}
      </div>
      <input
        className="my-[20px] px-0"
        type="range"
        {...register("baseAssetPercentage", { min: 0, value: "0" })}
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
