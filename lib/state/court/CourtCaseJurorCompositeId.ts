import { useCourtCase } from "lib/hooks/queries/court/useCourtCase";
import Opaque, { create } from "ts-opaque";

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
}) => {
  const { data: courtCase } = useCourtCase(params.caseId);

  const round = courtCase?.appeals.length;
  const roundIdentifier = round ? `-round[${round}]` : "";

  return create<CourtCaseJurorCompositeId>(
    `${params.marketId}-${params.caseId}${roundIdentifier}-${params.juror}`,
  );
};
