import { MarketStatus } from "@zeitgeistpm/indexer";
import { useMarketSearch } from "lib/hooks/queries/useMarketSearch";
import { NextPage } from "next";
import Link from "next/link";
import { useState } from "react";
import { X } from "react-feather";

const SearchPage: NextPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: markets } = useMarketSearch(searchTerm);
  return (
    <div className="mt-4">
      <div className="flex items-center px-2">
        <input
          className="rounded-md h-8 px-2 w-full focus:outline-none max-w-[500px] border border-sky-200"
          value={searchTerm}
          placeholder="Search markets"
          onChange={(event) => {
            setSearchTerm(event.target.value);
          }}
        />
        <button
          className="relative right-6 text-sky-600"
          onClick={() => {
            setSearchTerm("");
          }}
        >
          <X size={16} />
        </button>
      </div>
      {markets && (
        <div className="flex flex-col py-4">
          <div className="text-sky-600 px-2">Results</div>

          {markets.length > 0 ? (
            markets?.map((market) => (
              <Link
                href={`/markets/${market.marketId}`}
                className="py-2 flex overflow-ellipsis hover:bg-sky-100 px-2 rounded-md"
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
            <div className="w-full pt-6 pb-4">No results</div>
          )}
          {}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
