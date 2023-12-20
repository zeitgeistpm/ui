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
  const [showSearch, setShowSearch] = useState(false);
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
    <div className="mx-3 w-full md:mx-7" ref={wrapperRef}>
      <Link href={"/search"} className="w-2 lg:hidden">
        <Search className="mr-4 text-ztg-blue" />
      </Link>
      <div className="hidden items-center lg:flex">
        <div
          className={`relative w-full overflow-hidden transition-all ${
            showSearch ? "max-w-[500px] px-3" : "max-w-[0px]"
          }`}
        >
          <input
            ref={inputRef}
            className={`h-10 w-full rounded-lg bg-sky-900  px-3 text-white  outline-none transition-all`}
            value={searchTerm}
            placeholder="Search markets"
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
          />

          <div className="absolute right-12 top-[50%] translate-y-[-50%]">
            <TypingIndicator
              disabled={selectedIndex !== null}
              inputRef={inputRef}
              isFetching={isFetching}
            />
          </div>

          {showSearch && (
            <button
              className="absolute right-6 top-[50%] translate-y-[-50%] text-sky-600"
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
              <X size={16} />
            </button>
          )}
        </div>

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
              markets?.map((market, index) => (
                <Link
                  key={market.marketId}
                  href={`/markets/${market.marketId}`}
                  className={`flex justify-between overflow-ellipsis rounded-md px-4 py-2 
                    ${selectedIndex === index && "bg-sky-100"}
                    ${selectedIndex === null && "hover:bg-sky-100"}
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
