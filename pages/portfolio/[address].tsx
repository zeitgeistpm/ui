import { Tab } from "@headlessui/react";
import PortfolioHeader from "components/portfolio/PortfolioHeader";
import PrimaryTabsList from "components/ui/PrimaryTabsList";
import PortfolioLayout from "layouts/PortfolioLayout";
import { NextPageWithLayout } from "layouts/types";
import { usePortfolioPositions } from "lib/hooks/queries/usePortfolioPositions";
import { useQueryParamState } from "lib/hooks/useQueryParamState";
import { useCrossChainApis } from "lib/state/cross-chain";
import { isValidPolkadotAddress } from "lib/util";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import NotFoundPage from "pages/404";

// Lazy load tab components - only load when user switches to that tab
const PredictionsTabGroup = dynamic(
  () =>
    import("components/portfolio/PredictionsTabGroup").then((m) => ({
      default: m.PredictionsTabGroup,
    })),
  { ssr: false },
);
const CreatedMarketsTabGroup = dynamic(
  () =>
    import("components/portfolio/CreatedMarketsTabGroup").then((m) => ({
      default: m.CreatedMarketsTabGroup,
    })),
  { ssr: false },
);
const CurrenciesTable = dynamic(
  () => import("components/portfolio/CurrenciesTable"),
  { ssr: false },
);
const HistoryTabGroup = dynamic(
  () => import("components/portfolio/HistoryTabGroup"),
  { ssr: false },
);
const CourtTabGroup = dynamic(
  () => import("components/portfolio/CourtTabGroup"),
  { ssr: false },
);

// type MainTabItem = "Predictions" | "Balances" | "Markets" | "History" | "Court";
type MainTabItem = "Predictions" | "Balances" | "Created Markets";

const getMainTabItems = (): MainTabItem[] => {
  return [
    "Predictions",
    ...(process.env.NEXT_PUBLIC_SHOW_CROSS_CHAIN === "true"
      ? ["Balances" as MainTabItem]
      : []),
    "Created Markets",
    // "History",
    // "Court",
  ];
};

const Portfolio: NextPageWithLayout = () => {
  const router = useRouter();
  const address = Array.isArray(router.query.address)
    ? router.query.address[0]
    : router.query.address;

  //init cross chain apis early
  useCrossChainApis();

  const [mainTabSelection, setMainTabSelection] =
    useQueryParamState<MainTabItem>("mainTab");

  const { breakdown } = usePortfolioPositions(address);

  const mainTabItems = getMainTabItems();

  if (!address) {
    return null;
  }

  if (isValidPolkadotAddress(address) === false) {
    return <NotFoundPage />;
  }

  return (
    <div className="container-fluid mt-6 overflow-hidden">
      <PortfolioHeader
        address={address}
        {...(breakdown ?? {
          loading: true,
        })}
      />
      <div className="mb-6">
        <Tab.Group
          defaultIndex={0}
          selectedIndex={
            mainTabSelection && mainTabItems.indexOf(mainTabSelection)
          }
          onChange={(index) => setMainTabSelection(mainTabItems[index])}
        >
          <PrimaryTabsList titles={mainTabItems} />

          <Tab.Panels>
            <Tab.Panel>
              <PredictionsTabGroup address={address} />
            </Tab.Panel>
            {process.env.NEXT_PUBLIC_SHOW_CROSS_CHAIN === "true" && (
              <Tab.Panel>
                {address && <CurrenciesTable address={address} />}
              </Tab.Panel>
            )}
            <Tab.Panel>
              <CreatedMarketsTabGroup address={address} />
            </Tab.Panel>
            <Tab.Panel>
              {address && <HistoryTabGroup address={address} />}
            </Tab.Panel>
            <Tab.Panel>
              {address && <CourtTabGroup address={address} />}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

Portfolio.Layout = PortfolioLayout;

export default Portfolio;
