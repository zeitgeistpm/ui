import { Combobox } from "@headlessui/react";
import { useMarketSearch } from "lib/hooks/queries/useMarketSearch";
import Link from "next/link";
import MarketId from "pages/api/og/[marketId]";
import { useState } from "react";
import { MarketStatus, FullMarketFragment } from "@zeitgeistpm/indexer";
import { Loader, Search } from "react-feather";

const MarketSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);

  const { data: markets } = useMarketSearch(searchTerm);

  return (
    <div className="w-full mx-3 md:mx-7">
      <div className="flex items-center">
        <Search className="text-ztg-blue mr-4" />
        <input
          className="rounded-sm bg-sky-900 text-white h-8 px-2 w-full focus:outline-none max-w-[500px]"
          value={searchTerm}
          onChange={(event) => {
            setShowResults(true);
            setSearchTerm(event.target.value);
          }}
        />
      </div>
      {showResults && markets && (
        <div
          onBlur={() => {
            //todo
            console.log("blur");
            setShowResults(false);
          }}
          className="flex flex-col absolute bg-white px-4 py-2 rounded-md top-[45px] translate-x-[40px] max-h-[300px] overflow-scroll max-w-[500px] shadow-2xl"
        >
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
                  className={`ml-auto text-xs rounded-md px-2 py-1 w-16 text-center text-white ${
                    market.status === MarketStatus.Active
                      ? "bg-sheen-green"
                      : "bg-vermilion"
                  }`}
                >
                  {market.status === MarketStatus.Active
                    ? "Active"
                    : "Inactive"}
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
