import { Compact } from "@polkadot/types";
import { BlockNumber } from "@polkadot/types/interfaces";
import { AccountInfo } from "@polkadot/types/interfaces/system";
import { Swap } from "@zeitgeistpm/sdk/dist/models";
import { AssetId } from "@zeitgeistpm/sdk/dist/types";
import { useContext } from "react";
import SDK from "@zeitgeistpm/sdk";
import { Asset } from "@zeitgeistpm/types/dist/interfaces/index";
import Decimal from "decimal.js";
import { makeAutoObservable, runInAction, when } from "mobx";
import type { Codec } from "@polkadot/types-codec/types";
import validatorjs from "validatorjs";
import { GraphQLClient } from "graphql-request";

import { StoreContext } from "components/context/StoreContext";
import { ZTG } from "lib/constants";

import { isAsset, ztgAsset } from "../types";
import UserStore from "./UserStore";
import MarketsStore from "./MarketsStore";
import NotificationStore from "./NotificationStore";
import NavigationStore from "./NavigationStore";
import TradeSlipStore from "./TradeSlipStore";
import PoolsStore from "./PoolsStore";
import ExchangeStore from "./ExchangeStore";
import CourtStore from "./CourtStore";
import Wallets from "../wallets";
import { isValidPolkadotAddress } from "lib/util";
import { extractIndexFromErrorHex } from "../../lib/util/error-table";

interface Config {
  tokenSymbol: string;
  ss58Prefix: number;
  blockTimeSec: number;
  markets: {
    reportingPeriodSec: number;
    maxDisputes: number;
    disputeBond: number; // initial dispute amount
    disputeFactor: number; // increase in bond per dispute
    disputePeriodSec: number;
    oracleBond: number;
    advisoryBond: number;
    validityBond: number;
    maxCategories: number;
    minCategories: number;
  };
  court: {
    caseDurationSec: number;
    stakeWeight: number; // increase in juror stake per juror
  };
  swaps: {
    minLiquidity: number;
  };
}

interface ZTGInfo {
  price: Decimal;
  change: Decimal;
}

export default class Store {
  userStore = new UserStore(this);
  notificationStore = new NotificationStore();
  navigationStore = new NavigationStore(this);
  tradeSlipStore = new TradeSlipStore(this);
  exchangeStore = new ExchangeStore(this);
  courtStore: CourtStore;
  wallets = new Wallets(this);
  ztgInfo: ZTGInfo;

  markets: MarketsStore;

  pools = new PoolsStore(this);

  initialized = false;

  config: Config;

  graphQLClient: GraphQLClient | null;

  get amountRegex(): RegExp | null {
    return new RegExp(`^[0-9]+(\\.[0-9]{0,10})?`);
  }

  sdk: SDK | null;

  blockNumber: Compact<BlockNumber> | null = null;

  unsubscribeNewHeads: () => void;

  blockTimestamp: number;

  ipfs;

  leftDrawerClosed = false;

  rightDrawerClosed = false;

  leftDrawerAnimating = false;

  rightDrawerAnimating = false;

  showMobileMenu = false;

  toggleDrawer(side: "right" | "left") {
    this[`${side}DrawerClosed`] = !this[`${side}DrawerClosed`];
  }

  toggleDrawerAnimation(side: "right" | "left", isAnimating: boolean) {
    if (side === "left") {
      this.leftDrawerAnimating = isAnimating;
    } else {
      this.rightDrawerAnimating = isAnimating;
    }
  }

  toggleShowMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
  }

  get isTestEnv() {
    return process.env.NEXT_PUBLIC_TESTING_ENV === "true";
  }

  constructor() {
    makeAutoObservable<this, "balanceSubscription">(this, {
      registerValidationRules: false,
      isTestEnv: false,
      unsubscribeNewHeads: false,
      balanceSubscription: false,
    });
  }

  registerValidationRules() {
    validatorjs.register(
      "amount_validation",
      (val: string) => {
        if (!val) {
          val = "0";
        }
        return +val > 0;
      },
      "Enter amount greater than zero.",
    );

    validatorjs.register("timestamp_gt_now", (val: number) => {
      if (typeof val !== "number") {
        return false;
      }
      return new Date().valueOf() < val;
    });

    validatorjs.register("gt_current_blocknum", (val: number | string) => {
      return this.blockNumber.toNumber() < Number(val);
    });

    validatorjs.register("range_outcome", (val: number | string) => {
      return +val > 0 && +val < 1;
    });

    validatorjs.register("address_input", (val: string) => {
      return isValidPolkadotAddress(val);
    });
  }

  private initializeMarkets() {
    runInAction(() => {
      this.markets = undefined;
      this.markets = new MarketsStore(this);
    });
    this.markets.updateMarketIds();
    when(
      () => this.markets?.loaded === true,
      () => {
        this.initTradeSlipStore();
        this.exchangeStore.initialize();
      },
    );
  }

  async initialize() {
    this.userStore.init();

    try {
      await this.initSDK(this.userStore.endpoint, this.userStore.gqlEndpoint);
      await this.loadConfig();
      this.initGraphQlClient();
      const storedWalletId = this.userStore.walletId;

      if (storedWalletId) {
        this.wallets.initialize(storedWalletId);
      }

      this.registerValidationRules();

      await this.pools.init();
      this.initializeMarkets();

      runInAction(() => {
        this.initialized = true;
      });
    } catch {
      this.userStore.setNextBestEndpoints(
        this.userStore.endpoint,
        this.userStore.gqlEndpoint,
      );
      this.initialize();
    }

    const priceInfo = await this.fetchZTGPrice();

    runInAction(() => {
      this.ztgInfo = priceInfo;
    });
  }

  async connectNewSDK(endpoint: string, gqlEndpoint: string) {
    await this.initSDK(endpoint, gqlEndpoint);

    this.unsubscribeNewHeads();
    this.exchangeStore.destroy();

    await this.loadConfig();
    this.initGraphQlClient();

    this.markets.unsubscribeAll();

    if (this.wallets.connected) {
      await this.userStore.loadIdentity(this.wallets.activeAccount.address);
      this.wallets.subscribeToBalanceChanges();
    }

    await this.pools.init();
    this.initializeMarkets();

    runInAction(() => {
      this.initialized = true;
    });
  }

  async initSDK(endpoint: string, graphQlEndpoint: string) {
    const ipfsClientUrl = this.isTestEnv ? "http://127.0.0.1:5001" : undefined;
    const sdk = await SDK.initialize(endpoint, {
      graphQlEndpoint,
      ipfsClientUrl,
    });

    if (sdk.graphQLClient != null) {
      this.userStore.setGqlEndpoint(graphQlEndpoint);
    } else {
      //might makes sense to throw an error in the future if we have alternative indexers
      console.error("Graphql service not available " + graphQlEndpoint);
    }

    this.userStore.setEndpoint(endpoint);

    runInAction(() => {
      this.sdk = sdk;
      this.subscribeBlock();
    });
  }

  private async initGraphQlClient() {
    if (this.userStore.gqlEndpoint && this.userStore.gqlEndpoint.length > 0) {
      this.graphQLClient = new GraphQLClient(this.userStore.gqlEndpoint, {});
    }
  }

  private async fetchZTGPrice(): Promise<ZTGInfo> {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=zeitgeist&vs_currencies=usd&include_24hr_change=true",
    );
    const json = await res.json();

    return {
      price: new Decimal(json.zeitgeist.usd),
      change: new Decimal(json.zeitgeist.usd_24h_change),
    };
  }

  private async loadConfig() {
    const [consts, properties] = await Promise.all([
      this.sdk.api.consts,
      this.sdk.api.rpc.system.properties(),
    ]);

    // minimumPeriod * 2 is fair assumption for now but need to make sure this stays up
    // to date with the chain code
    const blockTimeSec =
      (this.codecToNumber(consts.timestamp.minimumPeriod) * 2) / 1000;
    const config: Config = {
      tokenSymbol: properties.tokenSymbol
        .toString()
        .replace("[", "")
        .replace("]", ""),
      ss58Prefix: this.codecToNumber(consts.system.ss58Prefix),
      blockTimeSec: blockTimeSec,
      markets: {
        reportingPeriodSec:
          this.codecToNumber(consts.predictionMarkets.reportingPeriod) *
          blockTimeSec,
        maxDisputes: this.codecToNumber(consts.predictionMarkets.maxDisputes),
        disputeBond:
          this.codecToNumber(consts.predictionMarkets.disputeBond) / ZTG,
        disputeFactor:
          this.codecToNumber(consts.predictionMarkets.disputeFactor) / ZTG,
        disputePeriodSec:
          this.codecToNumber(consts.predictionMarkets.disputePeriod) *
          blockTimeSec,
        oracleBond:
          this.codecToNumber(consts.predictionMarkets.oracleBond) / ZTG,
        advisoryBond:
          this.codecToNumber(consts.predictionMarkets.advisoryBond) / ZTG,
        validityBond:
          this.codecToNumber(consts.predictionMarkets.validityBond) / ZTG,
        maxCategories: this.codecToNumber(
          consts.predictionMarkets.maxCategories,
        ),
        minCategories: this.codecToNumber(
          consts.predictionMarkets.minCategories,
        ),
      },
      court: {
        caseDurationSec:
          this.codecToNumber(consts.court.courtCaseDuration) * blockTimeSec,
        stakeWeight: this.codecToNumber(consts.court.stakeWeight) / ZTG,
      },
      swaps: {
        minLiquidity: this.codecToNumber(consts.swaps.minLiquidity) / ZTG,
      },
    };

    runInAction(() => {
      this.config = config;
    });
  }

  private codecToNumber(codec: Codec): number {
    return Number(codec.toString());
  }

  getTransactionError(groupIndex: number, error: number | string): string {
    const errorIndex =
      typeof error === "string" ? extractIndexFromErrorHex(error) : error;

    const { errorName, documentation } = this.sdk.errorTable.getEntry(
      groupIndex,
      errorIndex,
    );

    return documentation.length > 0
      ? documentation
      : `Transaction failed, error code: ${errorName}`;
  }

  async subscribeBlock() {
    this.unsubscribeNewHeads = await this.sdk.api.rpc.chain.subscribeNewHeads(
      async (header) => {
        const blockTs = await this.getBlockTimestamp();
        runInAction(() => {
          this.blockTimestamp = blockTs;
          this.blockNumber = header.number;
        });
      },
    );
  }

  /**
   * Returns timestamp of the latest block
   */
  async getBlockTimestamp(): Promise<number> {
    const now = await this.sdk.api.query.timestamp.now();
    return Number(now.toString());
  }

  private initTradeSlipStore() {
    this.tradeSlipStore.initialize(this.userStore.tradeSlipItems as any);
  }

  /**
   * Get either the ZTG balance or the token balance for the active account.
   */
  async getBalance(asset?: Asset | AssetId): Promise<Decimal | null> {
    if (!this.wallets.connected) {
      return new Decimal(0);
    }
    let assetObj: Asset;
    if (asset == null) {
      assetObj = (this.sdk.api as any).createType("Asset", ztgAsset);
    } else {
      assetObj = isAsset(asset)
        ? asset
        : (this.sdk.api as any).createType("Asset", asset);
    }
    if (assetObj.isZtg) {
      const { data } = (await this.sdk.api.query.system.account(
        this.wallets.activeAccount.address,
      )) as AccountInfo;
      return new Decimal(data.free.toString()).div(ZTG);
    }

    const data = await this.sdk.api.query.tokens.accounts(
      this.wallets.activeAccount.address,
      asset,
    );

    //@ts-ignore
    return new Decimal(data.free.toString()).div(ZTG);
  }

  async getPoolBalance(
    pool: Swap | string,
    asset: AssetId | Asset,
  ): Promise<Decimal> {
    let account;
    if (typeof pool === "string") {
      account = pool;
    } else {
      account = await pool.accountId();
    }

    const assetObj: Asset = isAsset(asset)
      ? asset
      : (this.sdk.api as any).createType("Asset", asset);

    if (asset == null || assetObj.isZtg) {
      const b = await this.sdk.api.query.system.account(account);
      //@ts-ignore
      return new Decimal(b.data.free.toString()).div(ZTG);
    }

    const b = (await this.sdk.api.query.tokens.accounts(
      account,
      assetObj,
    )) as any;

    return new Decimal(b.free.toString()).div(ZTG);
  }
}

export const useStore = () => useContext(StoreContext);
