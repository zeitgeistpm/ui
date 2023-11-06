import { ZrmlCourtDraw } from "@polkadot/types/lookup";
import { useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk";
import { useSdkv2 } from "lib/hooks/useSdkv2";

export const selectedDrawsRootKey = "selected-draws";

export const useSelectedDraws = (caseId?: number) => {
  const [sdk, id] = useSdkv2();

  const enabled = !!sdk && isRpcSdk(sdk) && caseId;

  const query = useQuery<ZrmlCourtDraw[]>(
    [id, selectedDrawsRootKey, caseId],
    async () => {
      if (!enabled) return [];
      const draws = await sdk.api.query.court.selectedDraws(caseId);
      return draws.toArray();
    },
    {
      enabled: Boolean(enabled),
    },
  );

  return query;
};
