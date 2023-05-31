import { Tab } from "@headlessui/react";
import SubTabsList from "components/ui/SubTabsList";
import TradeHistoryTable from "./TradeHistoryTable";
import TransactionHistoryTable from "./TransactionHistoryTable";
import { useQueryParamState } from "lib/hooks/useQueryParamState";

type HistoryTabItem = "Trades" | "Other Transactions";
const historyTabItems: HistoryTabItem[] = ["Trades", "Other Transactions"];

const HistoryTabGroup = ({ address }: { address: string }) => {
  const [historyTabSelection, setHistoryTabSelection] =
    useQueryParamState<HistoryTabItem>("historyTab");

  return (
    <Tab.Group
      defaultIndex={0}
      selectedIndex={
        historyTabItems && historyTabItems.indexOf(historyTabSelection)
      }
      onChange={(index) => setHistoryTabSelection(historyTabItems[index])}
    >
      <SubTabsList titles={historyTabItems} />
      <Tab.Panels>
        <Tab.Panel>
          <TradeHistoryTable address={address} />
        </Tab.Panel>
        <Tab.Panel>
          <TransactionHistoryTable address={address} />
        </Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
  );
};

export default HistoryTabGroup;
