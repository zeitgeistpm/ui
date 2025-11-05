import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { isRpcSdk } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import Select, { SingleValue, components } from "react-select";
import { Disclosure } from "@headlessui/react";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useWallet } from "lib/state/wallet";
import { useNotifications } from "lib/state/notifications";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useMarketSearchWithDefaults } from "lib/hooks/queries/useMarketSearch";
import {
  useAllComboPools,
  findDuplicateCombo,
} from "lib/hooks/queries/useAllComboPools";
import Input from "components/ui/Input";
import SecondaryButton from "components/ui/SecondaryButton";
import FormTransactionButton from "components/ui/FormTransactionButton";
import { Loader } from "components/ui/Loader";
import { AiOutlineSearch, AiOutlineClose } from "react-icons/ai";
import { BsExclamationTriangle } from "react-icons/bs";
import { ChevronDown, ChevronUp, Info } from "react-feather";
import { calcMarketColors } from "lib/util/color-calc";
import { ZTG } from "lib/constants";
import { formatNumberCompact } from "lib/util/format-compact";

interface MarketOption {
  value: FullMarketFragment;
  label: string;
  description: string;
}

interface MarketSelectProps {
  onSelectMarket: (market: FullMarketFragment) => void;
  excludeMarketIds: number[];
  selectedCount: number;
  maxSelections: number;
}

const MarketSelect: React.FC<MarketSelectProps> = ({
  onSelectMarket,
  excludeMarketIds,
  selectedCount,
  maxSelections,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const controlRef = React.useRef<HTMLDivElement>(null);
  const [controlWidth, setControlWidth] = useState<number | undefined>(
    undefined,
  );

  // Measure control width when menu opens
  useEffect(() => {
    if (isMenuOpen && controlRef.current) {
      const width = controlRef.current.offsetWidth;
      setControlWidth(width);
    }
  }, [isMenuOpen]);

  // Use the new hook that shows active markets initially, then searches when typing
  const { data: markets, isFetching } =
    useMarketSearchWithDefaults(searchQuery);

  const marketOptions = useMemo((): MarketOption[] => {
    return (markets || [])
      .filter(
        (market) =>
          market.status === "Active" &&
          !excludeMarketIds.includes(market.marketId),
      )
      .slice(0, 50) // Limit to 50 results for performance
      .map((market) => {
        const outcomeNames =
          market.categories?.map((cat) => cat.name).join(" • ") || "";
        const description = outcomeNames
          ? `${market.categories?.length || 0} Outcomes: ${outcomeNames}`
          : `${market.categories?.length || 0} Outcomes`;

        return {
          value: market,
          label: market.question || `Market ${market.marketId}`,
          description,
        };
      });
  }, [markets, excludeMarketIds]);

  const customComponents = {
    Option: ({ children, ...props }: any) => (
      <components.Option {...props}>
        <div>
          <div className="text-sm font-medium text-white">
            {children}
          </div>
          <div className="mt-1 text-xs text-white/80">
            {props.data.description}
          </div>
        </div>
      </components.Option>
    ),
    LoadingIndicator: () => (
      <div className="p-2">
        <Loader loading={true} />
      </div>
    ),
    NoOptionsMessage: ({ inputValue }: any) => (
      <div className="p-3 text-center text-sm text-white/80">
        {inputValue ? "No markets found" : "No active markets available"}
      </div>
    ),
    MenuList: ({ children, ...props }: any) => (
      <components.MenuList {...props}>
        {!searchQuery && marketOptions.length > 0 && (
          <div className="border-b border-white/10 p-2 text-xs text-white/70">
            Showing {marketOptions.length} active markets
          </div>
        )}
        {children}
      </components.MenuList>
    ),
  };

  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      minHeight: "48px",
      borderColor: state.isFocused
        ? "rgba(255, 255, 255, 0.3)"
        : "rgba(255, 255, 255, 0.2)",
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      color: "#ffffff",
      backdropFilter: "blur(12px)",
      borderRadius: "8px",
      boxShadow: state.isFocused
        ? "0 0 0 1px rgba(255, 255, 255, 0.3)"
        : "none",
      "&:hover": {
        borderColor: "rgba(255, 255, 255, 0.3)",
      },
    }),
    menu: (provided: any) => ({
      ...provided,
      zIndex: 50,
      marginTop: "4px",
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      backdropFilter: "blur(12px)",
      borderRadius: "8px",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      boxShadow:
        "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      padding: "8px",
      ...(controlWidth && { minWidth: controlWidth, width: controlWidth }),
    }),
    menuPortal: (provided: any) => ({
      ...provided,
      zIndex: 50,
    }),
    menuList: (provided: any) => ({
      ...provided,
      maxHeight: "300px",
      padding: 0,
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isFocused
        ? "rgba(255, 255, 255, 0.1)"
        : "transparent",
      color: state.isFocused ? "#ffffff" : "rgba(255, 255, 255, 0.9)",
      cursor: "pointer",
      borderRadius: "6px",
      padding: "8px 12px",
      "&:active": {
        backgroundColor: "rgba(255, 255, 255, 0.15)",
      },
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: "rgba(255, 255, 255, 0.6)",
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: "#ffffff",
    }),
    input: (provided: any) => ({
      ...provided,
      color: "#ffffff",
    }),
  };

  if (selectedCount >= maxSelections) {
    return null;
  }

  return (
    <div className="mb-4" ref={controlRef}>
      <label className="mb-2 block text-sm font-semibold text-white md:text-base">
        Select Market {selectedCount + 1} ({selectedCount}/{maxSelections})
      </label>
      <Select<MarketOption>
        options={marketOptions}
        components={customComponents}
        styles={customStyles}
        placeholder="Search and select a market..."
        isSearchable
        isClearable
        isLoading={isFetching}
        loadingMessage={() => "Loading markets..."}
        onInputChange={(value) => setSearchQuery(value)}
        onMenuOpen={() => setIsMenuOpen(true)}
        onMenuClose={() => setIsMenuOpen(false)}
        onChange={(selectedOption: SingleValue<MarketOption>) => {
          if (selectedOption) {
            onSelectMarket(selectedOption.value);
          }
        }}
        value={null} // Always reset after selection
        menuPlacement="bottom"
        menuPosition="fixed"
        menuPortalTarget={
          typeof document !== "undefined" ? document.body : undefined
        }
        defaultMenuIsOpen={false}
        openMenuOnClick={true}
        openMenuOnFocus={true}
      />
    </div>
  );
};

interface ComboMarketForm {
  selectedMarkets: FullMarketFragment[];
  spotPrices: string[];
  swapFee: string;
  liquidityAmount: string;
}

interface OutcomeCombination {
  id: string;
  name: string;
  market1Outcome: string;
  market2Outcome: string;
  color: string;
}

const ComboMarketEditor: React.FC = () => {
  const router = useRouter();
  const [sdk] = useSdkv2();
  const wallet = useWallet();
  const notificationStore = useNotifications();

  // Fetch all existing combo pools for duplicate detection
  const { data: existingComboPools = [] } = useAllComboPools();

  // Form state
  const [form, setForm] = useState<ComboMarketForm>({
    selectedMarkets: [],
    spotPrices: [],
    swapFee: "1.0", // Fixed at 1%
    liquidityAmount: "200", // Minimum 200 ZTG
  });

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDeploying, setIsDeploying] = useState(false);

  // Generate outcome combinations
  const outcomeCombinations = useMemo((): OutcomeCombination[] => {
    if (form.selectedMarkets.length !== 2) return [];

    const [market1, market2] = form.selectedMarkets;
    const combinations: OutcomeCombination[] = [];
    const colors = calcMarketColors(1, 4); // Generate 4 colors for combinations

    let colorIndex = 0;
    market1.categories?.forEach((cat1, i) => {
      market2.categories?.forEach((cat2, j) => {
        combinations.push({
          id: `${i}-${j}`,
          name: `${cat1.name} & ${cat2.name}`,
          market1Outcome: cat1.name || `Outcome ${i}`,
          market2Outcome: cat2.name || `Outcome ${j}`,
          color: colors[colorIndex % colors.length],
        });
        colorIndex++;
      });
    });

    return combinations;
  }, [form.selectedMarkets]);

  // Initialize spot prices when combinations change
  useEffect(() => {
    if (
      outcomeCombinations.length > 0 &&
      form.spotPrices.length !== outcomeCombinations.length
    ) {
      const equalPrice = (100 / outcomeCombinations.length).toFixed(2);
      setForm((prev) => ({
        ...prev,
        spotPrices: new Array(outcomeCombinations.length).fill(equalPrice),
      }));
    }
  }, [outcomeCombinations.length, form.spotPrices.length]);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate market selection
    if (form.selectedMarkets.length !== 2) {
      newErrors.markets = "Please select exactly 2 markets";
    }

    // Validate same collateral
    if (form.selectedMarkets.length === 2) {
      const [market1, market2] = form.selectedMarkets;
      if (market1.baseAsset !== market2.baseAsset) {
        newErrors.markets =
          "Selected markets must use the same collateral asset";
      }

      // Check for duplicate combo (same markets in any order)
      const selectedMarketIds = [market1.marketId, market2.marketId];
      const duplicatePool = findDuplicateCombo(
        selectedMarketIds,
        existingComboPools,
      );
      if (duplicatePool) {
        newErrors.markets = `A combo pool with these markets already exists as pool #${duplicatePool.poolId}. Combos with the same markets (regardless of order) share the same tokens and trades.`;
      }
    }

    // Validate spot prices
    if (form.spotPrices.length > 0) {
      const total = form.spotPrices.reduce((sum, price) => {
        const numPrice = parseFloat(price || "0");
        return sum + (isNaN(numPrice) ? 0 : numPrice);
      }, 0);

      if (Math.abs(total - 100) > 0.01) {
        newErrors.spotPrices = `Spot prices must sum to 100% (currently ${total.toFixed(2)}%)`;
      }

      form.spotPrices.forEach((price, index) => {
        const numPrice = parseFloat(price || "0");
        const safePrice = isNaN(numPrice) ? 0 : numPrice;
        if (safePrice < 0.5 || safePrice > 95) {
          newErrors.spotPrices = "Each price must be between 0.5% and 95%";
        }
      });
    }

    // Validate liquidity amount
    const liquidityNum = parseFloat(form.liquidityAmount || "0");
    if (liquidityNum < 200) {
      newErrors.liquidityAmount = "Liquidity amount must be at least 200 ZTG";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check for duplicate combo in real-time
  const duplicatePool = useMemo(() => {
    if (form.selectedMarkets.length === 2) {
      const marketIds = form.selectedMarkets.map((m) => m.marketId);
      return findDuplicateCombo(marketIds, existingComboPools);
    }
    return undefined;
  }, [form.selectedMarkets, existingComboPools]);

  // Handle market selection
  const selectMarket = (market: FullMarketFragment) => {
    if (form.selectedMarkets.length < 2) {
      setForm((prev) => ({
        ...prev,
        selectedMarkets: [...prev.selectedMarkets, market],
      }));
    }
  };

  // Handle market removal
  const removeMarket = (marketId: number) => {
    setForm((prev) => ({
      ...prev,
      selectedMarkets: prev.selectedMarkets.filter(
        (m) => m.marketId !== marketId,
      ),
    }));
  };

  // Handle spot price change
  const updateSpotPrice = (index: number, value: string) => {
    // Only allow numbers and one decimal point
    const sanitizedValue = value
      .replace(/[^0-9.]/g, "")
      .replace(/(\..*?)\./g, "$1");

    // If completely empty, default to "0"
    if (sanitizedValue === "") {
      setForm((prev) => ({
        ...prev,
        spotPrices: prev.spotPrices.map((price, i) =>
          i === index ? "0" : price,
        ),
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      spotPrices: prev.spotPrices.map((price, i) =>
        i === index ? sanitizedValue : price,
      ),
    }));
  };

  // Handle liquidity amount change
  const updateLiquidityAmount = (value: string) => {
    // Only allow numbers and one decimal point
    const sanitizedValue = value
      .replace(/[^0-9.]/g, "")
      .replace(/(\..*?)\./g, "$1");

    // If completely empty, default to "0"
    if (sanitizedValue === "") {
      setForm((prev) => ({ ...prev, liquidityAmount: "0" }));
      return;
    }

    setForm((prev) => ({ ...prev, liquidityAmount: sanitizedValue }));
  };

  // Handle key press to prevent invalid characters
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow control keys and navigation
    if (
      [
        "Backspace",
        "Delete",
        "Tab",
        "Escape",
        "Enter",
        "Home",
        "End",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
      ].includes(e.key) ||
      // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (e.ctrlKey && ["a", "c", "v", "x"].includes(e.key))
    ) {
      return;
    }
    // Only allow numbers and decimal point
    if (!/[0-9.]/.test(e.key)) {
      e.preventDefault();
    }
  };

  // Deploy combinatorial pool
  const {
    isLoading: isTransactionLoading,
    send: deployPool,
    fee,
  } = useExtrinsic(
    () => {
      if (!isRpcSdk(sdk) || form.selectedMarkets.length !== 2) {
        return;
      }

      const marketIds = form.selectedMarkets.map((m) => m.marketId);
      const liquidityNum = parseFloat(form.liquidityAmount || "0");
      const safeLiquidity = isNaN(liquidityNum) ? 0 : Math.max(0, liquidityNum);
      const liquidityAmount = new Decimal(safeLiquidity)
        .mul(10 ** 10)
        .toFixed(0);
      const spotPricesFormatted = form.spotPrices.map((price) => {
        const numPrice = parseFloat(price || "0");
        const safePrice = isNaN(numPrice) ? 0 : Math.max(0, numPrice); // Ensure non-negative
        return new Decimal(safePrice)
          .div(100)
          .mul(10 ** 10)
          .toFixed(0);
      });
      const swapFeeFormatted = new Decimal(form.swapFee)
        .div(100)
        .mul(10 ** 10)
        .toFixed(0);

      return sdk.api.tx.neoSwaps.deployCombinatorialPool(
        outcomeCombinations.length,
        marketIds,
        liquidityAmount,
        spotPricesFormatted,
        swapFeeFormatted,
        { total: 16, consumeAll: true }, // Default fuel
      );
    },
    {
      onSuccess: (data) => {
        notificationStore.pushNotification(
          "Combinatorial pool deployed successfully!",
          {
            type: "Success",
          },
        );

        // Extract pool ID from events and redirect
        const poolDeployedEvent = data.events.find(
          (event) =>
            event.event.section === "neoSwaps" &&
            event.event.method === "CombinatorialPoolDeployed",
        );

        if (poolDeployedEvent) {
          const eventData = poolDeployedEvent.event.data;

          if (!eventData || eventData.length < 3) {
            console.error("Invalid pool deployment event data structure");
            return;
          }

          const poolId = eventData[2].toString();
          router.push(`/multi-market/${poolId}`);
        }
      },
      onError: () => {
        notificationStore.pushNotification(
          "Failed to deploy combinatorial pool",
          {
            type: "Error",
            autoRemove: true,
          },
        );
      },
    },
  );

  const handleDeploy = async () => {
    if (validateForm()) {
      setIsDeploying(true);
      try {
        await deployPool();
      } finally {
        setIsDeploying(false);
      }
    }
  };

  return (
    <div className="pb-4 md:pb-6">
      <div className="mb-6">
        <h1 className="mb-3 text-center text-2xl font-bold text-white md:text-3xl">
          Create Combinatorial Market
        </h1>

        {/* Collapsible Instructions */}
        <Disclosure>
          {({ open }) => (
            <div className="mx-auto">
              <div className="rounded-lg border border-white/20 bg-white/10 p-3 shadow-lg backdrop-blur-lg md:p-4">
                <Disclosure.Button className="flex w-full items-center justify-between text-left">
                  <div className="flex items-center gap-2">
                    <Info size={18} className="text-ztg-green-400" />
                    <h3 className="text-sm font-semibold text-white md:text-base">
                      How Combinatorial Markets Work
                    </h3>
                  </div>
                  {open ? (
                    <ChevronUp size={18} className="text-white/70" />
                  ) : (
                    <ChevronDown size={18} className="text-white/70" />
                  )}
                </Disclosure.Button>
                <Disclosure.Panel className="mt-3 space-y-3 text-xs md:text-sm">
                  <p className="text-white/90">
                    Trade on <strong>conditional outcomes</strong> — what happens
                    in one market given an outcome in another.{" "}
                    <strong className="text-blue-300">Market 1 ("Assume")</strong>{" "}
                    is the condition, and{" "}
                    <strong className="text-ztg-green-400">Market 2 ("Then")</strong>{" "}
                    is the consequence.
                  </p>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="rounded-md bg-white/5 p-2.5 shadow-sm backdrop-blur-sm">
                      <div className="mb-1 text-xs font-semibold text-white/80">
                        Example 1:
                      </div>
                      <p className="text-xs leading-relaxed text-white/75">
                        <strong className="text-blue-300">Assume:</strong>{" "}
                        "Referendum #1764 passes",{" "}
                        <strong className="text-blue-300">No</strong> <br />
                        <strong className="text-ztg-green-400">THEN:</strong>{" "}
                        "Ecosystem gains 100k new users",{" "}
                        <strong className="text-ztg-green-400">Short</strong>
                      </p>
                    </div>
                    <div className="rounded-md bg-white/5 p-2.5 shadow-sm backdrop-blur-sm">
                      <div className="mb-1 text-xs font-semibold text-white/80">
                        Example 2:
                      </div>
                      <p className="text-xs leading-relaxed text-white/75">
                        <strong className="text-blue-300">Assume:</strong>{" "}
                        "Lakers win championship",{" "}
                        <strong className="text-blue-300">Yes</strong> <br />
                        <strong className="text-ztg-green-400">THEN:</strong>{" "}
                        "Bitcoin reaches $100k",{" "}
                        <strong className="text-ztg-green-400">Long</strong>
                      </p>
                    </div>
                  </div>
                </Disclosure.Panel>
              </div>
            </div>
          )}
        </Disclosure>
      </div>

      {/* Market Selection */}
      <div className="mb-6 rounded-lg border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-lg md:p-5">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-white md:text-lg">
          <span className="h-1 w-8 rounded-full bg-ztg-green-500"></span>
          Step 1: Select Markets
        </h2>

        {/* Selected Markets - Compact Grid Layout */}
        {form.selectedMarkets.length > 0 && (
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            {form.selectedMarkets.map((market, index) => {
              const marketRole = index === 0 ? "Assume" : "Then";
              const roleBorderColor =
                index === 0 ? "border-blue-400/60" : "border-ztg-green-400/60";

              return (
                <div
                  key={market.marketId}
                  className={`relative flex flex-col gap-2 rounded-lg border-l-4 ${roleBorderColor} bg-white/10 p-3 shadow-md backdrop-blur-md transition-all hover:bg-white/15`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="mb-1.5 flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold ${
                            index === 0
                              ? "text-blue-300"
                              : "text-ztg-green-400"
                          }`}
                        >
                          {marketRole}
                        </span>
                      </div>
                      <h3 className="mb-1 text-sm font-medium text-white line-clamp-2">
                        {market.question}
                      </h3>
                      <p className="text-xs text-white/70">
                        {market.categories?.length} Outcomes:{" "}
                        <span className="text-white/80">
                          {market.categories
                            ?.slice(0, 2)
                            .map((cat) => cat.name)
                            .join(", ")}
                          {market.categories && market.categories.length > 2
                            ? ` +${market.categories.length - 2}`
                            : ""}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => removeMarket(market.marketId)}
                      className="flex-shrink-0 rounded p-1 text-white/60 transition-all hover:bg-white/10 hover:text-white active:scale-95"
                      title="Remove market"
                    >
                      <AiOutlineClose size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Market Dropdown Search */}
        {form.selectedMarkets.length < 2 && (
          <MarketSelect
            onSelectMarket={selectMarket}
            excludeMarketIds={form.selectedMarkets.map((m) => m.marketId)}
            selectedCount={form.selectedMarkets.length}
            maxSelections={2}
          />
        )}

        {/* Duplicate warning */}
        {duplicatePool && !errors.markets && (
          <div className="mt-3 rounded-lg border-2 border-orange-500/60 bg-white/10 p-3 backdrop-blur-lg">
            <div className="flex items-start gap-2">
              <BsExclamationTriangle
                className="mt-0.5 flex-shrink-0 text-orange-400"
                size={16}
              />
              <div className="flex-1">
                <p className="text-xs font-semibold text-white md:text-sm">
                  Duplicate Markets Detected
                </p>
                <p className="mt-1 text-xs text-white/90 md:text-sm">
                  A combo pool with these markets already exists as{" "}
                  <a
                    href={`/multi-market/${duplicatePool.poolId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-ztg-green-400 underline transition-colors hover:text-ztg-green-300"
                  >
                    Combo Pool #{duplicatePool.poolId}
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        )}

        {errors.markets && (
          <div className="mt-3 flex items-start gap-2 text-xs text-ztg-red-400 md:text-sm">
            <BsExclamationTriangle className="mt-0.5 flex-shrink-0" size={14} />
            <span>{errors.markets}</span>
          </div>
        )}
      </div>

      {/* Outcome Combinations Preview */}
      {/* {outcomeCombinations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Outcome Combinations ({outcomeCombinations.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {outcomeCombinations.map((combination, index) => (
              <div key={combination.id} className="p-4 border-2 rounded-lg bg-white shadow-sm">
                <div className="flex items-center mb-2">
                  <div
                    className="w-4 h-4 rounded-full mr-2"
                    style={{ backgroundColor: combination.color }}
                  />
                  <h3 className="font-medium">{combination.name}</h3>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div><span className="font-medium">Market 1:</span> {combination.market1Outcome}</div>
                  <div><span className="font-medium">Market 2:</span> {combination.market2Outcome}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )} */}

      {/* Outcome Combinations with Pricing */}
      {outcomeCombinations.length > 0 && form.selectedMarkets.length === 2 && (
        <div className="mb-6 rounded-lg border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-lg md:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-white md:text-lg">
              <span className="h-1 w-8 rounded-full bg-ztg-green-500"></span>
              Step 2: Set Initial Prices ({outcomeCombinations.length} Outcomes)
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-white/70">
                Total:
              </span>
              <div className="text-right">
                <div
                  className={`text-sm font-bold ${
                    Math.abs(
                      form.spotPrices.reduce((sum, price) => {
                        const numPrice = parseFloat(price || "0");
                        return sum + (isNaN(numPrice) ? 0 : numPrice);
                      }, 0) - 100,
                    ) < 0.01
                      ? "text-ztg-green-400"
                      : "text-ztg-red-400"
                  }`}
                >
                  {form.spotPrices
                    .reduce((sum, price) => {
                      const numPrice = parseFloat(price || "0");
                      return sum + (isNaN(numPrice) ? 0 : numPrice);
                    }, 0)
                    .toFixed(2)}
                  %
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {outcomeCombinations.map((combination, index) => {
              const rawPrice = form.spotPrices[index] || "0";
              const percentage = isNaN(parseFloat(rawPrice))
                ? 0
                : parseFloat(rawPrice);
              const spotPrice = (percentage / 100).toFixed(2);

              return (
                <div
                  key={combination.id}
                  className="flex items-center gap-3 rounded-lg border-l-2 bg-white/5 p-3 shadow-sm backdrop-blur-sm transition-all hover:bg-white/10"
                  style={{ borderLeftColor: combination.color }}
                >
                  {/* Outcome Name - Compact */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 text-xs font-semibold text-white">
                      {combination.name}
                    </div>
                    <div className="text-xs text-white/70">
                      <span className="text-blue-300">Assume:</span>{" "}
                      {combination.market1Outcome} •{" "}
                      <span className="text-ztg-green-400">Then:</span>{" "}
                      {combination.market2Outcome}
                    </div>
                  </div>

                  {/* Pricing - Compact */}
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-white">
                        ${spotPrice}
                      </div>
                      <div className="text-xxs text-white/60">price</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={form.spotPrices[index] || ""}
                        onChange={(e) =>
                          updateSpotPrice(index, e.target.value)
                        }
                        className="w-20 bg-white/10 px-3 py-2 text-right text-sm text-white backdrop-blur-sm"
                        step="0.1"
                        min="0"
                        max="95"
                        onKeyDown={handleKeyDown}
                      />
                      <span className="text-xs text-white/70">%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {errors.spotPrices && (
            <div className="mt-3 flex items-start gap-2 text-xs text-ztg-red-400 md:text-sm">
              <BsExclamationTriangle
                className="mt-0.5 flex-shrink-0"
                size={14}
              />
              <span>{errors.spotPrices}</span>
            </div>
          )}
        </div>
      )}

      {/* Pool Configuration */}
      {form.selectedMarkets.length === 2 && (
        <div className="mb-6 rounded-lg border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-lg md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <label className="flex items-center gap-2 text-sm font-semibold text-white md:text-base">
              <span className="h-1 w-8 rounded-full bg-ztg-green-500"></span>
              Step 3: Initial Liquidity
            </label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                className="w-28 bg-white/10 px-3 py-2 text-sm text-white backdrop-blur-sm"
                value={form.liquidityAmount}
                onChange={(e) => updateLiquidityAmount(e.target.value)}
                onKeyDown={handleKeyDown}
                min="200"
                placeholder="200"
              />
              <span className="text-sm font-medium text-white/90">
                {form.selectedMarkets[0]?.baseAsset.toLocaleUpperCase() ||
                  "ZTG"}
              </span>
              <span className="text-xs text-white/60">(min: 200)</span>
            </div>
          </div>
          {errors.liquidityAmount && (
            <div className="mt-2 flex items-start gap-2 text-xs text-ztg-red-400 md:text-sm">
              <BsExclamationTriangle
                className="mt-0.5 flex-shrink-0"
                size={14}
              />
              <span>{errors.liquidityAmount}</span>
            </div>
          )}
        </div>
      )}

      {/* Deploy Button */}
      {form.selectedMarkets.length === 2 && outcomeCombinations.length > 0 && (
        <div className="rounded-lg border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-lg md:p-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleDeploy();
            }}
            className="space-y-3"
          >
            <div className="flex justify-end">
              <FormTransactionButton
                loading={isTransactionLoading || isDeploying}
                disabled={!wallet.activeAccount || !!duplicatePool}
                className="px-6 py-2.5 text-base md:px-8"
                type="submit"
              >
                Deploy Combinatorial Pool
              </FormTransactionButton>
            </div>

            {fee && !duplicatePool && (
              <p className="text-center text-xs text-white/80 md:text-sm">
                Estimated fee:{" "}
                <span className="font-semibold text-white">
                  {formatNumberCompact(fee.amount.div(ZTG).toNumber())}{" "}
                  {fee.symbol}
                </span>
              </p>
            )}

            {!wallet.activeAccount && (
              <div className="rounded-md border-2 border-orange-500/60 bg-white/10 px-3 py-2 text-center text-xs text-white backdrop-blur-lg md:text-sm">
                Please connect your wallet to deploy the pool
              </div>
            )}

            {duplicatePool && (
              <div className="rounded-md border-2 border-orange-500/60 bg-white/10 px-3 py-2 text-center text-xs text-white backdrop-blur-lg md:text-sm">
                Cannot deploy: A combo with these markets already exists as{" "}
                <a
                  href={`/multi-market/${duplicatePool.poolId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-ztg-green-400 underline transition-colors hover:text-ztg-green-300"
                >
                  Combo Pool #{duplicatePool.poolId}
                </a>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default ComboMarketEditor;
