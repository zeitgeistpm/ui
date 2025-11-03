import { FC, PropsWithChildren, useRef, useState, useEffect } from "react";
import { useResizeDetector } from "react-resize-detector";
import Image from "next/image";
import dynamic from "next/dynamic";

import TopBar from "components/top-bar";
import Footer from "components/ui/Footer";
import NotificationCenter from "components/ui/NotificationCenter";
import GrillChat from "components/grillchat";
import { TradeItem, TradeItemContext } from "lib/hooks/trade";
import { useSubscribeBlockEvents } from "lib/hooks/useSubscribeBlockEvents";
import { useRouter } from "next/router";

import { Account } from "components/account/Account";
import { ConfirmationProvider } from "components/confirmation/ConfirmationProvider";
import { DisclaimerModal } from "components/onboarding/DisclaimerModal";

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
  "/markets/favorites",
  "/create-account",
  "/deposit",
  "/topics",
];

const DefaultLayout: FC<PropsWithChildren> = ({ children }) => {
  const router = useRouter();
  useSubscribeBlockEvents();
  const [tradeItem, setTradeItem] = useState<TradeItem | null>(null);
  const [topBarHeight, setTopBarHeight] = useState(52); // Default fallback

  const {
    width,
    height,
    ref: mainRef,
  } = useResizeDetector({ refreshMode: "debounce", refreshRate: 50 });

  const contentRef = useRef<HTMLDivElement>(null);

  // Measure TopBar height dynamically (includes QuickNav or Filters when visible)
  useEffect(() => {
    const measureTopBarHeight = () => {
      const topBarElement = document.getElementById("top-bar-container");
      if (topBarElement) {
        const height = topBarElement.offsetHeight;
        setTopBarHeight(height);
        
        // Set CSS variable for other components to use
        document.documentElement.style.setProperty(
          "--top-bar-total-height",
          `${height}px`,
        );
      }
    };

    // Measure on mount and route changes
    measureTopBarHeight();

    // Re-measure after delays to account for transitions and async components
    // Market filters are lazy-loaded, so we need multiple measurement points
    const timers = [
      setTimeout(measureTopBarHeight, 100),
      setTimeout(measureTopBarHeight, 300),
      setTimeout(measureTopBarHeight, 600),
      setTimeout(measureTopBarHeight, 1000), // Extra delay for market filters
    ];

    // Use ResizeObserver for continuous monitoring
    const topBarElement = document.getElementById("top-bar-container");
    if (topBarElement && typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver(() => {
        measureTopBarHeight();
      });
      
      resizeObserver.observe(topBarElement);
      
      return () => {
        timers.forEach(timer => clearTimeout(timer));
        resizeObserver.disconnect();
      };
    }

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [router.pathname]);

  return (
    <div
      className="relative flex min-h-screen w-full max-w-full flex-col overflow-x-hidden bg-ztg-primary-500"
    >
      <TradeItemContext.Provider value={{ data: tradeItem, set: setTradeItem }}>
        <div ref={contentRef} className="flex flex-1 flex-col">
          <TopBar />
          <main
            className="container-fluid mb-10 flex-1 w-full"
            style={{ marginTop: `${topBarHeight}px` }}
            ref={mainRef}
          >
            {/* Content wrapper with consistent padding top - accounts for fixed nav */}
            <div
              className={`w-full ${
                ["/", "/markets", "/markets/favorites"].includes(
                  router.pathname,
                )
                  ? "pt-4"
                  : "pt-6"
              }`}
            >
              {process.env.NEXT_PUBLIC_MIGRATION_IN_PROGRESS === "true" ? (
                <div className="flex h-[800px] w-full flex-col items-center justify-center ">
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
        <ConfirmationProvider />
        <DisclaimerModal />
      </TradeItemContext.Provider>
      <Account />
      <Onboarding />
      {/* {process.env.NEXT_PUBLIC_GRILLCHAT_DISABLE !== "true" && <GrillChat />} */}
    </div>
  );
};

export default DefaultLayout;
