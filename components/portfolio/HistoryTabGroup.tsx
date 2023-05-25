import { Tab } from "@headlessui/react";
import SubTabsList from "components/ui/SubTabsList";
import TradeHistoryTable from "./TradeHistoryTable";
import TransactionHistoryTable from "./TransactionHistoryTable";

const HistoryTabGroup = ({ address }: { address: string }) => {
  return (
    <Tab.Group>
      <SubTabsList titles={["Trades", "Other Transactions"]} />
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
