import { makeAutoObservable, reaction, runInAction } from "mobx";
import { JSONObject, Primitive } from "lib/types";
import Store, { useStore } from "./Store";
import { endpoints } from "lib/constants";
import ipRangeCheck from "ip-range-check";

export default class UserStore {
  locationAllowed: boolean;
  isUsingVPN: boolean;
  endpointKey = `endpoint-${process.env.NEXT_PUBLIC_VERCEL_ENV ?? "dev"}`;
  qglEndpointKey = `gql-endpoint-${
    process.env.NEXT_PUBLIC_VERCEL_ENV ?? "dev"
  }`;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true, deep: false });
  }

  async checkIP() {
    const response = await fetch(`/api/location`);
    const json = await response.json();

    const notAllowedCountries: string[] = JSON.parse(
      process.env.NEXT_PUBLIC_NOT_ALLOWED_COUNTRIES ?? "[]",
    );

    const userCountry: string = json.body.country;
    const locationAllowed = !notAllowedCountries.includes(userCountry);

    const ip = json.body.ip;
    // from: https://raw.githubusercontent.com/X4BNet/lists_vpn/main/ipv4.txt
    const vpnIPsResponse = await fetch("/vpn-ips.txt");
    const vpnIPs = await vpnIPsResponse.text();
    const isUsingVPN = vpnIPs
      .toString()
      .split("\n")
      .some((vpnIP) => ipRangeCheck(ip, vpnIP) === true);

    if (!locationAllowed || isUsingVPN) {
      localStorage.removeItem("accountAddress");
      // TODO: disconnect wallet
    }

    runInAction(() => {
      this.locationAllowed = locationAllowed;
      this.isUsingVPN = isUsingVPN;
    });

    return json;
  }
}

export const useUserStore = () => {
  const store = useStore();
  return store.userStore;
};
