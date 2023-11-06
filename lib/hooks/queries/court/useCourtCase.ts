import { ZrmlCourtCourtInfo } from "@polkadot/types/lookup";
import { useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { isNumber } from "lodash-es";

export const courtCaseRootKey = "court-case";

export type CourtCaseInfo = {
  id: number;
  case: ZrmlCourtCourtInfo;
};

export const useCourtCase = (caseId?: number) => {
  const [sdk, id] = useSdkv2();

  const enabled = !!sdk && isRpcSdk(sdk) && isNumber(caseId);

  const query = useQuery<ZrmlCourtCourtInfo | undefined>(
    [id, courtCaseRootKey, caseId],
    async () => {
      if (!enabled) return;

      const res = await sdk.api.query.court.courts(caseId);
      const courtCase = res.unwrapOr(null);

      if (!courtCase) return;

      return courtCase;
    },
    {
      enabled: Boolean(enabled),
    },
  );

  return query;
};
