import SDK from "@zeitgeistpm/sdk";
import { StoreContext } from "components/context/StoreContext";
import { endpointOptions, graphQlEndpoint } from "lib/constants";
import { makeAutoObservable, runInAction } from "mobx";
import { useContext } from "react";

export default class Store {
  initialized = false;

  get amountRegex(): RegExp | null {
    return new RegExp(`^[0-9]+(\\.[0-9]{0,10})?`);
  }

  sdk: SDK | null;

  constructor() {
    makeAutoObservable<this>(this);
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
}

export const useStore = () => useContext(StoreContext);
