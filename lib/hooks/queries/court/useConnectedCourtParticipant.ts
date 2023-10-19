import { useWallet } from "lib/state/wallet";
import { useParticipants } from "./useParticipants";

export const useConnectedCourtParticipant = () => {
  const { data: participants } = useParticipants();
  const wallet = useWallet();

  const participant = participants?.find(
    (p) => p.address === wallet.realAddress,
  );

  return participant;
};
