import { MarketStatus } from "@zeitgeistpm/indexer";
import { useMarketSearch } from "lib/hooks/queries/useMarketSearch";
import { NextPage } from "next";
import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { X } from "react-feather";

const SearchPage: NextPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: markets } = useMarketSearch(searchTerm);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef?.current?.focus();
  }, [inputRef]);

  return (
    <div className="relative mt-2">
      <div className="fixed left-0 right-0 top-16 mt-1 flex items-center">
        <input
          className="h-12 w-full flex-1 border bg-gray-200 px-5 focus:outline-none"
          value={searchTerm}
          ref={inputRef}
          placeholder="Search markets"
          onChange={(event) => {
            setSearchTerm(event.target.value);
          }}
        />
        <button
          className="absolute right-6 text-sky-600"
          onClick={() => {
            setSearchTerm("");
          }}
        >
          <X size={16} />
        </button>
      </div>
      {markets && (
        <div className="flex flex-col py-4 pt-12">
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
                      ? "bg-green-400"
                      : "bg-gray-400"
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
