import Opaque, { create } from "ts-opaque";
import { CourtAppealRound } from "./types";
import { useCourtCase } from "lib/hooks/queries/court/useCourtCases";

export type CourtCaseJurorCompositeId = Opaque<
  string,
  "CourtCaseJurorCompositeId"
>;

/**
 * This is a composite id that is used to identify a juror's vote for a particular case and the round.
 * This will be unique for each juror, case, and round of voting so that we can carry related state like
 * the committed vote, generated phrase, download of backup state etc.. for each individual round of voting.
 */
export const courtCaseJurorCompositeId = (params: {
  marketId: number;
  caseId: number;
  juror: string;
}): CourtCaseJurorCompositeId => {
  const { data: courtCase } = useCourtCase(params.caseId);

  const round = courtCase
    ? (courtCase.appeals.length as CourtAppealRound)
    : undefined;

  const roundIdentifier = round ? `-appeal-round[${round}]` : "";

  return create<CourtCaseJurorCompositeId>(
    `${params.marketId}-${params.caseId}${roundIdentifier}-${params.juror}`,
  );
};
