import { useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk";
import { useSdkv2 } from "lib/hooks/useSdkv2";

export const jurorsIdRootKey = "jurors";

export const useJurors = () => {
  const [sdk, id] = useSdkv2();

  const enabled = !!sdk && isRpcSdk(sdk);
  const query = useQuery(
    [id, jurorsIdRootKey],
    async () => {
      if (!enabled) return;

      const res = await sdk.api.query.court.participants.entries();

      const jurors = res.map(([address, details]) => {
        const unwrappedDetails = details.unwrapOr(undefined);
        return {
          address: (address.toHuman() as [string])[0],
          stake: unwrappedDetails?.stake.toNumber(),
          prepareExitAt: unwrappedDetails?.prepareExitAt.toString(),
          activeLock: unwrappedDetails?.activeLock.toNumber(),
          delegations: unwrappedDetails?.delegations.toString(),
        };
      });

      return jurors;
    },
    {
      enabled: enabled,
    },
  );

  return query;
};
