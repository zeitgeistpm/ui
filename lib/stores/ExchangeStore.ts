import { useEffect, useMemo } from "react";
import { AssetId } from "@zeitgeistpm/sdk/dist/types";
import Decimal from "decimal.js";
import {
  IReactionDisposer,
  makeAutoObservable,
  reaction,
  runInAction,
  when,
} from "mobx";
import { calcOutGivenIn, calcSpotPrice } from "../math";
import { JSONObject, ztgAsset } from "../types";
import Store, { useStore } from "./Store";

export type OutcomeOption = {
  label: string;
  value: string;
  balance?: string;
  marketId?: number;
  marketSlug?: string;
  color?: string;
};

type MarketOutcome = {
  metadata: JSONObject;
  asset: AssetId;
  weight: number;
  baseWeight: number;
  market: { id: number; slug: string };
  poolAccount: string;
  poolId: number;
  swapFee: string;
};

export default class ExchangeStore {
  constructor(private store: Store) {
    makeAutoObservable(this, undefined, { deep: false });
  }

  outcomeOption: OutcomeOption | null = null;
  outcomeOptions: OutcomeOption[] = [];

  get hasOutcomeOptions() {
    return this.outcomeOptions.length > 0;
  }

  get weights(): number[] | undefined {
    if (this.outcome) {
      return [this.outcome.weight, this.outcome.baseWeight];
    }
  }

  get poolAccount(): string | undefined {
    return this.outcome?.poolAccount;
  }

  get poolId(): number | undefined {
    return this.outcome?.poolId;
  }

  get marketId(): number | undefined {
    return this.outcome?.market.id;
  }

  get ztgWeight(): number | undefined {
    return this.weights && this.weights[1];
  }

  get outcomeWeight(): number | undefined {
    return this.weights && this.weights[0];
  }

  get outcome(): MarketOutcome | undefined {
    return (
      this.outcomeOption &&
      this.getActiveOutcomeByAssetId(this.outcomeOption.value)
    );
  }

  get swapFee(): Decimal | undefined {
    if (this.outcome) {
      return new Decimal(this.outcome.swapFee);
    }
  }

  getActiveOutcomeByAssetId(
    assetId: AssetId | string
  ): MarketOutcome | undefined {
    const assetIdStr =
      typeof assetId === "string" ? assetId : JSON.stringify(assetId);
    assetId = typeof assetId === "string" ? JSON.parse(assetId) : assetId;

    return this.allActiveOutcomes?.find((v) => {
      const vStr = JSON.stringify(v.asset);
      return assetIdStr === vStr;
    });
  }

  allActiveOutcomes: MarketOutcome[] | null = null;

  private disposeOutcomeReaction: IReactionDisposer;

  destroy() {
    this.allActiveOutcomes = null;
    this.updateOutcomeOptions();
    this.resetBalances();
    if (this.disposeOutcomeReaction) {
      this.disposeOutcomeReaction();
    }
  }

  async initialize() {
    try {
      const res = await this.store.sdk.models.queryAllActiveAssets();

      const marketOutcomes: MarketOutcome[] = [];

      for (const r of res) {
        marketOutcomes.push({
          market: { id: r.marketId, slug: r.marketSlug },
          weight: r.weight,
          baseWeight: r.baseWeight,
          asset: r.assetId,
          metadata: r.metadata,
          poolAccount: r.poolAccount,
          poolId: r.poolId,
          swapFee: r.swapFee,
        });
      }

      runInAction(() => {
        this.allActiveOutcomes = marketOutcomes;
      });

      this.disposeOutcomeReaction = reaction(
        () => this.outcome,
        async () => {
          await this.updateBalances();
          await this.updateSpotPrice();
        }
      );
    } catch (e) {}

    await when(() => this.allActiveOutcomes != null);

    this.updateOutcomeOptions();
  }

  async updateOutcomeOptions(): Promise<OutcomeOption[]> {
    let outcomeOptions: OutcomeOption[] = [];

    if (this.allActiveOutcomes == null || this.allActiveOutcomes.length === 0) {
      runInAction(() => {
        this.outcomeOptions = [];
        this.outcomeOption = null;
      });
      return;
    }

    for (const outcome of this.allActiveOutcomes) {
      const balance = await this.store.getBalance(outcome.asset);
      outcomeOptions.push({
        value: JSON.stringify(outcome.asset),
        label: outcome.metadata["ticker"],
        color: outcome.metadata["color"],
        marketId: outcome.market.id,
        marketSlug: outcome.market.slug,
        balance: balance.toFixed(4),
      });
    }

    const changeSelected =
      this.outcomeOption == null ||
      outcomeOptions.find((o) => o.marketId === this.outcomeOption.marketId) ==
        null;

    outcomeOptions.sort((a, b) => +b.balance - +a.balance);

    runInAction(() => {
      this.outcomeOptions = outcomeOptions;

      if (changeSelected && outcomeOptions.length > 0) {
        this.setOutcomeOption(this.outcomeOptions[0]);
      }
    });

    return outcomeOptions;
  }

  async updateOutcomeBalance() {
    const outcomeOptions = [...this.outcomeOptions];
    const outcomeIndex = outcomeOptions.findIndex(
      (o) => o.value === this.outcomeOption.value
    );
    const balance = await this.store.getBalance(this.outcome.asset);

    outcomeOptions[outcomeIndex].balance = balance.toFixed(4);

    runInAction(() => {
      this.outcomeOptions = outcomeOptions;
    });
  }

  /**
   * Sets asset options for fromAsset or toAsset based on arguments.
   * If the assets end up same changes toAsset into next.
   */
  setOutcomeOption(option: OutcomeOption) {
    const opt = this.outcomeOptions.find((a) => a.value === option.value);
    this.outcomeOption = opt;
  }

  amount: Decimal | null = null;
  ztgAmount: Decimal = new Decimal(0);

  balance: Decimal | null = null;
  ztgBalance: Decimal;

  poolBalance: Decimal | null = null;
  ztgPoolBalance: Decimal | null = null;

  spotPrice: Decimal;

  get hasPoolBalances(): boolean {
    return this.poolBalance != null && this.ztgPoolBalance != null;
  }

  calcZtgAmount(): Decimal {
    return calcOutGivenIn(
      this.poolBalance.toString(),
      this.outcomeWeight,
      this.ztgPoolBalance.toString(),
      this.ztgWeight,
      this.amount?.toString() || "0",
      this.swapFee
    );
  }

  setAmount(amount?: string) {
    if (amount) {
      this.amount = new Decimal(amount);
    } else {
      this.amount = null;
    }
    if (this.hasPoolBalances) {
      this.ztgAmount = this.calcZtgAmount();
    } else {
      this.ztgAmount = new Decimal(0);
    }
  }

  resetBalances() {
    this.poolBalance = null;
    this.ztgPoolBalance = null;
    this.balance = null;
  }

  async updateAccountBalances(): Promise<void> {
    const asset = this.getActiveOutcomeByAssetId(this.outcomeOption.value);

    const balance = await this.store.getBalance(asset.asset);
    const ztgBalance = await this.store.getBalance();

    runInAction(() => {
      this.balance = balance;
      this.ztgBalance = ztgBalance;
    });
  }

  async updatePoolBalances(): Promise<void> {
    const market = await this.store.markets.getMarket(this.marketId);
    const balance = await this.store.getPoolBalance(
      market.pool,
      this.outcome.asset
    );

    const ztgBalance = await this.store.getPoolBalance(market.pool, ztgAsset);

    runInAction(() => {
      this.poolBalance = balance;
      this.ztgPoolBalance = ztgBalance;
    });
  }

  async updateBalances(): Promise<void> {
    if (this.outcome == null) {
      this.resetBalances();
      return;
    }
    await this.updatePoolBalances();
    await this.updateAccountBalances();
  }

  /**
   * Updates spotPrice and returns the value
   */
  updateSpotPrice() {
    const price = calcSpotPrice(
      this.ztgPoolBalance,
      this.ztgWeight,
      this.poolBalance,
      this.outcomeWeight,
      this.swapFee
    );
    runInAction(() => {
      this.spotPrice = price;
    });
    return price;
  }

  cost(): any {
    return this.spotPrice.mul(this.amount);
  }

  get maxProfit(): string {
    const amount = this.amount || new Decimal(0);
    return amount.sub(this.ztgAmount).toFixed(4);
  }
}

export const useExchangeStore = () => {
  const store = useStore();

  const exchange = store.exchangeStore;

  const returnExchange = useMemo<boolean>(() => {
    return store.initialized && exchange?.hasOutcomeOptions;
  }, [exchange?.outcomeOptions, store.initialized]);

  useEffect(() => {
    if (exchange?.outcomeOption == null) {
      return;
    }
    exchange.setAmount();
  }, [exchange?.outcomeOption]);

  if (returnExchange === true) {
    return exchange;
  }
  return null;
};
