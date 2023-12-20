import { useCourtCases } from "lib/hooks/queries/court/useCourtCases";
import { useCourtAllVoteDraws } from "lib/hooks/queries/court/useCourtVoteDraws";
import { useChainTime } from "../chaintime";
import { useMemo } from "react";
import { sortBy } from "lodash-es";
import { useConnectedCourtParticipant } from "lib/hooks/queries/court/useConnectedCourtParticipant";

export type CourtBacklogItem = (
  | CourtCaseReadyToVoteBacklogItem
  | CourtCaseReadyToRevealBacklogItem
  | CourtCaseAwaitingVotePeriodBacklogItem
  | CourtCaseReadyToSettle
) & { weight: number };

export type CourtCaseReadyToVoteBacklogItem = {
  type: "court-case-ready-for-vote";
  caseId: number;
  actionable: true;
};

export type CourtCaseReadyToRevealBacklogItem = {
  type: "court-case-ready-for-reveal";
  caseId: number;
  actionable: true;
};

export type CourtCaseAwaitingVotePeriodBacklogItem = {
  type: "court-case-awaiting-vote-period";
  caseId: number;
  actionable: false;
};

export type CourtCaseReadyToSettle = {
  type: "court-case-ready-to-settle";
  caseId: number;
  actionable: true;
};

export const useCourtBacklog = (account?: string): CourtBacklogItem[] => {
  const { data: cases } = useCourtCases();
  const { data: courtDraws } = useCourtAllVoteDraws();
  const chainTime = useChainTime();

  let backlog: CourtBacklogItem[] = [];

  const connectedCourtParticipant = useConnectedCourtParticipant();

  courtDraws?.forEach(([caseIdStorageKey, draws]) => {
    if (!courtDraws || !cases || !chainTime) return;

    const caseId = caseIdStorageKey.args[0].toNumber();
    const courtCase = cases?.find((c) => c.id === caseId);

    if (!courtCase) return;

    const drawsForAccount = draws.filter(
      (draw) => draw.courtParticipant.toString() === account,
    );

    const drawnAsJuror = drawsForAccount.filter((draw) => draw.vote.isDrawn);

    const drawReadyToReveal = drawsForAccount.filter(
      (draw) => draw.vote.isSecret,
    );

    const voteStart = courtCase.case.roundEnds.preVote.toNumber() + 1;
    const voteEnd = courtCase.case.roundEnds.vote.toNumber();

    const aggregationStart = voteEnd + 1;
    const aggregationEnd = courtCase.case.roundEnds.aggregation.toNumber();

    if (courtCase.case.status.isClosed && connectedCourtParticipant) {
      backlog.push({
        type: "court-case-ready-to-settle",
        caseId,
        actionable: true,
        weight: 1,
      });
    }

    if (chainTime.block < voteStart) {
      drawnAsJuror.forEach((_) => {
        backlog.push({
          type: "court-case-awaiting-vote-period",
          caseId,
          actionable: false,
          weight: 0,
        });
      });
    } else if (chainTime.block >= voteStart && chainTime.block <= voteEnd) {
      drawnAsJuror.forEach((_) => {
        backlog.push({
          type: "court-case-ready-for-vote",
          caseId,
          actionable: true,
          weight: 3,
        });
      });
    } else if (
      chainTime.block >= aggregationStart &&
      chainTime.block <= aggregationEnd
    ) {
      drawReadyToReveal.forEach((_) => {
        backlog.push({
          type: "court-case-ready-for-reveal",
          caseId,
          actionable: true,
          weight: 2,
        });
      });
    }
  });

  const weightedBacklog = useMemo(() => {
    return sortBy(backlog, (item) => item.weight).reverse();
  }, [backlog]);

  return weightedBacklog;
};
