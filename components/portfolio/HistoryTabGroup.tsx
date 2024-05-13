import { Tab } from "@headlessui/react";
import SubTabsList from "components/ui/SubTabsList";
import TradeHistoryTable from "./TradeHistoryTable";
import TransactionHistoryTable from "./TransactionHistoryTable";
import { useQueryParamState } from "lib/hooks/useQueryParamState";

type HistoryTabItem = "Trades";
const historyTabItems: HistoryTabItem[] = ["Trades"];

const HistoryTabGroup = ({ address }: { address: string }) => {
  const [historyTabSelection, setHistoryTabSelection] =
    useQueryParamState<HistoryTabItem>("historyTab");

  const historyTabIndex = historyTabItems.indexOf(historyTabSelection);
  const selectedIndex = historyTabIndex !== -1 ? historyTabIndex : 0;

  return (
    <Tab.Group
      defaultIndex={0}
      selectedIndex={selectedIndex}
      onChange={(index) => setHistoryTabSelection(historyTabItems[index])}
    >
      <Tab.Panels>
        <TradeHistoryTable address={address} />
      </Tab.Panels>
    </Tab.Group>
  );
};

export default HistoryTabGroup;
