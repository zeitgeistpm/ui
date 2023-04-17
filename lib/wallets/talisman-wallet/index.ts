import { BaseDotsamaWallet } from "../base-dotsama-wallet";

export class TalismanWallet extends BaseDotsamaWallet {
  extensionName = "talisman";
  title = "Talisman";
  installUrl =
    "https://chrome.google.com/webstore/detail/talisman-wallet/fijngjgcjhjmmpcmkeiomlglpeiijkld";
  noExtensionMessage =
    "You can use any Polkadot compatible wallet but we recommend using SubWallet";
  logo = {
    src: "/icons/talisman.png",
    alt: "Talisman Logo",
  };
}
