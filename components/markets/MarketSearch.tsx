import { Transition } from "@headlessui/react";
import { MarketStatus } from "@zeitgeistpm/indexer";
import { TypingIndicator } from "components/ui/TypingIndicator";
import { useMarketSearch } from "lib/hooks/queries/useMarketSearch";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Fragment,
  KeyboardEventHandler,
  useEffect,
  useRef,
  useState,
} from "react";
import { Search, X } from "react-feather";

const MarketSearch = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [showSearch, setShowSearch] = useState(true);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: markets, isFetching } = useMarketSearch(searchTerm);

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

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selectedRef = useRef<HTMLAnchorElement>(null);

  const onKeyDownHandler: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === "ArrowDown" && markets) {
      event.preventDefault();
      if (selectedIndex === null) {
        setSelectedIndex(0);
      } else if (selectedIndex < markets.length - 1) {
        setSelectedIndex(selectedIndex + 1);
      }
    } else if (event.key === "ArrowUp" && markets) {
      event.preventDefault();
      if (selectedIndex === null) {
        setSelectedIndex(markets.length - 1);
      } else if (selectedIndex > 0) {
        setSelectedIndex(selectedIndex - 1);
      }
    } else if (event.key === "Enter" && markets && selectedIndex !== null) {
      router.push(`/markets/${markets[selectedIndex].marketId}`);
      setTimeout(() => {
        setShowResults(false);
        setSearchTerm("");
        inputRef.current?.blur();
      }, 100);
    } else {
      setSelectedIndex(null);
    }
  };

  useEffect(() => {
    if (selectedIndex !== null) {
      selectedRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedIndex]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="flex items-center">
        <div className="relative w-full transition-all">
          <div className="pointer-events-none absolute left-3 top-[50%] translate-y-[-50%] text-white/70">
            <Search size={18} />
          </div>

          <input
            ref={inputRef}
            className={`h-11 w-full touch-manipulation overflow-hidden text-ellipsis rounded-lg bg-white/10 pl-4 pr-4 text-base text-white outline-none ring-2 ring-transparent backdrop-blur-sm transition-all placeholder:text-white/60 focus:bg-white/15 focus:shadow-lg focus:ring-2 focus:ring-ztg-green-500/30 md:text-base`}
            value={searchTerm}
            placeholder="Search markets..."
            onChange={(event) => {
              setShowResults(true);
              setSearchTerm(event.target.value);
            }}
            onKeyDown={onKeyDownHandler}
            onFocus={() => {
              if (searchTerm?.length > 0) {
                setShowResults(true);
              }
            }}
            onBlur={() => {
              // Keep focus behavior simple
            }}
          />

          <div className="absolute right-9 top-[50%] translate-y-[-50%] sm:right-10">
            <TypingIndicator
              disabled={selectedIndex !== null}
              inputRef={inputRef}
              isFetching={isFetching}
            />
          </div>

          {searchTerm && (
            <button
              className="absolute right-2.5 top-[50%] translate-y-[-50%] text-white/70 transition-colors hover:text-white/90 sm:right-3"
              onClick={() => {
                setSearchTerm("");
                if (showResults) {
                  setShowResults(false);
                }
                setTimeout(() => {
                  inputRef.current?.focus();
                }, 66);
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
        show={Boolean(showResults && showSearch && markets)}
      >
        <div className="absolute left-1/2 top-[42px] z-50 max-h-[420px] w-full max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-col rounded-md bg-white/10 px-2 py-4 shadow-2xl backdrop-blur-lg md:max-w-xl">
          <div className="subtle-scroll-bar overflow-y-scroll">
            {markets?.length ? (
              markets?.map((market, index) => (
                <Link
                  key={market.marketId}
                  href={`/markets/${market.marketId}`}
                  className={`flex justify-between overflow-ellipsis rounded-md px-4 py-2 text-white/90 transition-all
                    ${selectedIndex === index && "bg-white/20"}
                    ${selectedIndex === null && "hover:bg-white/20"}
                  `}
                  onClick={() => {
                    setShowResults(false);
                  }}
                  ref={selectedIndex === index ? selectedRef : undefined}
                >
                  <div className="line-clamp-1 w-85% overflow-ellipsis">
                    {market.question}
                  </div>
                  <div
                    className={`w-16 rounded-md px-2 py-1 text-center text-xs text-white ${
                      market.status === MarketStatus.Active
                        ? "bg-ztg-green-500"
                        : "bg-gray-500"
                    }`}
                  >
                    {market.status === MarketStatus.Active
                      ? "Active"
                      : "Inactive"}
                  </div>
                </Link>
              ))
            ) : (
              <div className="w-full pb-4 pt-6 text-center text-white/70">
                No results
              </div>
            )}
          </div>
        </div>
      </Transition>
    </div>
  );
};

export default MarketSearch;
