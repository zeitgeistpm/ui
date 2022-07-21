import { AssetId } from "@zeitgeistpm/sdk/dist/types";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import MobxReactForm from "mobx-react-form";
import Decimal from "decimal.js";
import { createContext, useContext } from "react";
import { interval, lastValueFrom, Subject, take } from "rxjs";
import {
  IReactionDisposer,
  makeAutoObservable,
  reaction,
  runInAction,
  when,
} from "mobx";
import { DEFAULT_SLIPPAGE_PERCENTAGE, ZTG } from "lib/constants";
import { defaultOptions, defaultPlugins } from "lib/form";
import { calcInGivenOut, calcOutGivenIn, calcSpotPrice } from "lib/math";
import { compareJSON } from "lib/util";
import { TradeType, ztgAsset } from "lib/types";
import Store from "./Store";
import MarketStore from "./MarketStore";
import {
  extractSwapWeights,
  generateSwapExactAmountInTx,
  generateSwapExactAmountOutTx,
} from "lib/util/pool";

export type TradeSlipItem = {
  type: TradeType;
  assetId: AssetId;
  assetTicker: string;
  amount: string;
  marketId: number;
  assetColor: string;
};

export const tradeSlipForm = new MobxReactForm(
  {
    fields: [
      { name: "items", value: "" },
      {
        name: "slippage",
        value: DEFAULT_SLIPPAGE_PERCENTAGE.toString(),
        rules: "required",
      },
    ],
  },
  {
    plugins: defaultPlugins,
    options: defaultOptions,
  }
);

const addFormField = (name: string) => {
  runInAction(() => {
    const formFields = tradeSlipForm.$("items");
    formFields.add({ name });
    const formField = formFields.$(name);
    formField.set("rules", "required|amount_validation");
    formField.validate();
  });
};

const removeFormField = (name: string) => {
  runInAction(() => {
    const formFields = tradeSlipForm.$("items");
    formFields.del(name);
  });
};

const getFormField = (name: string) => {
  return tradeSlipForm.$("items").$(name);
};

type TradeInfo = {
  id: number;
  assetId: AssetId;
  type: TradeType;
  amount: Decimal;
  transferAmount: Decimal;
  assetPoolBalance: Decimal;
  ztgPoolBalance: Decimal;
  ztgAccountBalance: Decimal;
  currentPrice: Decimal;
  marketId: number;
};

export class TradeSlipBoxState {
  assetPoolBalance: Decimal | null = null;
  assetBalance: Decimal | null = null;
  ztgPoolBalance: Decimal | null = null;
  assetZtgPrice: Decimal | null = null;

  init = false;
  marketStore: MarketStore | null = null;

  get marketId() {
    return this.item.marketId;
  }

  get assetId() {
    return this.item.assetId;
  }

  get type() {
    return this.item.type;
  }

  get disabled() {
    return this.marketStore?.tradingEnabled === false;
  }

  get assetTicker() {
    return this.item.assetTicker;
  }

  get assetColor() {
    return this.item.assetColor;
  }

  get tradeSlipStore() {
    return this.store.tradeSlipStore;
  }

  get maxLimit(): number | undefined {
    if (this.disabled || !this.init || this.trade?.currentPrice == null) {
      return;
    }
    if (this.type === "buy") {
      const poolBalance = this.assetPoolBalance;
      const balance = this.trade.ztgAccountBalance;
      const maxAssets = balance.div(this.trade.currentPrice);
      if (poolBalance?.lt(maxAssets)) {
        return poolBalance.sub(0.1).toNumber();
      } else {
        return maxAssets.toNumber();
      }
    } else {
      return this.assetBalance?.toNumber();
    }
  }

  get percentageDisplay(): string {
    if (this.sliderDisabled || this.amount == null) {
      return "0.00";
    }
    return this.amount?.div(this.maxLimit).mul(100).toFixed(2);
  }

  get sliderDisabled(): boolean {
    return !this.storeConnected || this.maxLimit === 0 || this.maxLimit == null;
  }

  get canLoadMarket() {
    return this.store.markets?.marketIds.length > 0;
  }

  get fieldName() {
    return JSON.stringify(
      this.assetId["categoricalOutcome"] ?? this.assetId["scalarOutcome"]
    ).replace(/[\[\]\,]/g, "_");
  }

  get formField() {
    return getFormField(this.fieldName);
  }

  get indexInSorted(): number {
    return this.tradeSlipStore.sortedTrades.findIndex((item) => {
      return compareJSON(this.assetId, item.assetId);
    });
  }

  get trade(): TradeInfo {
    return this.tradeSlipStore.sortedTrades[this.indexInSorted];
  }

  get ztgTransferAmount(): Decimal | undefined {
    return this.trade?.transferAmount;
  }

  get indexInItems(): number {
    return this.tradeSlipStore.findIndexWithAssetId(this.assetId);
  }

  constructor(public item: TradeSlipItem, public store: Store) {
    if (item.amount) {
      this.amount = new Decimal(item.amount);
    }
    makeAutoObservable<this, "setupReactions" | "disposers">(
      this,
      {
        setupReactions: false,
        dispose: false,
        disposers: false,
        tradeSlipStore: false,
      },
      { autoBind: true, deep: false }
    );

    addFormField(this.fieldName);

    this.loadMarketStore();

    when(
      () => this.init === true,
      () => {
        this.setupReactions();
      }
    );

    when(
      () => this.disabled === true,
      () => tradeSlipForm.isValid && tradeSlipForm.invalidate()
    );
  }

  dispose(updatePool: boolean = false) {
    if (updatePool) {
      this.marketStore.updatePool();
    }
    removeFormField(this.fieldName);
    this.disposers.forEach((d) => d());
  }

  private disposers: IReactionDisposer[] = [];
  private setupReactions() {
    this.disposers = [
      reaction(
        () => ({
          amount: this.amount,
        }),
        async ({ amount }) => {
          const amntString = amount?.toString();
          this.tradeSlipStore.changeItemAtIndex(
            { amount: amntString },
            this.indexInItems
          );
        }
      ),
      reaction(
        () => this.type,
        () => (this.amount = null)
      ),
      reaction(
        () => this.marketStore?.pool,
        () => this.init && this.setBalances()
      ),
    ];
  }

  updateItem(item: TradeSlipItem) {
    this.item = item;
  }

  async loadMarketStore() {
    if (!this.canLoadMarket) {
      await when(() => this.canLoadMarket);
    }

    const { markets } = this.store;
    const marketStore = await markets.getMarket(this.marketId);
    runInAction(() => {
      this.marketStore = marketStore;
    });

    if (this.marketStore?.loaded !== true) {
      await when(() => this.marketStore?.loaded === true);
    }
    await this.setBalances();
    runInAction(() => {
      this.init = true;
    });
  }

  amount: Decimal | null = null;

  setAmount(amount: string) {
    if ([""].includes(amount) || amount == null) {
      this.amount = null;
      return;
    }
    const amountDec = new Decimal(amount);
    this.amount = amountDec;
  }

  setByPercentage(percentage: number) {
    const p = new Decimal(percentage).div(100);
    const val = p.mul(this.maxLimit).toFixed(2);
    this.formField.onChange(val);
    this.setAmount(p.mul(this.maxLimit).toFixed(2));
  }

  get slug() {
    return this.marketStore.slug;
  }

  get assetStringified() {
    return JSON.stringify(this.assetId);
  }

  get storeConnected() {
    return this.store.wallets.connected;
  }

  private async setBalances() {
    const assetPoolBalance = await this.marketStore.getPoolBalance(
      this.assetId
    );
    const ztgPoolBalance = await this.marketStore.getPoolBalance(ztgAsset);
    const assetZtgPrice = await this.marketStore.assetPriceInZTG(this.assetId);
    const assetBalance = this.storeConnected
      ? await this.store.getBalance(this.assetId)
      : null;
    runInAction(() => {
      this.assetPoolBalance = assetPoolBalance;
      this.assetZtgPrice = assetZtgPrice;
      this.assetBalance = assetBalance;
      this.ztgPoolBalance = ztgPoolBalance;
    });
  }
}

class BoxStates {
  records: TradeSlipBoxState[] = [];

  push(item: TradeSlipItem) {
    const itemStore = new TradeSlipBoxState(item, this.store);
    this.records.push(itemStore);
  }

  remove(idx: number, shouldUpdatePool: boolean = false) {
    if (idx >= this.records.length) {
      return;
    }
    const rec = this.records[idx];
    rec.dispose(shouldUpdatePool);
    this.records = [
      ...this.records.slice(0, idx),
      ...this.records.slice(idx + 1),
    ];
  }

  removeAtIndexes(indexes: number[], shouldUpdatePools: boolean = false) {
    const res = [];
    for (const id of Object.keys(this.records)) {
      const idNum = Number(id);
      if (indexes.includes(idNum)) {
        this.records[idNum].dispose(shouldUpdatePools);
        continue;
      }
      res.push(this.records[idNum]);
    }
    this.records = res;
  }

  clear() {
    this.records.forEach((r) => {
      r.dispose(true);
    });
    this.records = [];
  }

  constructor(private store: Store) {}
}

export default class TradeSlipStore {
  tradeSlipItems: TradeSlipItem[] = [];

  focusedItem: TradeSlipItem | null = null;

  recheckScrollbar: Subject<void> = new Subject();
  txs: any = [];
  batchTx: SubmittableExtrinsic<"promise", ISubmittableResult> | null = null;

  txFee = new Decimal(0);
  totalCost = new Decimal(0);

  sortedTrades: TradeInfo[] = [];

  async calculateSortedTrades(items: TradeSlipItem[]): Promise<TradeInfo[]> {
    items = [...items];
    const buys = items.filter((i) => i.type === "buy");
    const sells = items.filter((i) => i.type === "sell");

    buys.sort((a, b) => {
      return Number(a.amount) - Number(b.amount);
    });
    sells.sort((a, b) => {
      return Number(b.amount) - Number(a.amount);
    });
    items = [...sells, ...buys];

    const trades: TradeInfo[] = [];
    const { records } = this.boxStates;

    for (const [id, item] of Array.from(items.entries())) {
      // assueming all boxStates are loaded market data etc.
      const boxState = records.find((s) =>
        compareJSON(item.assetId, s.assetId)
      );
      await boxState.loadMarketStore();
      const { marketStore, assetId, type } = boxState;
      let { amount } = boxState;
      const { id: marketId } = marketStore;
      const { pool } = marketStore;

      let transferAmount: Decimal;
      let ztgPoolBalance: Decimal;
      let assetPoolBalance: Decimal;
      let ztgAccountBalance: Decimal;
      let currentPrice: Decimal;

      if (amount == null || amount.eq(0)) {
        transferAmount = new Decimal(0);
        amount = new Decimal(0);
      }

      const ztg = marketStore.getMarketOutcome(ztgAsset);
      const ztgWeight = ztg.weight;
      const asset = marketStore.getMarketOutcome(assetId);
      const assetWeight = asset.weight;

      assetPoolBalance = boxState.assetPoolBalance;
      if (id === 0) {
        ztgAccountBalance = this.store.wallets.activeBalance;
        ztgPoolBalance = boxState.ztgPoolBalance;
      } else {
        const lastItem = [...trades].pop();
        const otherSameMarketTrades = trades.filter(
          (v) => v.marketId === marketId
        );
        const hasMoreSameMarketTrades = otherSameMarketTrades.length > 0;

        if (!hasMoreSameMarketTrades) {
          ztgPoolBalance = boxState.ztgPoolBalance;
        } else {
          const lastSameMarketItemIndex = otherSameMarketTrades.findLastIndexOf(
            (v) => {
              return v.marketId === marketId;
            }
          );
          const lastSameMarketItem =
            otherSameMarketTrades[lastSameMarketItemIndex];
          if (lastSameMarketItem.type === "sell") {
            ztgPoolBalance = lastSameMarketItem.ztgPoolBalance.sub(
              lastSameMarketItem.transferAmount
            );
          } else {
            ztgPoolBalance = lastSameMarketItem.ztgPoolBalance.add(
              lastSameMarketItem.transferAmount
            );
          }
        }

        if (lastItem.type === "sell") {
          ztgAccountBalance = lastItem.ztgAccountBalance.add(
            lastItem.transferAmount
          );
        } else {
          ztgAccountBalance = lastItem.ztgAccountBalance.sub(
            lastItem.transferAmount
          );
        }
      }

      // transferAmount is undefined if amount is set by user
      if (transferAmount == null) {
        if (type === "buy") {
          transferAmount = calcInGivenOut(
            ztgPoolBalance,
            ztgWeight,
            assetPoolBalance,
            assetWeight,
            amount,
            pool.swapFee
          );
          currentPrice = calcSpotPrice(
            ztgPoolBalance,
            ztgWeight,
            assetPoolBalance,
            assetWeight,
            0
          );
        } else {
          transferAmount = calcOutGivenIn(
            assetPoolBalance,
            assetWeight,
            ztgPoolBalance,
            ztgWeight,
            amount,
            pool.swapFee
          );
          currentPrice = calcSpotPrice(
            assetPoolBalance,
            assetWeight,
            ztgPoolBalance,
            ztgWeight,
            0
          );
        }
      }
      trades.push({
        id,
        type,
        amount,
        assetId,
        assetPoolBalance,
        ztgPoolBalance,
        ztgAccountBalance,
        transferAmount,
        currentPrice,
        marketId,
      });
    }
    return trades;
  }

  txInProgress = false;

  setTxInProgress(inProgress: boolean) {
    this.txInProgress = inProgress;
  }

  itemsUpdating = false;
  slippagePercentage: Decimal = new Decimal(DEFAULT_SLIPPAGE_PERCENTAGE);

  setSlippagePercentage(val: string) {
    try {
      const v = new Decimal(val);
      this.slippagePercentage = v;
    } catch {
      this.slippagePercentage = new Decimal(DEFAULT_SLIPPAGE_PERCENTAGE);
    }
  }

  constructor(private store: Store) {
    makeAutoObservable<TradeSlipStore, "boxStates">(
      this,
      {
        boxStates: false,
      },
      { deep: false, autoBind: true }
    );

    this.setupReactions();
  }

  private setupReactions() {
    reaction(
      () => this.sortedTrades,
      (trades) => {
        this.createTransactions(trades);
      }
    );

    reaction(
      () => ({
        items: this.tradeSlipItems,
        acc: this.store.wallets.activeAccount,
      }),
      async ({ items, acc }, prev) => {
        if (acc == null) {
          return;
        }
        this.setItemsUpdating(true);
        const { records } = this.boxStates;
        await when(() => records.every((r) => r.init === true));
        const sortedTrades = await this.calculateSortedTrades(items);
        runInAction(() => {
          this.sortedTrades = sortedTrades;
        });
        if (prev?.acc != null && acc.address !== prev.acc.address) {
          tradeSlipForm.$("items").each((field) => {
            field.validate({ showErrors: true });
          });
        }
        this.setItemsUpdating(false);
      },
      { fireImmediately: true }
    );

    reaction(
      () => this.txs,
      (txs: any[]) => {
        if (txs.length === 0 || txs.some((t) => t == null)) {
          runInAction(() => {
            this.batchTx = null;
          });
          return;
        }
        runInAction(() => {
          this.batchTx = this.store.sdk.api.tx.utility.batch(this.txs);
        });
      }
    );

    reaction(
      () => ({
        batchTx: this.batchTx,
        activeAccount: this.store.wallets.activeAccount,
      }),
      async ({ batchTx, activeAccount }) => {
        let total = new Decimal(0);
        if (batchTx == null || activeAccount == null) {
          runInAction(() => {
            this.txFee = new Decimal(0);
            this.totalCost = total;
          });
          return;
        }
        const paymentInfo = await batchTx.paymentInfo(activeAccount.address);

        const partialFee = new Decimal(paymentInfo.partialFee.toNumber()).div(
          ZTG
        );

        runInAction(() => (this.txFee = partialFee));

        for (const rec of this.boxStates.records) {
          if (rec.type === "buy") {
            total = total.add(rec.ztgTransferAmount);
          } else {
            total = total.sub(rec.ztgTransferAmount);
          }
        }

        total = total.add(partialFee);

        runInAction(() => {
          this.totalCost = total;
        });
      }
    );
  }

  get insufficientZtg(): boolean {
    if (!this.store.wallets.connected) {
      return true;
    }
    if (this.totalCost.isNaN()) {
      return true;
    }
    const balance = this.store.wallets.activeBalance;
    if (balance.lt(this.txFee) || balance.lt(this.totalCost)) {
      return true;
    }
    return false;
  }

  setItemsUpdating(updating: boolean) {
    this.itemsUpdating = updating;
  }

  private boxStates = new BoxStates(this.store);

  getBoxState(idx: number) {
    return this.boxStates.records[idx];
  }

  async createTransaction(item: TradeInfo): Promise<any> {
    const amount = item.amount ? new Decimal(item.amount) : new Decimal(0);
    if (amount.eq(0)) {
      return;
    }
    const market = await this.store.markets.getMarket(item.marketId);
    if (!market.tradingEnabled) {
      return;
    }
    const { pool } = market;
    const tradeAsset = item.assetId;
    const tradeAmount = amount.mul(ZTG);

    const { assetWeight, baseWeight } = extractSwapWeights(
      pool,
      tradeAsset,
      "Ztg"
    );

    if (item.type === "buy") {
      const maxAssetIn = item.ztgAccountBalance.mul(ZTG);
      if (maxAssetIn.lte(0)) {
        return;
      }

      return generateSwapExactAmountOutTx(
        this.store.sdk.api,
        ztgAsset,
        tradeAsset,
        item.ztgPoolBalance.mul(ZTG),
        baseWeight,
        item.assetPoolBalance.mul(ZTG),
        assetWeight,
        tradeAmount,
        new Decimal(pool.swapFee),
        this.slippagePercentage.div(100),
        pool.poolId
      );
    }
    if (item.type === "sell") {
      return generateSwapExactAmountInTx(
        this.store.sdk.api,
        tradeAsset,
        ztgAsset,
        item.assetPoolBalance.mul(ZTG),
        assetWeight,
        item.ztgPoolBalance.mul(ZTG),
        baseWeight,
        tradeAmount,
        new Decimal(pool.swapFee),
        this.slippagePercentage.div(100),
        pool.poolId
      );
    }
  }

  async createTransactions(trades: TradeInfo[]) {
    const txs = [];
    for (const item of trades) {
      txs.push(await this.createTransaction(item));
    }
    runInAction(() => {
      this.txs = txs;
    });
    return txs;
  }

  clearTransactions() {
    this.txs = [];
  }

  clearItems() {
    // important order of execution - first dispose everything than set empty
    // items
    this.boxStates.clear();
    this.tradeSlipItems = [];
    this.clearTransactions();
  }

  initialize(items: TradeSlipItem[]) {
    const filteredItems = items.filter((i) => {
      return this.store.markets.marketIds.includes(i.marketId);
    });
    this.tradeSlipItems = filteredItems;
    const boxStatesRecords: TradeSlipBoxState[] = [];
    for (const item of this.tradeSlipItems) {
      const s = new TradeSlipBoxState(item, this.store);
      boxStatesRecords.push(s);
    }
    this.boxStates.records = boxStatesRecords;
  }

  async setFocusedAssetId(item: TradeSlipItem) {
    await lastValueFrom(interval(5).pipe(take(1)));
    runInAction(() => (this.focusedItem = item));
  }

  unfocusItem() {
    this.focusedItem = null;
  }

  addItem(item: TradeSlipItem) {
    this.tradeSlipItems = [...this.tradeSlipItems, item];
    this.boxStates.push(item);
  }

  removeItem(item: TradeSlipItem) {
    const idx = this.findIndexWithAssetId(item.assetId);
    this.removeItemAtIndex(idx);
  }

  removeItemWithAssetId(assetId: AssetId) {
    const idx = this.findIndexWithAssetId(assetId);
    this.removeItemAtIndex(idx);
  }

  removeItemAtIndex(index: number, shouldUpdatePool = false) {
    this.boxStates.remove(index, shouldUpdatePool);
    this.tradeSlipItems = [
      ...this.tradeSlipItems.slice(0, index),
      ...this.tradeSlipItems.slice(index + 1),
    ];
  }

  removeItemsAtIndexes(indexes: number[], shouldUpdatePool = false) {
    const res = [];
    this.boxStates.removeAtIndexes(indexes, shouldUpdatePool);
    for (const id of Object.keys(this.tradeSlipItems)) {
      const idNum = Number(id);
      if (indexes.includes(idNum)) {
        continue;
      }
      res.push(this.tradeSlipItems[+id]);
    }
    this.tradeSlipItems = res;
  }

  changeItemAtIndex(itemProps: Partial<TradeSlipItem>, index: number) {
    let { tradeSlipItems } = this;
    const item = tradeSlipItems[index];
    const updatedItem = { ...item, ...itemProps };

    this.tradeSlipItems = [
      ...tradeSlipItems.slice(0, index),
      updatedItem,
      ...tradeSlipItems.slice(index + 1),
    ];
    this.boxStates.records[index].updateItem(updatedItem);
  }

  assetActive(asset: AssetId): boolean {
    return this.findIndexWithAssetId(asset) != -1;
  }

  findIndexWithAssetId(assetId: AssetId): number {
    return this.tradeSlipItems.findIndex((item) => {
      return compareJSON(assetId, item.assetId);
    });
  }

  findItemWithAssetId(assetId: AssetId): TradeSlipItem | undefined {
    return this.tradeSlipItems.find((item) => {
      return compareJSON(assetId, item.assetId);
    });
  }
}

export const TradeSlipStoreContext = createContext<TradeSlipStore | null>(null);

export const useTradeSlipStore = () => useContext(TradeSlipStoreContext);
