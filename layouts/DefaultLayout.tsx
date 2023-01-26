import { observer } from "mobx-react";
import { Skeleton } from "@material-ui/lab";
import React, { FC, useEffect, useRef, useState } from "react";
import { useResizeDetector } from "react-resize-detector";
import { debounce } from "lodash";

import { useStore } from "lib/stores/Store";
import TopBar from "components/top-bar";
import Footer from "components/ui/Footer";
import NotificationCenter from "components/ui/NotificationCenter";
import LeftDrawer from "components/drawer/LeftDrawer";
import { ContentDimensionsProvider } from "components/context/ContentDimensionsContext";
import { useRouter } from "next/router";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { usePrevious } from "lib/hooks/usePrevious";
import { shouldScrollTop } from "lib/util/should-scroll";
import dynamic from "next/dynamic";

// font optimization from @next/font
import { inter, kanit, roboto_mono } from "lib/util/fonts";

const RightDrawer = dynamic(() => import("components/drawer/RightDrawer"), {
  ssr: false,
});

const NOTIFICATION_MESSAGE = process.env.NEXT_PUBLIC_NOTIFICATION_MESSAGE;

const DefaultLayout: FC = observer(({ children }) => {
  const store = useStore();
  const router = useRouter();
  const sdk = useSdkv2();

  const {
    width,
    height,
    ref: mainRef,
  } = useResizeDetector({ refreshMode: "debounce", refreshRate: 50 });

  const contentRef = useRef<HTMLDivElement>();
  const [scrollTop, setScrollTop] = useState(0);
  const prevPathname = usePrevious(router.pathname);

  const onScrollCapture: React.UIEventHandler<HTMLDivElement> = debounce(() => {
    setScrollTop(contentRef.current?.scrollTop);
  }, 66);

  const scrollTo = (scrollTop: number) => {
    if (contentRef.current) {
      contentRef.current.scrollTop = scrollTop;
    }
  };

  useEffect(() => {
    if (shouldScrollTop(router.pathname, prevPathname)) {
      scrollTo(0);
    }
  }, [router.pathname, prevPathname]);

  return (
    <div
      onScrollCapture={onScrollCapture}
      className="relative flex min-h-screen justify-evenly bg-white dark:bg-sky-1000 overflow-hidden"
    >
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
      <LeftDrawer />
      <div
        ref={contentRef}
        className="overflow-y-auto overflow-x-hidden flex-grow"
      >
        <TopBar />
        {NOTIFICATION_MESSAGE && (
          <div className="sticky top-ztg-76 z-ztg-2 flex w-full justify-center items-center bg-yellow-100 h-ztg-38">
            <div className="text-ztg-12-150 font-semibold">
              {NOTIFICATION_MESSAGE}
            </div>
          </div>
        )}
        <main
          className="main-container flex flex-col dark:text-white"
          ref={mainRef}
        >
          <div className="max-w-full 2xl:px-20% lg:px-10% xl:px-10% px-12 mx-auto py-0 pt-12 w-full ">
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
    </div>
  );
});

export default DefaultLayout;
