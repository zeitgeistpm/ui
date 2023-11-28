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
          className="h-8 w-full max-w-[500px] rounded-md border border-sky-200 px-2 focus:outline-none"
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
          <div className="px-2 text-sky-600">Results</div>

          {markets.length > 0 ? (
            markets?.map((market) => (
              <Link
                href={`/markets/${market.marketId}`}
                className="flex overflow-ellipsis rounded-md px-2 py-2 hover:bg-sky-100"
              >
                <div className="mr-4 line-clamp-1 overflow-ellipsis">
                  {market.question}
                </div>
                <div
                  className={`ml-auto w-16 rounded-md px-2 py-1 text-center text-xs text-white ${
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
            <div className="w-full pb-4 pt-6">No results</div>
          )}
          {}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
