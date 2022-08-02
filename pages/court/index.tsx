import CasesTable from "components/court/CaseTable";
import CourtToggle, { CourtTab } from "components/court/CourtToggle";
import CourtHeader from "components/court/CourtHeader";
import { TableData } from "components/ui/Table";
import { Case, useCourtStore } from "lib/stores/CourtStore";
import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react";
import { NextPage } from "next";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import JurorsTable from "components/court/JurorsTable";

const Court: NextPage = observer(() => {
  const { cases, jurors } = useCourtStore();
  const store = useStore();
  const [selectedTab, setSelectedTab] = useState<CourtTab>();

  const jurorsTableData: TableData[] = jurors.map((j) => ({
    address: j.address,
    status: j.status,
  }));

  const mapCaseToTableData = (courtCase: Case) => {
    return {
      marketId: courtCase.marketId,
      market: courtCase.marketName,
      status:
        courtCase.endBlock == null
          ? ""
          : store.blockNumber.toNumber() > courtCase.endBlock
          ? "Ended"
          : "Active",
      jurors: courtCase.jurors.length,
      ends:
        courtCase.endTimestamp === null
          ? ""
          : new Intl.DateTimeFormat("default", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(courtCase.endTimestamp)),
      detail: (
        <Link href={`/court/${courtCase.marketId}`}>
          <a className="bg-ztg-blue text-white rounded-ztg-5 px-ztg-30 py-ztg-8 focus:outline-none text-ztg-14-120">
            Detail
          </a>
        </Link>
      ),
    };
  };

  const allCases: TableData[] = useMemo(() => {
    return cases?.map((c) => mapCaseToTableData(c));
  }, [cases]);

  const myCases: TableData[] = useMemo(() => {
    return cases
      ?.filter((c) =>
        c.jurors.some(
          (j) => j.address === store.wallets.activeAccount?.address,
        ),
      )
      .map((c) => mapCaseToTableData(c));
  }, [cases, store.wallets.activeAccount]);

  const handleCaseFilterToggle = (tab: CourtTab) => {
    setSelectedTab(tab);
  };

  return (
    <section>
      <CourtHeader />
      <CourtToggle
        onToggle={handleCaseFilterToggle}
        allCasesCount={allCases?.length}
        myCasesCount={myCases?.length}
        jurorsCount={jurorsTableData?.length}
      />
      {selectedTab === "jurors" ? (
        <JurorsTable data={jurorsTableData} />
      ) : (
        <CasesTable data={selectedTab === "myCases" ? myCases : allCases} />
      )}
    </section>
  );
});

export default Court;
