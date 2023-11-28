import { useWallet } from "lib/state/wallet";
import { useCourtParticipants } from "./useCourtParticipants";

export const useConnectedCourtParticipant = () => {
  const { data: participants } = useCourtParticipants();
  const wallet = useWallet();

  const participant = participants?.find(
    (p) => p.address === wallet.realAddress,
  );

  return participant;
};
