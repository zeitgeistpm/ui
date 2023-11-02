import { useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk";
import { isNotNull } from "@zeitgeistpm/utility/dist/null";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { ZrmlCourtCourtInfo } from "@polkadot/types/lookup";

export const courtCaseRootKey = "court-case";

export type CourtCaseInfo = {
  id: number;
  case: ZrmlCourtCourtInfo;
};

export const useCourtCase = (caseId?: number) => {
  const [sdk, id] = useSdkv2();

  const enabled = !!sdk && isRpcSdk(sdk) && caseId;

  const query = useQuery<ZrmlCourtCourtInfo | undefined>(
    [id, courtCaseRootKey],
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
