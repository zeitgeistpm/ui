import { useMarket } from "lib/hooks/queries/useMarket";
import { useChainTime } from "../chaintime";
import { useMemo } from "react";
import { getCourtStage } from "./get-stage";
import { useCourtCase } from "lib/hooks/queries/court/useCourtCases";

export const useCourtStage = ({
  marketId,
  caseId,
}: {
  marketId?: number | string;
  caseId?: number | string;
}) => {
  const chainTime = useChainTime();
  const { data: market } = useMarket({ marketId: Number(marketId) });
  const { data: courtCase } = useCourtCase(Number(caseId));

  const stage = useMemo(() => {
    if (courtCase && market && chainTime) {
      return getCourtStage(chainTime, market, courtCase);
    }
  }, [chainTime, market, courtCase]);

  return stage;
};
