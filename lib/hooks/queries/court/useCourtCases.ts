import { useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk";
import { isNotNull } from "@zeitgeistpm/utility/dist/null";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { ZrmlCourtCourtInfo } from "@polkadot/types/lookup";

export const courtCasesRootKey = "court-cases";

export type CourtCaseInfo = {
  id: number;
  case: ZrmlCourtCourtInfo;
};

export const useCourtCases = () => {
  const [sdk, id] = useSdkv2();

  const enabled = !!sdk && isRpcSdk(sdk);

  const query = useQuery<CourtCaseInfo[]>(
    [id, courtCasesRootKey],
    async () => {
      if (!enabled) return [];

      const res = await sdk.api.query.court.courts.entries();

      const cases = res
        .map(([id, rawCase]) => {
          const courtCase = rawCase.unwrapOr(null);

          if (!courtCase) return null;

          return {
            id: id.args[0].toNumber(),
            case: courtCase,
          };
        })
        .filter(isNotNull);

      return cases;
    },
    {
      enabled: enabled,
    },
  );

  return query;
};
