import { useQuery } from "@tanstack/react-query";
import { ZTG, isRpcSdk } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { useSdkv2 } from "lib/hooks/useSdkv2";

export const yearlyInflationRootKey = "court/yearlyInflation";

export const useCourtYearlyInflation = () => {
  const [sdk, id] = useSdkv2();

  const enabled = !!sdk && isRpcSdk(sdk);

  return useQuery(
    [id, yearlyInflationRootKey],
    async () => {
      if (enabled) {
        const yearlyInflation = await sdk.api.query.court.yearlyInflation();
        return new Decimal(yearlyInflation.toString()).div(10000000);
      }
    },
    {
      enabled,
      initialData: new Decimal(0),
    },
  );
};

export const yearlyInflationAmountRootKey = "court/yearlyInflationAmount";

export const useCourtYearlyInflationAmount = () => {
  const [sdk, id] = useSdkv2();

  const enabled = !!sdk && isRpcSdk(sdk);

  return useQuery(
    [id, yearlyInflationAmountRootKey],
    async () => {
      if (enabled) {
        const [yearlyInflation, totalZtgIssuance] = await Promise.all([
          sdk.api.query.court.yearlyInflation(),
          sdk.api.query.balances.totalIssuance(),
        ]);

        const yearlyInflationAmount = new Decimal(yearlyInflation.toString())
          .div(10 ** 9)
          .mul(totalZtgIssuance.toString())
          .div(ZTG);

        return yearlyInflationAmount;
      }
    },
    {
      enabled,
      initialData: new Decimal(0),
    },
  );
};
