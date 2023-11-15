import { useQuery } from "@tanstack/react-query";
import { usePolkadotApi } from "lib/state/polkadot-api";

export const polkadotReferendumRootKey = "polkadot-referendum";

export const usePolkadotReferendum = (referendumIndex: number) => {
  const { api } = usePolkadotApi();

  const enabled = !!api;
  const query = useQuery(
    [polkadotReferendumRootKey, referendumIndex],
    async () => {
      if (enabled) {
        const referendum = await api.query.referenda.referendumInfoFor(
          referendumIndex,
        );

        console.log(referendum.unwrap().toHuman());
        console.log(referendum.unwrap().toPrimitive());
        return referendum.unwrapOr(undefined);
      }
    },
    {
      enabled: enabled,
      staleTime: 10_000,
    },
  );

  return query;
};
