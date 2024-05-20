import { Tab } from "@headlessui/react";
import SubTabsList from "components/ui/SubTabsList";
import { useQueryParamState } from "lib/hooks/useQueryParamState";
import CourtRewardsTable from "./CourtRewardsTable";

type CourtGroupItem = "Rewards";
const courtTabItems: CourtGroupItem[] = ["Rewards"];

const CourtTabGroup = ({ address }: { address: string }) => {
  const [historyTabSelection, setHistoryTabSelection] =
    useQueryParamState<CourtGroupItem>("courtTab");

  const courtTabIndex = courtTabItems.indexOf(historyTabSelection);
  const selectedIndex = courtTabIndex !== -1 ? courtTabIndex : 0;

  return (
    <Tab.Group
      defaultIndex={0}
      selectedIndex={selectedIndex}
      onChange={(index) => setHistoryTabSelection(courtTabItems[index])}
    >
      <SubTabsList titles={courtTabItems} />
      <Tab.Panels>
        <Tab.Panel>
          <CourtRewardsTable address={address} />
        </Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
  );
};

export default CourtTabGroup;
