import { Transition } from "@headlessui/react";
import { MarketStatus } from "@zeitgeistpm/indexer";
import { useMarketSearch } from "lib/hooks/queries/useMarketSearch";
import Link from "next/link";
import { FaDeleteLeft } from "react-icons/fa6";
import { Fragment, useEffect, useRef, useState } from "react";
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
        <input
          ref={inputRef}
          className={`h-10 transition-all ${
            showSearch ? "max-w-[500px] px-3" : "max-w-[0px]"
          } w-full  rounded-lg bg-sky-900  text-white outline-none`}
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
        {showSearch && (
          <button
            className="relative right-6 text-sky-600"
            onClick={() => {
              setSearchTerm("");
              inputRef.current?.focus();
            }}
          >
            <FaDeleteLeft size={16} />
          </button>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowSearch(!showSearch);
            setTimeout(() => {
              if (!showSearch) {
                inputRef.current?.focus();
              }
            });
          }}
        >
          <Search className="mr-4 text-ztg-blue" />
        </button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 :scale-95"
        show={Boolean(showResults && showSearch && markets)}
      >
        <div className=" absolute top-[45px] hidden max-h-[420px] w-[500px] flex-col rounded-md bg-white px-2 py-4 shadow-2xl lg:flex">
          <div className="subtle-scroll-bar overflow-y-scroll">
            {markets?.length ? (
              markets?.map((market) => (
                <Link
                  href={`/markets/${market.marketId}`}
                  className="flex justify-between overflow-ellipsis rounded-md px-4 py-2 hover:bg-sky-100"
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
              <div className="w-full pb-4 pt-6 text-center">No results</div>
            )}
          </div>
        </div>
      </Transition>
    </div>
  );
};

export default MarketSearch;
