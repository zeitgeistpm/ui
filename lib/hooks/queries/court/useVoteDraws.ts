import { ZrmlCourtDraw } from "@polkadot/types/lookup";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { Vec, u128, StorageKey } from "@polkadot/types";

export const voteDrawsRootKey = "vote-draws";

export const useVoteDrawsForCase = (caseId?: number) => {
  const [sdk, id] = useSdkv2();
  const queryClient = useQueryClient();

  const enabled = !!sdk && isRpcSdk(sdk) && caseId;

  const query = useQuery<ZrmlCourtDraw[]>(
    [id, voteDrawsRootKey, caseId],
    async () => {
      if (!enabled) return [];
      const draws = await sdk.api.query.court.selectedDraws(caseId);
      return draws.toArray();
    },
    {
      enabled: Boolean(enabled),
      initialData: () => {
        const cache = queryClient.getQueryData<
          [StorageKey<[u128]>, Vec<ZrmlCourtDraw>][]
        >([id, voteDrawsRootKey, "all"]);

        const hit = cache
          ?.find(
            ([storageKey]) => storageKey.args[0].toNumber() === caseId,
          )?.[1]
          ?.toArray();

        return hit;
      },
    },
  );

  return query;
};

export const useAllVoteDraws = () => {
  const [sdk, id] = useSdkv2();

  const enabled = !!sdk && isRpcSdk(sdk);

  const query = useQuery<[StorageKey<[u128]>, Vec<ZrmlCourtDraw>][]>(
    [id, voteDrawsRootKey, "all"],
    async () => {
      if (!enabled) return [];
      return await sdk.api.query.court.selectedDraws.entries();
    },
    {
      enabled: Boolean(enabled),
    },
  );

  return query;
};
