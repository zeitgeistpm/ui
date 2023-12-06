import { Squid } from "@0xsquid/sdk";
import { useEffect, useState } from "react";

export const SQUID_TESTNET = "https://testnet.v2.api.squidrouter.com/";
export const SQUID_MAINNET = "https://v2.api.squidrouter.com/";
export const SQUID_ROUTER_ID = "zeitgeist-sdk";

export type UseSquid =
  | {
      connected: false;
    }
  | {
      connected: true;
      sdk: Squid;
    };

export const squid = new Squid({
  baseUrl:
    SQUID_MAINNET ?? process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
      ? SQUID_MAINNET
      : SQUID_TESTNET,
  integratorId: SQUID_ROUTER_ID,
});

export const useSquid = (): UseSquid => {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    squid.init().then(() => {
      setConnected(true);
    });
  }, [squid]);

  if (connected) {
    return {
      connected: true,
      sdk: squid,
    };
  } else {
    return {
      connected: false,
    };
  }
};
