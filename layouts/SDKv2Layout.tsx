import { debounce } from "lodash";
import { observer } from "mobx-react";
import React, { FC, useRef, useState } from "react";
import { useResizeDetector } from "react-resize-detector";

import { ContentDimensionsProvider } from "components/context/ContentDimensionsContext";
import Footer from "components/ui/Footer";

const SDKv2Layout: FC = observer(({ children }) => {
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
      <div
        ref={contentRef}
        className="overflow-y-auto overflow-x-hidden flex-grow"
      >
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
              {children}
            </ContentDimensionsProvider>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
});

export default SDKv2Layout;
