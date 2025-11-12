import WalletIcon from "components/account/WalletIcon";
import useWeb3Wallet from "lib/hooks/useWeb3Wallet";
import { useState } from "react";

const Web3wallet = () => {
  const { loginGoogle, loginTwitter, loginDiscord, loginEmail } =
    useWeb3Wallet();
  const [email, setEmail] = useState<string>("");

  return (
    <>
      <div>
        <div className="grid grid-cols-3 gap-3">
          <WalletIcon
            logoAlt="google"
            logoSrc="/icons/google-g.svg"
            extensionName="web3auth"
            onClick={loginGoogle}
          />
          <WalletIcon
            logoAlt="twitter"
            logoSrc="/icons/x-logo.svg"
            extensionName="web3auth"
            className="px-1 invert"
            onClick={loginTwitter}
          />
          <WalletIcon
            logoAlt="discord"
            logoSrc="/icons/discord.svg"
            extensionName="web3auth"
            onClick={loginDiscord}
          />
        </div>
      </div>
      <div className="mt-4">
        <div className="grid grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Enter email"
            className="col-span-3 h-11 rounded-lg border-2 border-white/10 bg-white/10 px-3 py-2 text-sm text-white/90 shadow-sm backdrop-blur-sm transition-all placeholder:text-sm placeholder:text-white/90/60 focus:border-white/20 focus:bg-white/15 focus:outline-none sm:col-span-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            className="col-span-3 h-11 rounded-lg bg-ztg-green-600/80 px-3 py-2 text-sm font-semibold text-white/90 shadow-md backdrop-blur-sm transition-all hover:bg-ztg-green-600 hover:shadow-lg sm:col-span-1"
            onClick={() => loginEmail(email)}
          >
            Submit
          </button>
        </div>
      </div>
    </>
  );
};

export default Web3wallet;
