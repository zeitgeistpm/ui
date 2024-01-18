import WalletIcon from "components/account/WalletIcon";
import useWeb3Wallet from "lib/hooks/useWeb3Wallet";
import { useState } from "react";

const Web3wallet = () => {
  const { loginGoogle, loginEmail } = useWeb3Wallet();
  const [email, setEmail] = useState<string>("");

  return (
    <div>
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
          // onClick={loginX}
        />
        <WalletIcon
          logoAlt="facebook"
          logoSrc="/icons/facebook-f.svg"
          extensionName="web3auth"
          // onClick={loginFacebook}
        />
        <input
          type="text"
          placeholder="Enter email for passwordless login"
          className="col-span-3 rounded-md border px-2 py-1 leading-8 placeholder:text-xs focus:outline-none focus:ring-1 focus:ring-ztg-blue sm:col-span-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          className="col-span-3 rounded-md bg-black py-1 leading-8 text-white hover:bg-ztg-blue sm:col-span-1"
          onClick={() => loginEmail(email)}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default Web3wallet;
