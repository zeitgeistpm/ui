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
    <div className="mx-3 w-full md:mx-7" ref={wrapperRef}>
      <Link href={"/search"} className="w-2 lg:hidden">
        <Search className="mr-4 text-ztg-blue" />
      </Link>
      <div className="hidden items-center lg:flex">
        <button
          onClick={() => {
            setShowSearch(true);
            setTimeout(() => {
              inputRef.current?.focus();
            });
          }}
        >
          <Search className="mr-4 text-ztg-blue" />
        </button>
        {showSearch && (
          <>
            <input
              ref={inputRef}
              className="h-8 w-full max-w-[500px] rounded-sm bg-sky-900 px-2 text-white focus:outline-none "
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
        <div className="absolute top-[45px] hidden max-h-[300px] w-[500px] translate-x-[40px]  flex-col overflow-scroll rounded-md bg-white py-2 shadow-2xl lg:flex">
          <div className="mx-4 text-sky-600">Results</div>

          {markets.length > 0 ? (
            markets?.map((market) => (
              <Link
                href={`/markets/${market.marketId}`}
                className="flex justify-between overflow-ellipsis px-4 py-2 hover:bg-sky-100"
                onClick={() => {
                  setShowResults(false);
                }}
              >
                <div className="line-clamp-1 w-85% overflow-ellipsis">
                  {market.question}
                </div>
                <div
                  className={`w-16 rounded-md px-2 py-1 text-center text-xs text-white ${
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
            <div className="w-full pb-4 pt-6 text-center">No results</div>
          )}
        </div>
      )}
    </div>
  );
};

export default MarketSearch;
