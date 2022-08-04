import { Market, Swap } from "@zeitgeistpm/sdk/dist/models";
import {
  AssetId,
  isAuthorisedDisputeMechanism,
  MarketCreation,
  MarketDispute,
  MarketPeriod,
} from "@zeitgeistpm/sdk/dist/types";
import { Asset } from "@zeitgeistpm/types/dist/interfaces";
import Decimal from "decimal.js";
import moment from "moment";
import { useContext } from "react";
import { BehaviorSubject, interval, Subject, Subscription } from "rxjs";
import {
  observable,
  runInAction,
  makeObservable,
  computed,
  action,
} from "mobx";

import { MarketStoreContext } from "components/context/MarketStoreContext";

import { ZTG } from "../constants";
import { JSONObject, MarketOutcome, MarketStatus } from "../types";
import Store from "./Store";
import { calcSpotPrice } from "lib/math";
import { AssetIdFromString } from "@zeitgeistpm/sdk/dist/util";

class MarketStore {
  // is market data loaded
  loaded = false;

  private loaded$$ = new Subject<boolean>();
  loaded$ = this.loaded$$.asObservable();

  endTimestamp: number;

  disputes: MarketDispute[];

  pool: Swap | null = null;

  poolAccount: string | null = null;

  market: Market | null = null;

  get poolExists(): boolean {
    return this.pool != null;
  }

  get marketStatusString(): string {
    if (!this.loaded) {
      return "Loading market data...";
    }
    if (this.is("Resolved")) {
      return `Resolved "${this.resolvedOutcomeName}"`;
    }
    if (this.is("Disputed")) {
      return `Report of "${this.reportedOutcomeName}" is disputed`;
    }
    if (this.is("Reported")) {
      return `Reported "${this.reportedOutcomeName}"`;
    }
    if (this.inOracleReportPeriod) {
      return "Waiting for oracle report";
    }
    if (this.inReportPeriod) {
      return "Waiting for report";
    }
    if (!this.endPassed) {
      if (this.isPeriodInBlocks) {
        return `Ends at block number ${this.period["block"][1]}`;
      }
      return `Ends at ${this.endDateFormatted}`;
    }
  }

  get oracle(): string {
    return this.market.oracle;
  }

  get isOracle(): boolean {
    return this.market.oracle === this.store.wallets.activeAccount?.address;
  }

  get oracleReportPeriodPassed(): boolean {
    return this.inReportPeriod && !this.inOracleReportPeriod;
  }

  //authorised wallet address
  get authority(): string {
    if (isAuthorisedDisputeMechanism(this.market.disputeMechanism)) {
      return this.market.disputeMechanism.authorized;
    }
  }

  get disputeMechanism(): "authorized" | "other" {
    if (isAuthorisedDisputeMechanism(this.market.disputeMechanism)) {
      return "authorized";
    } else {
      return "other";
    }
  }

  get connectedWalletCanReport(): boolean {
    if (!this.store.wallets.activeAccount?.address) return false;

    if (this.inReportPeriod) {
      return (
        (this.inOracleReportPeriod && this.isOracle) ||
        (!this.inOracleReportPeriod && this.status === "Closed")
      );
    } else if (
      this.status === "Disputed" &&
      this.disputeMechanism === "authorized" &&
      this.authority === this.store.wallets.activeAccount?.address
    ) {
      return true;
    } else {
      return false;
    }
  }

  get creator(): string {
    return this.market.creator;
  }

  get inOracleReportPeriod(): boolean {
    if (!this.canReport) {
      return false;
    }
    const now = moment(this.store.blockTimestamp);
    const marketEnd = moment(this.endTimestamp);
    const periodEnd = marketEnd.clone().add(1, "day");
    return now.isBetween(marketEnd, periodEnd);
  }

  get inReportPeriod(): boolean {
    if (!this.canReport) {
      return false;
    }
    const now = moment(this.store.blockTimestamp);
    const marketEnd = moment(this.endTimestamp);
    return now.isAfter(marketEnd);
  }

  get creation(): MarketCreation {
    return this.market.creation;
  }

  get slug() {
    return this.market.slug;
  }

  get description() {
    return this.market.description;
  }

  get endDateFormatted() {
    return new Date(this.endTimestamp).toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });
  }

  get endPassed(): boolean {
    if (this.isPeriodInBlocks) {
      return this.period["block"][1] <= this.store.blockNumber;
    }
    return this.endTimestamp <= this.store.blockTimestamp;
  }

  get period(): MarketPeriod {
    return this.market.period;
  }

  get isPeriodInBlocks(): boolean {
    return this.period["block"] != null;
  }

  get isPeriodInTimestamp(): boolean {
    return this.period["timestamp"] != null;
  }

  get createdAtTimestamp(): number {
    return this.period["timestamp"]
      ? this.period["timestamp"][0]
      : this.period["block"][0] * this.store.config.blockTimeSec;
  }

  get activeDurtation(): number {
    const timeRemaining = this.endTimestamp - new Date().getTime();

    return timeRemaining > 0 ? timeRemaining / 1000 : 0;
  }

  get oracleReportDuration(): number | null {
    if (this.status === "Active" || this.market.report) {
      return null;
    }

    const timeRemaining =
      this.store.config.markets.reportingPeriodSec -
      (new Date().getTime() - this.endTimestamp) / 1000;

    return timeRemaining > 0 ? timeRemaining : 0;
  }

  get openReportDuration(): number | null {
    if (this.status === "Active" || this.market.report) {
      return null;
    }

    const timeRemaining =
      2 * this.store.config.markets.reportingPeriodSec -
      (new Date().getTime() - this.endTimestamp) / 1000;

    return timeRemaining;
  }

  get reportCooldownDuration(): number | null {
    if (!this.market.report) {
      return null;
    }
    const blockDiff =
      this.store.blockNumber.toNumber() - this.market.report?.at;

    return blockDiff > 0
      ? this.store.config.markets.disputePeriodSec -
          blockDiff * this.store.config.blockTimeSec
      : 0;
  }

  get disputeCooldownDuration(): number | null {
    if (!(this.disputes?.length > 0)) {
      return null;
    }

    const blockDiff =
      this.store.blockNumber.toNumber() -
      this.disputes[this.disputes.length - 1].at;

    return blockDiff > 0
      ? this.store.config.markets.disputePeriodSec -
          blockDiff * this.store.config.blockTimeSec
      : null;
  }

  get isCourt(): boolean {
    //@ts-ignore
    return this.market.disputeMechanism.court === null;
  }

  get bounds(): [number, number] | null {
    if (this.market.marketType.isScalar) {
      const bounds = this.market.marketType.asScalar;
      return [Number(bounds[0].toString()), Number(bounds[1].toString())];
      //@ts-ignore - marketType is inconsistent
    } else if (this.market.marketType.scalar) {
      //@ts-ignore
      return this.market.marketType.scalar;
    } else {
      return null;
    }
  }

  get reportedOutcome(): MarketOutcome {
    return this.getMarketOutcome({
      categoricalOutcome: [
        this.id,
        (this.market.report.outcome as any).toJSON().categorical,
      ],
    });
  }

  get reportedScalarOutcome(): number {
    //@ts-ignore
    return this.market.report.outcome.asScalar.toNumber();
  }

  get reportedOutcomeIndex(): number | null {
    return (
      //TODO: use type guard
      this.market.report &&
      //@ts-ignore
      this.market.report.outcome.toJSON().categorical
    );
  }

  get reportedBy(): string {
    return this.market.report?.by.toString();
  }

  get reportedAt(): string {
    return this.market.report?.at.toString();
  }

  get reportedOutcomeName(): string | null {
    return this.hasReport
      ? this.outcomesNames[this.reportedOutcomeIndex]
      : null;
  }

  get status(): MarketStatus {
    if (this.poolExists && this.assets.length === 2) {
      return "Resolved";
    }
    if (this.market.resolvedOutcome != null) {
      return "Resolved";
    }
    return this.market.status as MarketStatus;
  }

  get hasReport(): boolean {
    return this.market.report != null;
  }

  get resolvedCategoricalOutcome(): MarketOutcome | null {
    if (!this.is("Resolved") || this.type !== "categorical") return null;
    return this.marketOutcomes[0];
  }

  get resolvedScalarOutcome(): number | null {
    if (!this.is("Resolved") || this.type !== "scalar") return null;

    //@ts-ignore
    return this.market.report.outcome.asScalar.toNumber();
  }

  get resolvedOutcomeName(): string | null {
    if (this.type === "scalar") return null;

    return this.resolvedCategoricalOutcome?.metadata["name"];
  }

  get type(): "scalar" | "categorical" {
    //market type doesn't have a consistent type, this handles both scenarios
    return this.market.marketType.isCategorical ||
      //@ts-ignore
      this.market.marketType.categorical != null
      ? "categorical"
      : "scalar";
  }

  get canReport(): boolean {
    if (this.hasReport) {
      return false;
    }
    return this.is("Closed");
  }

  get outcomesNames(): string[] | undefined {
    return this.outcomesMetadata?.map((meta) => meta["name"]);
  }

  get outcomesMetadata(): JSONObject[] {
    return this.market.categories;
  }

  get question(): string {
    return this.market.question;
  }

  get tags(): string[] {
    return this.market?.tags || [];
  }

  get img(): string | undefined {
    return this.market.img;
  }

  get assets(): Asset[] {
    return this.pool?.assets;
  }

  get tradingEnabled(): boolean | null {
    if (!this.loaded) {
      return null;
    }
    return this.poolExists && this.is("Active");
  }

  get marketOutcomes(): MarketOutcome[] {
    if (!this.pool) {
      return [];
    }
    const weights = this.pool?.weights.toJSON() ?? null;
    const ztgAsset = this.assets && this.assets.slice(-1)[0].toJSON();
    const ztgWeight = weights && weights["Ztg"];
    const ztg = {
      metadata: "ztg",
      asset: ztgAsset,
      weight: ztgWeight,
    } as any;
    if (this.is("Resolved") && this.type === "categorical") {
      const asset = this.assets[0].toJSON();
      const weight = weights[JSON.stringify(asset)];
      const idInMeta = asset["categoricalOutcome"][1];
      return [
        {
          metadata: this.outcomesMetadata[idInMeta],
          asset,
          weight,
        },
        ztg,
      ];
    } else {
      return [
        ...this.outcomesMetadata.map((metadata, idx) => {
          const asset = this.assets && this.assets[idx].toJSON();
          const weight = weights && weights[JSON.stringify(asset)];
          return {
            metadata,
            asset,
            weight,
          };
        }),
        ztg,
      ];
    }
  }

  get outcomeAssetIds(): AssetId[] {
    return this.market.outcomeAssets.map((asset) =>
      AssetIdFromString(JSON.stringify(asset)),
    );
  }

  getMarketOutcome(assetId: AssetId | string): MarketOutcome {
    if (typeof assetId !== "string") {
      assetId = JSON.stringify(assetId);
    }
    return this.marketOutcomes.find((o) => {
      return JSON.stringify(o.asset) === assetId;
    });
  }

  /**
   * @param asset - asset type for balance
   * @returns balance of a pool asset
   */
  async getPoolBalance(asset?: Asset | AssetId): Promise<Decimal | null> {
    if (this.pool == null) {
      return null;
    }
    return this.store.getPoolBalance(this.pool, asset);
  }

  private createAssetFromAssetId(assetId: AssetId): Asset {
    return (this.store.sdk.api as any).createType("Asset", assetId);
  }

  async getSpotPrice(
    inAsset: AssetId,
    outAsset: AssetId,
  ): Promise<Decimal | null> {
    if (!this.poolExists) {
      return null;
    }
    const price = await this.pool.getSpotPrice(
      this.createAssetFromAssetId(inAsset),
      this.createAssetFromAssetId(outAsset),
    );

    return new Decimal(price.toNumber()).div(ZTG);
  }

  async assetPriceInZTG(assetId: AssetId): Promise<Decimal | null> {
    if (!this.poolExists) {
      return null;
    }
    const [assetBalance, ztgBalance] = await Promise.all([
      this.store.getPoolBalance(this.pool, assetId),
      this.store.getPoolBalance(this.pool, {
        ztg: null,
      }),
    ]);
    const assetWeight = this.getAssetWeight();

    const price = calcSpotPrice(
      ztgBalance,
      100000000000,
      assetBalance,
      assetWeight,
      0,
    ).toNumber();

    return new Decimal(price);
  }

  private getAssetWeight(): number {
    // outcome asset weights are all equal so just need to find one that's not ztg
    for (const [token, weight] of this.pool.weights.unwrap().entries()) {
      if (token.ztg !== null) {
        return weight.toNumber();
      }
    }
  }

  async getPrizePool(): Promise<string> {
    const prizePool = await this.store.sdk.api.query.tokens.totalIssuance(
      this.assets[0],
    );
    return new Decimal(prizePool.toString()).div(ZTG).toFixed(0);
  }

  async calcWinnings(): Promise<Decimal> {
    if (this.type === "categorical") {
      const outcome = this.resolvedCategoricalOutcome;
      if (outcome?.asset) {
        const winnings = await this.store.getBalance(outcome.asset);
        return winnings;
      } else {
        return new Decimal(0);
      }
    } else {
      const balancePromises = this.market.outcomeAssets.map((asset) =>
        this.store.getBalance(asset),
      );

      const [longBalance, shortBalance] = await Promise.all(balancePromises);
      const resolvedNumber = this.resolvedScalarOutcome;
      const lowerBound = this.bounds[0];
      const upperBound = this.bounds[1];
      const priceRange = upperBound - lowerBound;
      const resolvedNumberAsPercentage = resolvedNumber / priceRange;
      const longTokenValue = resolvedNumberAsPercentage;
      const shortTokenValue = 1 - resolvedNumberAsPercentage;
      const longRewards = longBalance.mul(longTokenValue);
      const shortRewards = shortBalance.mul(shortTokenValue);

      return longRewards.add(shortRewards);
    }
  }

  async calcPrediction(): Promise<string> {
    const prices = await Promise.all(
      this.marketOutcomes.map((outcome) => this.assetPriceInZTG(outcome.asset)),
    );
    if (this.type === "categorical") {
      let [highestPrice, highestPriceIndex] = [new Decimal(0), 0];
      prices.forEach((price, index) => {
        if (price.greaterThan(highestPrice)) {
          highestPrice = price;
          highestPriceIndex = index;
        }
      });

      return this.marketOutcomes[highestPriceIndex].metadata["ticker"];
    } else {
      const bounds = this.bounds;
      const range = new Decimal(bounds[1] - bounds[0]);

      const longPrice = prices[0];
      const shortPrice = prices[1];

      const shortPricePrediction = range
        .mul(new Decimal(1).minus(shortPrice))
        .add(bounds[0]);
      const longPricePrediction = range.mul(longPrice).add(bounds[0]);
      const averagePricePrediction = longPricePrediction
        .plus(shortPricePrediction)
        .div(2);

      return averagePricePrediction.toFixed(0);
    }
  }

  get lastDispute(): MarketDispute | null {
    const len = this.disputes?.length;
    if (len === 0 || len == null) {
      return null;
    }
    return this.disputes[len - 1];
  }

  get numDisputes(): number | undefined {
    return this.disputes?.length;
  }

  is(status: MarketStatus): boolean {
    return this.status === status;
  }

  private setLoaded() {
    this.loaded = true;
    this.loaded$$.next(true);
  }

  constructor(public store: Store, public id: number) {
    makeObservable<MarketStore, "setLoaded">(this, {
      loaded: observable,
      endTimestamp: observable,
      market: observable.ref,
      disputes: observable.ref,
      pool: observable.ref,
      poolAccount: observable,
      poolExists: computed,
      slug: computed,
      description: computed,
      assets: computed,
      tags: computed,
      oracle: computed,
      authority: computed,
      isOracle: computed,
      isCourt: computed,
      oracleReportPeriodPassed: computed,
      inOracleReportPeriod: computed,
      inReportPeriod: computed,
      hasReport: computed,
      status: computed,
      creator: computed,
      creation: computed,
      img: computed,
      endDateFormatted: computed,
      endPassed: computed,
      reportedOutcome: computed,
      reportedOutcomeIndex: computed,
      reportedOutcomeName: computed,
      resolvedCategoricalOutcome: computed,
      resolvedScalarOutcome: computed,
      reportedScalarOutcome: computed,
      resolvedOutcomeName: computed,
      canReport: computed,
      outcomesNames: computed,
      outcomesMetadata: computed,
      marketOutcomes: computed,
      numDisputes: computed,
      lastDispute: computed,
      tradingEnabled: computed,
      setLoaded: action,
      updatePool: action,
      setMarket: action,
    });
  }

  setMarket(market: Market) {
    this.market = market;
  }

  async initializeMarketData(data: Market) {
    this.setMarket(data);
    await this.updatePool();
    const disputes = await data.getDisputes();
    const endTs = await data.getEndTimestamp();
    runInAction(() => {
      this.disputes = disputes;
      this.endTimestamp = endTs;
    });
    this.subscribeToPoolChange();
    this.setLoaded();
  }

  private marketChange$$ = new BehaviorSubject<number>(0);
  marketChange$ = this.marketChange$$.asObservable();

  private nextChange() {
    let changeNum = this.marketChange$$.value + 1;
    this.marketChange$$.next(changeNum);
  }

  async refetchMarketData() {
    const data = await this.store.sdk.models.fetchMarketData(this.id);
    if (data.marketType.isCategorical === false) {
      throw new Error("Found non-categorical market.");
    }

    this.initializeMarketData(data);
    this.nextChange();
  }

  private pollSub: Subscription;
  readonly pollInterval =
    Number(process.env.NEXT_PUBLIC_MARKET_POLL_INTERVAL_MS) ?? 12000;

  startPolling = () => {
    const obs = interval(this.pollInterval);
    this.pollSub = obs.subscribe(() => {
      this.refetchMarketData();
    });
  };

  unsubscribe() {
    if (this.poolChangeUnsub != null) {
      this.poolChangeUnsub();
    }
    this.pollSub?.unsubscribe();
  }

  private poolChangeUnsub;
  private poolChange$$ = new Subject<Swap | null>();
  poolChange$ = this.poolChange$$.asObservable();

  private async subscribeToPoolChange() {
    if (this.poolChangeUnsub != null) {
      this.poolChangeUnsub();
    }
    this.poolChangeUnsub =
      await this.store.sdk.api.query.marketCommons.marketPool(
        this.id,
        async (data) => {
          if (!data.isEmpty) {
            await this.updatePool();
          }
        },
      );
  }

  async updatePool(): Promise<Swap | undefined> {
    const pool = await this.market.getPool();
    let poolAccount: string | null = null;
    if (pool) {
      poolAccount = (await pool.accountId()).toString();
      runInAction(() => {
        this.pool = pool;
        this.poolAccount = poolAccount;
      });
      this.poolChange$$.next(this.pool);
      this.nextChange();
      return pool;
    }
  }
}

export default MarketStore;

export const useMarketStore = () => useContext(MarketStoreContext);
