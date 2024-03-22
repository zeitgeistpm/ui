import WalletIcon from "components/account/WalletIcon";
import useWeb3Wallet from "lib/hooks/useWeb3Wallet";
import { useState } from "react";

const Web3wallet = () => {
  const { loginGoogle, loginTwitter, loginDiscord, loginEmail } =
    useWeb3Wallet();
  const [email, setEmail] = useState<string>("");

  return (
    <div>
      <h3 className="mb-4 text-lg font-bold">Social</h3>
      <div className="grid grid-cols-3 gap-x-6 gap-y-4">
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
        <div className="col-span-3 grid grid-cols-3 gap-x-6">
          <h3 className="col-span-3 mb-4 text-lg font-bold">Email</h3>
          <input
            type="text"
            placeholder="Enter email for passwordless login"
            className="col-span-3 mb-4 h-[56px] rounded-md border px-2 py-1 leading-8 placeholder:text-xs focus:outline-none focus:ring-1 focus:ring-ztg-blue sm:col-span-2 sm:mb-0"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            className="col-span-3 h-[56px] rounded-md bg-ztg-blue py-1 leading-8 text-white hover:bg-black sm:col-span-1"
            onClick={() => loginEmail(email)}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default Web3wallet;
