import { makeAutoObservable, reaction, runInAction } from "mobx";
import { JSONObject, Primitive, SupportedParachain } from "lib/types";
import Store, { useStore } from "./Store";
import { endpoints, gqlEndpoints } from "lib/constants";
import { TradeSlipItem } from "./TradeSlipStore";
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

interface RawValue {
  Raw: string;
}

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
  theme: Theme | null = null;
  storedTheme: StoredTheme | null = null;
  accountAddress: string | null = null;
  tradeSlipItems: JSONObject | null = null;
  endpoint: string;
  gqlEndpoint: string;
  identity: UserIdentity;
  locationAllowed: boolean;
  isUsingVPN: boolean;
  walletId: string | null = null;
  helpnotifications: HelperNotifications | null = null;

  constructor(private store: Store) {
    makeAutoObservable(this, {}, { autoBind: true, deep: false });
    reaction(
      () => this.storedTheme,
      (storedTheme: StoredTheme) => {
        setToLocalStorage("theme", storedTheme);
        this.theme = this.getTheme();
      },
    );

    reaction(
      () => this.theme,
      (theme: Theme) => {
        if (theme === "dark") {
          document.body.classList.add(theme);
        } else if (theme === "light") {
          document.body.classList.remove("dark");
        }
      },
    );

    reaction(
      () => this.endpoint,
      (endpoint) => {
        setToLocalStorage("endpoint-1", endpoint);
      },
    );

    reaction(
      () => this.gqlEndpoint,
      (gqlEndpoint) => {
        setToLocalStorage("gql-endpoint-1", gqlEndpoint);
      },
    );

    reaction(
      () => this.store.wallets.activeAccount,
      (activeAccount) => {
        if (activeAccount == null) {
          return;
        }
        setToLocalStorage("accountAddress", activeAccount.address);
        this.loadIdentity(activeAccount.address);
      },
    );

    reaction(
      () => this.store.tradeSlipStore.tradeSlipItems,
      (items) => {
        setToLocalStorage("tradeSlipItems", items);
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
    this.storedTheme = getFromLocalStorage("theme", "system") as StoredTheme;
    this.theme = this.getTheme();
    this.accountAddress = getFromLocalStorage("accountAddress", "") as string;
    this.walletId = getFromLocalStorage("walletId", null) as string;
    this.tradeSlipItems = getFromLocalStorage(
      "tradeSlipItems",
      [],
    ) as TradeSlipItem[];
    this.endpoint = getFromLocalStorage(
      "endpoint-1",
      endpoints.find((endpoint) => endpoint.parachain == SupportedParachain.BSR)
        .value,
    ) as string;
    this.gqlEndpoint = getFromLocalStorage(
      "gql-endpoint-1",
      gqlEndpoints.find(
        (endpoint) => endpoint.parachain == SupportedParachain.BSR,
      ).value,
    ) as string;

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

    await this.checkIP();
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

  setEndpoint(endpoint: string) {
    this.endpoint = endpoint;
  }

  setGqlEndpoint(gqlEndpoint: string | null) {
    this.gqlEndpoint = gqlEndpoint;
  }

  resetEndpoints() {
    this.endpoint = endpoints[0].value;
    this.gqlEndpoint = gqlEndpoints[0].value;
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

  private getTheme(): Theme {
    if (this.storedTheme === "system" || this.storedTheme == null) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } else {
      return this.storedTheme;
    }
  }

  async getIdentity(address: string): Promise<UserIdentity> {
    const identity = (await this.store.sdk.api.query.identity.identityOf(
      address,
    )) as any;

    const indentityInfo =
      identity.isNone === false ? (identity.value as any).get("info") : null;
    if (indentityInfo) {
      const textDecoder = new TextDecoder();

      let discordHandle: string;
      indentityInfo.get("additional").forEach((element) => {
        if (textDecoder.decode(element[0].value)) {
          discordHandle = textDecoder.decode(element[1].value);
        }
      });

      const judgements = identity.value.get("judgements")[0];
      console.log(judgements);

      const judgementType: Judgement = judgements
        ? judgements[1].type
        : "Unknown";

      return {
        displayName:
          indentityInfo.get("display").isNone === false
            ? textDecoder.decode(indentityInfo.get("display").value)
            : "",
        twitter:
          indentityInfo.get("twitter").isNone === false
            ? textDecoder.decode(indentityInfo.get("twitter").value)
            : "",
        discord: discordHandle,
        judgement: judgementType,
      };
    } else {
      return {
        displayName: "",
        twitter: "",
        discord: "",
        judgement: null,
      };
    }
  }

  async loadIdentity(address: string) {
    const identity = await this.getIdentity(address);
    runInAction(() => {
      this.identity = identity;
    });
  }

  private async checkIP() {
    const response = await fetch(`/api/location`);
    const json = await response.json();

    const notAllowedCountries: string[] = JSON.parse(
      process.env.NEXT_PUBLIC_NOT_ALLOWED_COUNTRIES ?? "[]",
    );

    const userCountry: string = json.body.country;
    const locationAllowed = !notAllowedCountries.includes(userCountry);

    const ip = json.body.ip;
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

  get graphQlEnabled() {
    return this.gqlEndpoint != null;
  }
}

export const useUserStore = () => {
  const store = useStore();
  return store.userStore;
};
