import useWeb3Wallet from "lib/hooks/useWeb3Wallet";

const Web3wallet = () => {
  const { loginGoogle, loginEmail, logout } = useWeb3Wallet();

  return (
    <>
      <button onClick={loginGoogle}>Login with Web3 Google</button>
      <button onClick={loginEmail}>Login with Web3 Email</button>
      <button onClick={logout}>Logout</button>
    </>
  );
};

export default Web3wallet;
