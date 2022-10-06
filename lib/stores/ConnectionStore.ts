/**
 * The ConnectionStore is in charge of managing the external connections between the app and
 * outside services such as a Node's RPC Provider or SubSquid.
 */
import { endpoints, gqlEndpoints } from "lib/constants";
import { EndpointOption } from "lib/types";
import { makeAutoObservable, reaction, runInAction } from "mobx";
import Store, { useStore } from "./Store";
import { getFromLocalStorage } from "./utils/localStorage";

const getDefaultRpcEndpoint = (): string => {
  const { NEXT_PUBLIC_VERCEL_ENV } = process.env;

  if (NEXT_PUBLIC_VERCEL_ENV === 'production') {

  } else {
    // must be dev environment: default to testnet
    
  }
}

export default class ConnectionStore {
  rpcEndpoint: string;
  gqlEndpoint: string;

  // TODO: Do these need to be local variables?
  rpcEndpointKey = `endpoint-${process.env.NEXT_PUBLIC_VERCEL_ENV ?? "dev"}`;
  gqlEndpointKey = `gql-endpoint-${process.env.NEXT_PUBLIC_VERCEL_ENV ?? "dev"
    }`;

  constructor(private store: Store) {
    makeAutoObservable(this, {}, { autoBind: true, deep: false });
  }

  setRpcEndpoint(endpoint: string) {
    this.rpcEndpoint = endpoint;
  }

  setGqlEndpoint(endpoint: string) {
    this.gqlEndpoint = endpoint;
  }

  private findAltEndpoints(endpoint: string, options: EndpointOption[]) {
    // TODO
  }

  private setupEndpoints() {
    // First, check to see if the user has a preferred endpoint already in local storage.
    const rpcEndpoint = getFromLocalStorage(
      this.rpcEndpointKey,

    )
  }

}

export const useConnectionStore = () => {
  return useStore().connectionStore;
}
