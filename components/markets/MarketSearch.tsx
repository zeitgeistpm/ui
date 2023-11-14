import { MarketStatus } from "@zeitgeistpm/indexer";
import { useMarketSearch } from "lib/hooks/queries/useMarketSearch";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "react-feather";

const MarketSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: markets } = useMarketSearch(searchTerm);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  return (
    <div className="w-full mx-3 md:mx-7" ref={wrapperRef}>
      <Link href={"/search"} className="w-2 lg:hidden">
        <Search className="text-ztg-blue mr-4" />
      </Link>
      <div className="hidden lg:flex items-center">
        <button
          onClick={() => {
            setShowSearch(true);
            setTimeout(() => {
              inputRef.current?.focus();
            });
          }}
        >
          <Search className="text-ztg-blue mr-4" />
        </button>
        {showSearch && (
          <>
            <input
              ref={inputRef}
              className="rounded-sm bg-sky-900 text-white h-8 px-2 w-full focus:outline-none max-w-[500px] "
              value={searchTerm}
              placeholder="Search markets"
              onChange={(event) => {
                setShowResults(true);
                setSearchTerm(event.target.value);
              }}
              onFocus={() => {
                setShowResults(true);
              }}
            />
            <button
              className="relative right-6 text-sky-600"
              onClick={() => {
                setSearchTerm("");
                inputRef.current?.focus();
              }}
            >
              <X size={16} />
            </button>
          </>
        )}
      </div>
      {showResults && markets && (
        <div className="hidden lg:flex flex-col absolute bg-white py-2  rounded-md top-[45px] translate-x-[40px] max-h-[300px] overflow-scroll w-[500px] shadow-2xl">
          <div className="text-sky-600 mx-4">Results</div>

          {markets.length > 0 ? (
            markets?.map((market) => (
              <Link
                href={`/markets/${market.marketId}`}
                className="px-4 py-2 flex justify-between overflow-ellipsis hover:bg-sky-100"
                onClick={() => {
                  setShowResults(false);
                }}
              >
                <div className="overflow-ellipsis line-clamp-1 w-85%">
                  {market.question}
                </div>
                <div
                  className={`text-xs rounded-md px-2 py-1 w-16 text-center text-white ${
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
        </div>
      )}
    </div>
  );
};

export default MarketSearch;
