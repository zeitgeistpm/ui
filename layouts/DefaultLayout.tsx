import { observer } from "mobx-react";
import { Skeleton } from "@material-ui/lab";
import React, {
  FC,
  PropsWithChildren,
  useEffect,
  useRef,
  useState,
} from "react";
import { useResizeDetector } from "react-resize-detector";

import { useStore } from "lib/stores/Store";
import TopBar from "components/top-bar";
import Footer from "components/ui/Footer";
import NotificationCenter from "components/ui/NotificationCenter";
import Menu from "components/menu";
import { ContentDimensionsProvider } from "components/context/ContentDimensionsContext";
import { useRouter } from "next/router";
import { useSubscribeBlockEvents } from "lib/hooks/useSubscribeBlockEvents";
import { TradeItem, TradeItemContext } from "lib/hooks/trade";

// font optimization from @next/font
import { inter, kanit, roboto_mono } from "lib/util/fonts";

const NOTIFICATION_MESSAGE = process.env.NEXT_PUBLIC_NOTIFICATION_MESSAGE;

const DefaultLayout: FC<PropsWithChildren> = observer(({ children }) => {
  const store = useStore();
  const router = useRouter();
  useSubscribeBlockEvents();
  const [trade, setTrade] = useState<TradeItem | null>(null);

  const {
    width,
    height,
    ref: mainRef,
  } = useResizeDetector({ refreshMode: "debounce", refreshRate: 50 });

  const contentRef = useRef<HTMLDivElement>();

  return (
    <div className="relative flex min-h-screen justify-evenly overflow-hidden">
      <TradeItemContext.Provider value={{ data: trade, set: setTrade }}>
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
        <Menu />
        <div
          ref={contentRef}
          className="overflow-y-a1uto overflow-x-hidden flex-grow"
        >
          <TopBar />
          {/* //hide navbar until designs are ready */}
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
              <ContentDimensionsProvider height={height} width={width}>
                {store.initialized ||
                router.pathname === "/" ||
                router.pathname.split("/")[1] === "markets" ||
                router.pathname.split("/")[1] === "portfolio" ||
                router.pathname.split("/")[1] === "liquidity" ? (
                  children
                ) : (
                  <Skeleton
                    className="!transform-none !mt-ztg-30"
                    style={{ height: "550px" }}
                  />
                )}
              </ContentDimensionsProvider>
            </div>
          </main>
          <Footer />
        </div>
        <NotificationCenter />
      </TradeItemContext.Provider>
    </div>
  );
});

export default DefaultLayout;
