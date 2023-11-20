import { useCourtCases } from "lib/hooks/queries/court/useCourtCases";
import { useAllVoteDraws } from "lib/hooks/queries/court/useVoteDraws";
import { useChainTime } from "../chaintime";
import { useMemo } from "react";

export type CourtBacklogItem =
  | CourtCaseReadyToVoteBacklogItem
  | CourtCaseReadyToRevealBacklogItem
  | CourtCaseAwaitingVotePeriodBacklogItem;

export type CourtCaseReadyToVoteBacklogItem = {
  type: "court-case-ready-for-vote";
  caseId: number;
};

export type CourtCaseReadyToRevealBacklogItem = {
  type: "court-case-ready-for-reveal";
  caseId: number;
};

export type CourtCaseAwaitingVotePeriodBacklogItem = {
  type: "court-case-awaiting-vote-period";
  caseId: number;
};

export const useCourtBacklog = (account?: string): CourtBacklogItem[] => {
  const { data: cases } = useCourtCases();
  const { data: courtDraws } = useAllVoteDraws();
  const chainTime = useChainTime();

  let backlog: CourtBacklogItem[] = [];

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

    if (chainTime.block < voteStart) {
      drawnAsJuror.forEach((_) => {
        backlog.push({
          type: "court-case-awaiting-vote-period",
          caseId,
        });
      });
    }

    if (chainTime.block >= voteStart && chainTime.block <= voteEnd) {
      drawnAsJuror.forEach((_) => {
        backlog.push({
          type: "court-case-ready-for-vote",
          caseId,
        });
      });
    }

    if (
      chainTime.block >= aggregationStart &&
      chainTime.block <= aggregationEnd
    ) {
      drawReadyToReveal.forEach((_) => {
        backlog.push({
          type: "court-case-ready-for-reveal",
          caseId,
        });
      });
    }
  });

  const weightedBacklog = useMemo(() => {
    return backlog.sort((a, b) => {
      if (a.type === "court-case-awaiting-vote-period") {
        return -1;
      }

      if (b.type === "court-case-ready-for-reveal") {
        return 1;
      }

      return 0;
    });
  }, [backlog]);

  return weightedBacklog;
};
