import { useMemo } from "react";
import { useConnectedCourtParticipant } from "./useConnectedCourtParticipant";
import { useCourtTotalStakedAmount } from "./useCourtTotalStakedAmount";
import Decimal from "decimal.js";
import { ZTG } from "@zeitgeistpm/sdk";

export const useCourtStakeSharePercentage = () => {
  const totalStake = useCourtTotalStakedAmount();
  const connectedParticipant = useConnectedCourtParticipant();

  return useMemo(() => {
    if (totalStake && connectedParticipant) {
      return new Decimal(connectedParticipant.stake)
        .div(ZTG)
        .div(totalStake.all)
        .mul(100);
    }
    return new Decimal(0);
  }, [totalStake, connectedParticipant]);
};
