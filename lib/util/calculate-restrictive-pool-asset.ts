import { ZTG } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";

export const calculateRestrictivePoolAsset = (
  poolBalances: Decimal[],
  userBalances: Decimal[],
) => {
  let restrictiveBalanceIndex: number | undefined;
  userBalances.forEach((balance, index) => {
    const poolBalance = poolBalances[index];
    const ratio = balance.div(poolBalance);

    let isRestrictive = true;
    userBalances.forEach((otherBalance, otherIndex) => {
      if (index !== otherIndex) {
        const balanceNeeded = otherBalance.mul(ratio);
        if (balanceNeeded.greaterThan(otherBalance)) {
          isRestrictive = false;
        }
      }
    });

    if (isRestrictive === true) restrictiveBalanceIndex = index;
  });

  return restrictiveBalanceIndex ?? 0;
};
