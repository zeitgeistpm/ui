import { Compact } from "@polkadot/types";
import type { Codec } from "@polkadot/types-codec/types";
import { BlockNumber } from "@polkadot/types/interfaces";
import SDK from "@zeitgeistpm/sdk";
import { Swap } from "@zeitgeistpm/sdk/dist/models";
import { AssetId } from "@zeitgeistpm/sdk/dist/types";
import { Asset } from "@zeitgeistpm/types/dist/interfaces/index";
import { StoreContext } from "components/context/StoreContext";
import Decimal from "decimal.js";
import { GraphQLClient } from "graphql-request";
import { endpointOptions, graphQlEndpoint, ZTG } from "lib/constants";
import { isValidPolkadotAddress } from "lib/util";
import { makeAutoObservable, runInAction } from "mobx";
import { useContext } from "react";
import validatorjs from "validatorjs";
import { extractIndexFromErrorHex } from "../../lib/util/error-table";
import { isAsset, ztgAsset } from "../types";
import { Context, Sdk } from "@zeitgeistpm/sdk-next";

export default class Store {
  initialized = false;

  get amountRegex(): RegExp | null {
    return new RegExp(`^[0-9]+(\\.[0-9]{0,10})?`);
  }

  sdk: SDK | null;
  sdkV2?: Sdk<Context> = undefined;

  blockNumber: Compact<BlockNumber> | null = null;

  unsubscribeNewHeads: () => void;

  blockTimestamp: number;

  leftDrawerClosed = false;

  rightDrawerClosed = true;

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

  constructor() {
    makeAutoObservable<this, "balanceSubscription">(this, {
      registerValidationRules: false,
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

    validatorjs.register("timestamp_gt_now", (val: string) => {
      if (typeof val !== "string") {
        return false;
      }
      return new Date().valueOf() < Number(val);
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

  async initialize() {
    await this.initSDK(endpointOptions[0].value, graphQlEndpoint);

    this.registerValidationRules();

    runInAction(() => {
      this.initialized = true;
    });
  }

  async initSDK(endpoint: string, graphQlEndpoint: string) {
    const sdk = await SDK.initialize(endpoint, {
      graphQlEndpoint,
    });

    runInAction(() => {
      this.sdk = sdk;
      this.subscribeBlock();
    });
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
      assetObj as any,
    )) as any;

    return new Decimal(b.free.toString()).div(ZTG);
  }
}

export const useStore = () => useContext(StoreContext);
