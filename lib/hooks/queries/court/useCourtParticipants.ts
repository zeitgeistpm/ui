import { useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { useSdkv2 } from "lib/hooks/useSdkv2";

export const courtParticipantsRootKey = "court/participants";

export const useCourtParticipants = () => {
  const [sdk, id] = useSdkv2();

  const enabled = !!sdk && isRpcSdk(sdk);
  const query = useQuery(
    [id, courtParticipantsRootKey],
    async () => {
      if (!enabled) return;

      const res = await sdk.api.query.court.participants.entries();

      const jurors = res.map(([address, details]) => {
        const unwrappedDetails = details.unwrapOr(undefined);

        const delegations = unwrappedDetails?.delegations
          .unwrapOr(null)
          ?.map((d) => d.toString());

        return {
          address: (address.toHuman() as [string])[0],
          stake: new Decimal(unwrappedDetails?.stake.toString() ?? 0),
          prepareExitAt: unwrappedDetails?.prepareExitAt
            .unwrapOr(null)
            ?.toNumber(),
          type: unwrappedDetails?.delegations.isSome
            ? ("Delegator" as const)
            : ("Juror" as const),
          activeLock: unwrappedDetails?.activeLock.toNumber(),
          delegations: delegations,
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
