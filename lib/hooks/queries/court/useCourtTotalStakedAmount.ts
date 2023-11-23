import { useMemo } from "react";
import { useCourtParticipants } from "./useCourtParticipants";
import Decimal from "decimal.js";
import { ZTG } from "@zeitgeistpm/sdk";

export const useCourtTotalStakedAmount = () => {
  const { data: participants } = useCourtParticipants();

  return useMemo(() => {
    if (!participants)
      return {
        jurorTotal: new Decimal(0),
        delegatorTotal: new Decimal(0),
        all: new Decimal(0),
      };

    const jurorTotal = participants
      .filter((p) => p.type === "Juror")
      .reduce((acc, participant) => {
        return acc.add(participant.stake);
      }, new Decimal(0))
      .div(ZTG);

    const delegatorTotal = participants
      .filter((p) => p.type === "Delegator")
      .reduce((acc, participant) => {
        return acc.add(participant.stake);
      }, new Decimal(0))
      .div(ZTG);

    const all = jurorTotal.add(delegatorTotal);

    return {
      jurorTotal,
      delegatorTotal,
      all,
    };
  }, [participants]);
};
