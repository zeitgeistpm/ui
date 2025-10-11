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
        <h3 className="mb-3 text-base font-semibold text-sky-900">Social</h3>
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
      <div className="mt-5">
        <h3 className="mb-3 text-base font-semibold text-sky-900">Email</h3>
        <div className="grid grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Enter email"
            className="col-span-3 h-11 rounded-lg border border-sky-200/30 bg-white/80 px-3 py-2 text-sm text-sky-900 shadow-sm backdrop-blur-sm transition-all placeholder:text-sm placeholder:text-sky-500 focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-400/20 sm:col-span-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            className="col-span-3 h-11 rounded-lg border border-sky-200/30 bg-gradient-to-br from-sky-600 to-sky-700 px-3 py-2 text-sm font-semibold text-white shadow-md backdrop-blur-sm transition-all hover:from-sky-700 hover:to-sky-800 hover:shadow-lg sm:col-span-1"
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
