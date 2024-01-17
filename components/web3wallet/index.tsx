import WalletIcon from "components/account/WalletIcon";
import useWeb3Wallet from "lib/hooks/useWeb3Wallet";
import { useState } from "react";

const Web3wallet = () => {
  const { loginGoogle, loginEmail, logout } = useWeb3Wallet();
  const [email, setEmail] = useState<string>("");

  return (
    <div className="grid grid-cols-3 gap-4">
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
      {/* <button onClick={loginGoogle}>Login with Web3 Google</button>
      <button onClick={loginEmail}>Login with Web3 Email</button>
      <button onClick={logout}>Logout</button> */}
      <input
        type="text"
        placeholder="Email"
        className="col-span-2 border px-2 py-1 leading-8 focus:outline-none focus:ring-1 focus:ring-ztg-blue"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button
        className="bg-black text-white hover:bg-ztg-blue"
        onClick={() => loginEmail(email)}
      >
        Login with Email
      </button>
    </div>
  );
};

export default Web3wallet;
