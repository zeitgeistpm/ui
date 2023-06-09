import { FC, PropsWithChildren, useEffect, useRef, useState } from "react";
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

const DefaultLayout: FC<PropsWithChildren> = ({ children }) => {
  const router = useRouter();
  useSubscribeBlockEvents();
  const [tradeItem, setTradeItem] = useState<TradeItem | null>(null);
  const [showChat, setShowChat] = useState(false);

  const {
    width,
    height,
    ref: mainRef,
  } = useResizeDetector({ refreshMode: "debounce", refreshRate: 50 });

  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative flex min-h-screen justify-evenly overflow-hidden">
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
        <div
          ref={contentRef}
          className="overflow-y-a1uto overflow-x-hidden flex-grow"
        >
          <TopBar />
          {/* hide notification bar */}
          {NOTIFICATION_MESSAGE && (
            <div className="sticky top-ztg-76 z-ztg-2 flex w-full justify-center items-center bg-yellow-100 h-ztg-38 hidden">
              <div className="text-ztg-12-150 font-semibold">
                {NOTIFICATION_MESSAGE}
              </div>
            </div>
          )}
          <main
            className={`flex flex-col dark:text-white mb-12 ${
              router.pathname !== "/" && "main-container mt-32"
            }`}
            ref={mainRef}
          >
            <div>
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
                <ContentDimensionsProvider height={height} width={width}>
                  {children}
                </ContentDimensionsProvider>
              )}
            </div>
          </main>
          <Footer />
        </div>
        <NotificationCenter />
      </TradeItemContext.Provider>
      <Account />
      <Onboarding />
      <GrillChat open={showChat} setOpen={setShowChat} />
    </div>
  );
};

export default DefaultLayout;
