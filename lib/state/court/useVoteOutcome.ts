import { CategoricalAssetId } from "@zeitgeistpm/sdk";
import { persistentAtom } from "../util/persistent-atom";
import {
  CourtCaseJurorCompositeId,
  courtCaseJurorCompositeId,
} from "./CourtCaseJurorCompositeId";
import { useWallet } from "../wallet";
import { useAtom } from "jotai";

export type UseVourtVote = {
  vote: CategoricalAssetId;
  committed: boolean;
  setVote: (assetId: CategoricalAssetId) => void;
  commitVote: () => void;
};

export type UseCourtVoteProps = {
  caseId: number;
  marketId: number;
  defaultValue: CategoricalAssetId;
};

const courtVotesAtom = persistentAtom<
  Record<
    CourtCaseJurorCompositeId,
    {
      assetId: CategoricalAssetId;
      committed: boolean;
    }
  >
>({
  key: "court-vote",
  defaultValue: {},
});

export const useCourtVote = ({
  marketId,
  caseId,
  defaultValue,
}: UseCourtVoteProps): UseVourtVote => {
  const wallet = useWallet();

  const [courtVotes, setCourtVotes] = useAtom(courtVotesAtom);

  const id = courtCaseJurorCompositeId({
    marketId,
    caseId,
    juror: wallet.realAddress!,
  });

  const setVote = (assetId: CategoricalAssetId) => {
    setCourtVotes((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        assetId,
      },
    }));
  };

  const vote = courtVotes[id];

  const commitVote = () => {
    setCourtVotes((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        committed: true,
      },
    }));
  };

  return {
    vote: vote?.assetId ?? defaultValue,
    committed: vote?.committed ?? false,
    setVote,
    commitVote,
  };
};
