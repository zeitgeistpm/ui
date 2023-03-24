import { makeAutoObservable, reaction, runInAction } from "mobx";
import { JSONObject, Primitive } from "lib/types";
import Store, { useStore } from "./Store";
import { endpoints } from "lib/constants";
import ipRangeCheck from "ip-range-check";

export type Theme = "dark" | "light";

export type Judgement =
  | "Unknown"
  | "FeePaid"
  | "Reasonable"
  | "KnownGood"
  | "OutOfDate"
  | "LowQuality"
  | "Erroneous";

export interface UserIdentity {
  displayName: string;
  discord: string;
  twitter: string;
  judgement: Judgement;
}

export type HelperNotifications = {
  avatarKsmFeesInfo: boolean;
};

const getFromLocalStorage = (
  key: string,
  defaultValue: JSONObject,
): JSONObject => {
  const val = window.localStorage.getItem(key);
  if (val == null && defaultValue) {
    return defaultValue;
  }
  return JSON.parse(val);
};

const setToLocalStorage = (key: string, value: JSONObject | Primitive) => {
  const val = JSON.stringify(value);
  window.localStorage.setItem(key, val);
};

type StoredTheme = Theme | "system";

export default class UserStore {
  theme: Theme | null = "light";
  storedTheme: StoredTheme | null = "light";
  accountAddress: string | null = null;
  identity?: UserIdentity;
  locationAllowed: boolean;
  isUsingVPN: boolean;
  walletId: string | null = null;
  helpnotifications: HelperNotifications | null = null;
  endpointKey = `endpoint-${process.env.NEXT_PUBLIC_VERCEL_ENV ?? "dev"}`;
  qglEndpointKey = `gql-endpoint-${
    process.env.NEXT_PUBLIC_VERCEL_ENV ?? "dev"
  }`;

  constructor(private store: Store) {
    makeAutoObservable(this, {}, { autoBind: true, deep: false });

    reaction(
      () => this.store.wallets.activeAccount,
      (activeAccount) => {
        setToLocalStorage("accountAddress", activeAccount.address);
      },
    );

    reaction(
      () => this.store.wallets.wallet,
      (wallet) => {
        setToLocalStorage("walletId", wallet?.extensionName ?? null);
      },
    );

    reaction(
      () => this.helpnotifications,
      (notifications) => {
        setToLocalStorage("help-notifications", notifications);
      },
    );
  }

  async init() {
    this.accountAddress = getFromLocalStorage("accountAddress", "") as string;
    this.walletId = getFromLocalStorage("walletId", null) as string;

    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (query) => {
        if (this.storedTheme === "system") {
          this.theme = query.matches ? "dark" : "light";
        }
      });

    this.helpnotifications = getFromLocalStorage("help-notifications", {
      avatarKsmFeesInfo: true,
    }) as HelperNotifications;
  }

  toggleTheme(theme?: StoredTheme) {
    if (theme != null) {
      this.storedTheme = theme;
      return;
    }

    if (this.theme === "light") {
      this.storedTheme = "dark";
    } else if (this.theme === "dark") {
      this.storedTheme = "light";
    }
  }

  setTheme(theme: Theme) {
    this.theme = theme;
  }

  setWalletId(walletId: string | null) {
    this.walletId = walletId;
  }

  toggleHelpNotification(key: keyof HelperNotifications, value: boolean) {
    this.helpnotifications = {
      ...this.helpnotifications,
      [key]: value,
    };
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
      this.accountAddress = null;
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
