const loadWeb3AuthWallet = async () => {
  if (!web3auth) {
    return;
  }
  const chainConfig = {
    chainNamespace: CHAIN_NAMESPACES.OTHER,
    chainId: "0x1",
    rpcTarget: "https://rpc.polkadot.io/",
    displayName: "Polkadot Mainnet",
    blockExplorer: "https://explorer.polkascan.io/",
    ticker: "DOT",
    tickerName: "Polkadot",
  };
  const privateKeyProvider = new CommonPrivateKeyProvider({
    config: { chainConfig },
  });

  // const openloginAdapter = new OpenloginAdapter({
  //   privateKeyProvider,
  // });
  // console.log(web3auth);
  if (isEmpty(web3auth.walletAdapters)) {
    const openloginAdapter = new OpenloginAdapter({
      adapterSettings: {
        loginConfig: {
          // Google login
          google: {
            verifier: "auth-0-all", // Pass the Verifier name here. eg. w3a-agg-example
            verifierSubIdentifier: "auth0-google", // Pass the Sub-Verifier here. eg w3a-google
            typeOfLogin: "jwt", // Pass the type of login provider.
            clientId: "4v1l8rc65YNzcbY93wxJzgCUqKNxoSMm", // Pass the Google `Client ID` here.
          },
          // GitHub Login via Auth0
          // github: {
          //   verifier: "auth-0-all", // Pass the Verifier name here. eg. w3a-agg-example
          //   verifierSubIdentifier: "w3a-a0-github", // Pass the Sub-Verifier here. eg w3a-a0-github
          //   typeOfLogin: "jwt", // Pass the type of login provider. For Auth0, it's jwt and not Auth0.
          //   clientId: "4v1l8rc65YNzcbY93wxJzgCUqKNxoSMm", // Pass the Auth0 `Client ID` here.
          // },
          // Email Password Login via Auth0
          emailpasswordless: {
            verifier: "auth-0-all", // Pass the Verifier name here. eg. w3a-agg-example
            verifierSubIdentifier: "auth0-passwordless", // Pass the Sub-Verifier here. eg w3a-a0-email-passwordless
            typeOfLogin: "jwt", // Pass the type of login provider. For Auth0, it's jwt and not Auth0.
            clientId: "4v1l8rc65YNzcbY93wxJzgCUqKNxoSMm", // Pass the `Client ID` of your Auth0 Application.
          },
        },
      },
      privateKeyProvider,
    });
    web3auth.configureAdapter(openloginAdapter);
  }
  await web3auth.init();
  // web3auth.status === "not_ready" && (await web3auth.init());
  let web3authProvider;
  if (web3auth.status !== "connecting") {
    web3authProvider = await web3auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
      loginProvider: "jwt",
      extraLoginOptions: {
        domain: "https://dev-yacn6ah0b1dc12yh.us.auth0.com", // Please append "https://" before your domain
        verifierIdField: "sub", // For SMS & Email Passwordless, use "name" as verifierIdField
      },
    });
  }
  // await web3auth.connect();

  if (web3authProvider) {
    const getKeypair = async (provider: IProvider) => {
      await cryptoWaitReady();
      const privateKey = await provider.request({
        method: "private_key",
      });
      const keyring = new Keyring({ ss58Format: 73, type: "sr25519" });
      const keyPair = keyring.addFromUri("0x" + privateKey);
      return keyPair;
    };
    const keyPair = await getKeypair(web3authProvider);
    keyPair && enabledWeb3Wallet(keyPair);
  }
};
