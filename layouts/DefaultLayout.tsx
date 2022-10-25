import { observer } from "mobx-react";
import { Skeleton } from "@material-ui/lab";
import React, { FC, useRef, useState } from "react";
import { useResizeDetector } from "react-resize-detector";
import { debounce } from "lodash";

import { useStore } from "lib/stores/Store";
import { TradeSlipStoreContext } from "lib/stores/TradeSlipStore";
import TopBar from "components/top-bar";
import Footer from "components/ui/Footer";
import NotificationCenter from "components/ui/NotificationCenter";
import RightDrawer from "components/drawer/RightDrawer";
import LeftDrawer from "components/drawer/LeftDrawer";
import { ContentDimensionsProvider } from "components/context/ContentDimensionsContext";
import { useRouter } from "next/router";

const DefaultLayout: FC = observer(({ children }) => {
  const store = useStore();
  const router = useRouter();

  const { width, height, ref: mainRef } = useResizeDetector();

  const contentRef = useRef<HTMLDivElement>();
  const [scrollTop, setScrollTop] = useState(0);

  const onScrollCapture: React.UIEventHandler<HTMLDivElement> = debounce(() => {
    setScrollTop(contentRef.current?.scrollTop);
  }, 66);

  const scrollTo = (scrollTop: number) => {
    if (contentRef.current) {
      contentRef.current.scrollTop = scrollTop;
    }
  };

  return (
    <div
      onScrollCapture={onScrollCapture}
      className="relative flex min-h-screen justify-evenly bg-white dark:bg-sky-1000 overflow-hidden"
    >
      <TradeSlipStoreContext.Provider value={store.tradeSlipStore}>
        <LeftDrawer />
        <div
          ref={contentRef}
          className="overflow-y-auto overflow-x-hidden flex-grow"
        >
          <TopBar />
          <main
            className="main-container flex flex-col dark:text-white"
            ref={mainRef}
          >
            <div className="max-w-ztg-1100 mx-auto py-0 px-ztg-32 pt-ztg-14 w-full ">
              <ContentDimensionsProvider
                scrollTop={scrollTop}
                scrollTo={scrollTo}
                height={height}
                width={width}
              >
                {store.initialized ||
                router.pathname === "/" ||
                router.pathname.split("/")[1] === "markets" ||
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
            <Footer />
          </main>
        </div>
        <RightDrawer />
        <NotificationCenter />
      </TradeSlipStoreContext.Provider>
    </div>
  );
});

export default DefaultLayout;
