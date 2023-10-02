import { FC, PropsWithChildren, useRef, useState } from "react";
import { useResizeDetector } from "react-resize-detector";
import Image from "next/image";
import dynamic from "next/dynamic";

import { ContentDimensionsProvider } from "components/context/ContentDimensionsContext";
import TopBar from "components/menu";
import Footer from "components/ui/Footer";
import NotificationCenter from "components/ui/NotificationCenter";
import GrillChat from "components/grillchat";
import { TradeItem, TradeItemContext } from "lib/hooks/trade";
import { useSubscribeBlockEvents } from "lib/hooks/useSubscribeBlockEvents";
import { useRouter } from "next/router";

// font optimization from @next/font
import { inter, kanit, roboto_mono } from "lib/util/fonts";
import { Account } from "components/account/Account";

const NOTIFICATION_MESSAGE = process.env.NEXT_PUBLIC_NOTIFICATION_MESSAGE;

const Onboarding = dynamic(
  () => import("../components/onboarding/Onboarding"),
  {
    ssr: false,
  },
);

const greyBackgroundPageRoutes = [
  "/",
  "/markets",
  "/create-account",
  "/deposit",
];

const DefaultLayout: FC<PropsWithChildren> = ({ children }) => {
  const router = useRouter();
  useSubscribeBlockEvents();
  const [tradeItem, setTradeItem] = useState<TradeItem | null>(null);

  const {
    width,
    height,
    ref: mainRef,
  } = useResizeDetector({ refreshMode: "debounce", refreshRate: 50 });

  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={`relative min-h-screen justify-evenly ${
        greyBackgroundPageRoutes.includes(router.pathname)
          ? "bg-light-gray"
          : ""
      }`}
    >
      <TradeItemContext.Provider value={{ data: tradeItem, set: setTradeItem }}>
        {/* loads optimized fonts for global access */}
        <style jsx global>
          {`
            :root {
              --font-inter: ${inter.style.fontFamily};
              --font-kanit: ${kanit.style.fontFamily};
              --font-roboto-mono: ${roboto_mono.style.fontFamily};
            }
          `}
        </style>
        <div ref={contentRef} className="flex-grow">
          <TopBar />
          <main className="mt-16 mb-12 container-fluid" ref={mainRef}>
            <div
              className={`w-full ${
                ["/", "/markets"].includes(router.pathname) ? "pt-0" : "pt-2"
              }`}
            >
              {process.env.NEXT_PUBLIC_MIGRATION_IN_PROGRESS === "true" ? (
                <div className="w-full h-[800px] flex flex-col items-center justify-center ">
                  <div className="text-[24px] font-bold">
                    Migrating to Polkadot
                  </div>
                  <Image
                    src="/polkadot_icon.png"
                    alt="Polkadot Logo"
                    width={300}
                    height={300}
                    style={{
                      animation: "rotation 2s infinite linear",
                    }}
                  />
                </div>
              ) : (
                children
              )}
            </div>
          </main>

          <Footer />
        </div>
        <NotificationCenter />
      </TradeItemContext.Provider>
      <Account />
      <Onboarding />
      {process.env.NEXT_PUBLIC_GRILLCHAT_DISABLE !== "true" && <GrillChat />}
    </div>
  );
};

export default DefaultLayout;
