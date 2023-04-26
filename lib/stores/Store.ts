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

  unsubscribeNewHeads: () => void;

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
      unsubscribeNewHeads: false,
      balanceSubscription: false,
    });
  }

  async initialize() {
    await this.initSDK(endpointOptions[0].value, graphQlEndpoint);

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
    });
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
