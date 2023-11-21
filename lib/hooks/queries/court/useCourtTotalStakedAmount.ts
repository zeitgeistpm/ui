import { useMemo } from "react";
import { useCourtParticipants } from "./useCourtParticipants";
import Decimal from "decimal.js";
import { ZTG } from "@zeitgeistpm/sdk";

export const useCourtTotalStakedAmount = () => {
  const { data: participants } = useCourtParticipants();

  return useMemo(() => {
    if (!participants) return new Decimal(0);

    const total = participants.reduce((acc, participant) => {
      return acc.add(participant.stake);
    }, new Decimal(0));

    return total.div(ZTG);
  }, [participants]);
};
