import { Combobox } from "@headlessui/react";
import { useMarketSearch } from "lib/hooks/queries/useMarketSearch";
import Link from "next/link";
import MarketId from "pages/api/og/[marketId]";
import { useState } from "react";
import { MarketStatus, FullMarketFragment } from "@zeitgeistpm/indexer";

const MarketSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: markets } = useMarketSearch(searchTerm);

  console.log(markets);

  return (
    <div>
      <div>
        <input
          className="rounded-md"
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(event.target.value);
          }}
        />
      </div>
      {markets && (
        <div className="flex flex-col absolute bg-white px-4 py-2 rounded-md top-[40px] max-h-[300px] overflow-scroll w-[500px]">
          <div className="text-sky-600">Results</div>

          {markets.length > 0 ? (
            markets?.map((market) => (
              <Link
                href={`/markets/${market.marketId}`}
                className="py-2 flex overflow-ellipsis"
              >
                <div className="overflow-ellipsis line-clamp-1 mr-4">
                  {market.question}
                </div>
                <div
                  className={`ml-auto text-xs rounded-md px-2 py-1 ${
                    market.status === MarketStatus.Active
                      ? "bg-green-500"
                      : "bg-red-600"
                  }`}
                >
                  {market.status}
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center w-full pt-6 pb-4">No results</div>
          )}
          {}
        </div>
      )}
    </div>
  );
};

export default MarketSearch;
