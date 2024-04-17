import "@polkadot/api-augment";
import { useQuery } from "@tanstack/react-query";
import Decimal from "decimal.js";
import { usePolkadotApi } from "lib/state/polkadot-api";

export const polkadotReferendumVotesRootKey = "polkadot-referendum-votes";

export const usePolkadotReferendumVotes = (referendumIndex: number) => {
  const { api } = usePolkadotApi();

  const enabled = !!api;
  const query = useQuery(
    [polkadotReferendumVotesRootKey, referendumIndex],
    async () => {
      if (enabled) {
        const referendum =
          await api.query.referenda.referendumInfoFor(referendumIndex);

        const votes = referendum.unwrapOr(null)?.isOngoing
          ? referendum.unwrap().asOngoing.tally
          : null;

        if (!votes) return null;

        const ayes = new Decimal(votes.ayes.toString());
        const nays = new Decimal(votes.nays.toString());
        const total = ayes.plus(nays);
        return {
          ayes,
          nays,
          ayePercentage: ayes.div(total),
          nayPercentage: nays.div(total),
        };
      }
    },
    {
      enabled: enabled,
      staleTime: Infinity,
      refetchInterval: 60_000,
    },
  );

  return query;
};
