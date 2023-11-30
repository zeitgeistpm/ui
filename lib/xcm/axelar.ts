import { Squid } from "@0xsquid/sdk";
const SQUID_ROUTER_ID = "zeitgeist-sdk";

const SQUID_TESTNET = "https://testnet.v2.api.squidrouter.com/";
const SQUID_MAINNET = "https://v2.api.squidrouter.com/";

const squid = new Squid({
  baseUrl: SQUID_TESTNET,
  integratorId: SQUID_ROUTER_ID,
});

squid.chains;

// init the SDK
await squid.init();
console.log(
  "Squid inited",
  squid.chains.map((c) => [c.chainId, c.axelarChainName, c.networkName]),
);
