import "react-datetime/css/react-datetime.css";
import "styles/index.css";

import { Hydrate, QueryClientProvider } from "@tanstack/react-query";
import * as Fathom from "fathom-client";

import { AvatarContext } from "@zeitgeistpm/avatara-react";
import Devtools from "components/devtools";
import DefaultLayout from "layouts/DefaultLayout";
import { appQueryClient } from "lib/query-client";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { hotjar } from "react-hotjar";
import { isWSX } from "lib/constants";

// font optimization from @next/font
import { inter, kanit, roboto_mono } from "lib/util/fonts";
import { useWallet } from "lib/state/wallet";
import useWeb3Wallet from "lib/hooks/useWeb3Wallet";

// environment variables set in .env.local or vercel interface
const fathomSiteId = process.env["NEXT_PUBLIC_FATHOM_SITE_ID"];
const domain = process.env["NEXT_PUBLIC_DOMAIN"];
const hotjarSiteId = process.env["NEXT_PUBLIC_HOTJAR_SITE_ID"];
const isProduction =
  process.env.NEXT_PUBLIC_SITE_URL === "https://app.zeitgeist.pm" ||
  "https://app.thewsx.com";

const MyApp = ({ Component, pageProps }) => {
  const Layout = Component.Layout ? Component.Layout : React.Fragment;
  const router = useRouter();
  const wallet = useWallet();
  const { initWeb3Auth } = useWeb3Wallet();

  useEffect(() => {
    if (!isProduction) {
      return;
    }
    // disable fathom analyitics if not set
    if (!fathomSiteId) {
      return;
    }

    if (domain) {
      Fathom.load(fathomSiteId, {
        includedDomains: [domain],
      });
    }

    function onRouteChangeComplete() {
      Fathom.trackPageview();
    }

    router.events.on("routeChangeComplete", onRouteChangeComplete);

    if (hotjarSiteId) {
      hotjar.initialize(Number(hotjarSiteId), 6);
    }

    return () =>
      router.events.off("routeChangeComplete", onRouteChangeComplete);
  }, []);

  useEffect(() => {
    const init = async () => {
      await initWeb3Auth();
    };
    init();
  }, []);

  return (
    <div
      className={`${inter.variable} ${kanit.variable} ${roboto_mono.variable} font-sans `}
    >
      <style jsx global>
        {`
          :root {
            --font-inter: ${inter.style.fontFamily};
            --font-kanit: ${kanit.style.fontFamily};
            --font-roboto-mono: ${roboto_mono.style.fontFamily};
          }
        `}
      </style>
      <QueryClientProvider client={appQueryClient}>
        <Hydrate state={pageProps.dehydratedState}>
          <AvatarContext.Provider
            value={{
              api: process.env.NEXT_PUBLIC_AVATAR_API_HOST,
              ipfs: { node: { url: process.env.NEXT_PUBLIC_IPFS_NODE ?? "" } },
              rpc: process.env.NEXT_PUBLIC_RMRK_CHAIN_RPC_NODE,
              indexer: process.env.NEXT_PUBLIC_RMRK_INDEXER_API,
              avatarCollectionId: process.env.NEXT_PUBLIC_AVATAR_COLLECTION_ID,
              badgeCollectionId: process.env.NEXT_PUBLIC_BADGE_COLLECTION_ID,
              avatarBaseId: process.env.NEXT_PUBLIC_AVATAR_BASE_ID,
              prerenderUrl: process.env.NEXT_PUBLIC_RMRK_PRERENDER_URL,
            }}
          >
            <Head>
              <title>
                {isWSX
                  ? "The WSX - Powered by Zeitgeist"
                  : "Zeitgeist - Prediction Markets"}
              </title>
            </Head>
            <DefaultLayout>
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </DefaultLayout>
            {/* <Devtools /> */}
          </AvatarContext.Provider>
        </Hydrate>
      </QueryClientProvider>
    </div>
  );
};

export default MyApp;
