import EmptyPortfolio from "components/portfolio/EmptyPortfolio";
import PortfolioLayout from "layouts/PortfolioLayout";
import { NextPageWithLayout } from "layouts/types";
import { useWallet } from "lib/state/wallet";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const PortfolioIndex: NextPageWithLayout = () => {
  return <></>;
};

PortfolioIndex.Layout = PortfolioLayout;

export default PortfolioIndex;
