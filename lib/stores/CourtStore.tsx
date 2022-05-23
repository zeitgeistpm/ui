import { ZTG } from "lib/constants";
import { convertBlockNumberToTimestamp } from "lib/util";
import { autorun, makeAutoObservable, runInAction } from "mobx";
import Store, { useStore } from "./Store";

type JurorStatus = "OK" | "TARDY" | null;

interface Vote {
  address: string;
  asset: any;
}

interface Juror {
  address: string;
  status?: JurorStatus;
}

export interface Case {
  marketId: number;
  marketName: string;
  endBlock: number;
  endTimestamp: number | null; // chain returns null if there are no jurors
  jurors: Juror[];
  votes: Vote[];
}

export default class CourtStore {
  cases: Case[];
  jurors: Juror[];
  activeJurorStatus: JurorStatus;
  activeJurorStake: number;

  onCaseChange = async (marketId: number) => {
    await this.reloadCase(marketId);
  };

  onJurorChange = async () => {
    this.fetchJuror();
    this.fetchJurors();
  };

  getCase = (marketId: number): Case => {
    const courtCase = this.cases?.find((c) => c.marketId === marketId);
    return courtCase;
  };

  constructor(public store: Store) {
    makeAutoObservable(this);
    autorun(() => {
      const marketDisputesLoaded =
        Object.values(this.store.markets?.markets ?? {}).length > 0 &&
        Object.values(this.store.markets?.markets ?? {}).every((market) => {
          return market.disputes;
        });

      if (marketDisputesLoaded) {
        this.fetchCases();
      }
    });

    autorun(() => {
      if (this.store.wallets.activeAccount) {
        this.fetchJuror();
        this.fetchStake();
      }
    });

    this.fetchJurors();
  }

  private fetchCases = async () => {
    const courtMarketsWithDisputes = Object.values(
      this.store.markets.markets
    ).filter((market) => market.disputes.length > 0 && market.isCourt === true);

    const casePromises: Promise<Case>[] = courtMarketsWithDisputes.map(
      (market) => this.loadCase(market.id, market.slug)
    );

    const cases = await Promise.all(casePromises);
    runInAction(async () => {
      this.cases = cases;
    });
  };

  private loadCase = async (
    marketId: number,
    marketName?: string
  ): Promise<Case> => {
    const jurorEntires =
      await this.store.sdk.api.query.court.requestedJurors.entries(marketId);
    const voteEntries = await this.store.sdk.api.query.court.votes.entries(
      marketId
    );

    const jurors: Juror[] = [];
    const votes: Vote[] = [];
    voteEntries.forEach(([key, vote]) => {
      votes.push({
        address: key.args.map((k) => k.toHuman())[1] as string,
        asset: vote.toHuman()[1],
      });
    });

    let endBlock: number;

    jurorEntires.forEach(([key, block]) => {
      jurors.push({
        address: key.args.map((k) => k.toHuman())[1] as string,
      });
      endBlock = Number(block.toString());
    });

    return {
      marketId: marketId,
      marketName: marketName,
      endBlock: endBlock,
      endTimestamp: endBlock
        ? convertBlockNumberToTimestamp(
            endBlock,
            this.store.blockNumber.toNumber(),
            this.store.config.blockTimeSec
          )
        : null,
      jurors: jurors,
      votes: votes,
    };
  };

  private reloadCase = async (marketId: number) => {
    const caseIndex = this.cases.findIndex((c) => c.marketId === marketId);

    if (caseIndex !== -1) {
      runInAction(async () => {
        this.cases[caseIndex] = await this.loadCase(marketId);
        this.cases = [...this.cases];
      });
    }
  };

  private fetchJuror = async () => {
    const juror = await this.store.sdk.api.query.court.jurors(
      this.store.wallets.activeAccount.address
    );

    runInAction(async () => {
      this.activeJurorStatus = juror.toHuman() ? "OK" : null;
    });
  };

  private fetchStake = async () => {
    const reservesCodec = await this.store.sdk.api.query.balances.reserves(
      this.store.wallets.activeAccount.address
    );

    const reserves = reservesCodec.toHuman() as {
      amount: string;
      id: string;
    }[];

    const courtReserve = reserves.find((reserve) => reserve.id === "zge/cout");

    runInAction(() => {
      if (courtReserve) {
        const courtStake = Number(courtReserve.amount.replace(",", "")) / ZTG;
        this.activeJurorStake = courtStake;
      } else {
        this.activeJurorStake = 0;
      }
    });
  };

  private fetchJurors = async () => {
    const jurorsResponse =
      await this.store.sdk.api.query.court.jurors.entries();

    const jurors: Juror[] = [];
    jurorsResponse.forEach(([key, vote]) => {
      jurors.push({
        address: key.args.map((k) => k.toHuman())[0] as string,
        //@ts-ignore
        status: vote.toHuman().status,
      });
    });

    runInAction(() => {
      this.jurors = jurors;
    });
  };
}

export const useCourtStore = () => {
  const store = useStore();
  return store.courtStore;
};
