import Opaque, { create } from "ts-opaque";

export type CourtCaseJurorCompositeId = Opaque<
  string,
  "CourtCaseJurorCompositeId"
>;

export const courtCaseJurorCompositeId = (params: {
  marketId: number;
  caseId: number;
  juror: string;
}) =>
  create<CourtCaseJurorCompositeId>(
    `${params.marketId}-${params.caseId}-${params.juror}`,
  );
