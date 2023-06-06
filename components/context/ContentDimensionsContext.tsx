import React, { createContext, FC, PropsWithChildren, useContext } from "react";

export type ContentDimensions = {
  scrollTop?: number;
  scrollTo?: (scrollTop: number) => void;
  height: number;
  width: number;
};

export const ContentDimensionsContext = createContext<ContentDimensions | null>(
  null,
);

export const ContentDimensionsProvider: FC<
  PropsWithChildren<ContentDimensions>
> = ({ width, height, scrollTop, scrollTo, children }) => (
  <ContentDimensionsContext.Provider
    value={{ height, width, scrollTop, scrollTo }}
  >
    {children}
  </ContentDimensionsContext.Provider>
);
