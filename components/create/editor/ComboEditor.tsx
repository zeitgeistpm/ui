import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { isRpcSdk } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import Select, { SingleValue, components } from "react-select";
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
          <div className="text-sm font-medium text-ztg-primary-100">{children}</div>
          <div className="mt-1 text-xs text-ztg-primary-200">
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
      <div className="p-3 text-center text-sm text-ztg-primary-200">
        {inputValue ? "No markets found" : "No active markets available"}
      </div>
    ),
    MenuList: ({ children, ...props }: any) => (
      <components.MenuList {...props}>
        {!searchQuery && marketOptions.length > 0 && (
          <div className="border-b-2 border-ztg-primary-400/30 p-2 text-xs text-ztg-primary-200">
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
      borderColor: state.isFocused ? "#22B57A" : "rgba(145, 201, 236, 0.2)",
      backgroundColor: "rgba(19, 78, 147, 0.5)",
      color: "#C5E2F5",
      backdropFilter: "blur(12px)",
      boxShadow: state.isFocused ? "0 0 0 1px #22B57A" : "none",
      "&:hover": {
        borderColor: "#22B57A80",
      },
    }),
    menu: (provided: any) => ({
      ...provided,
      zIndex: 50,
      backgroundColor: "rgba(19, 78, 147, 0.95)",
      color: "#C5E2F5",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(34, 181, 122, 0.3)",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.5)",
    }),
    menuList: (provided: any) => ({
      ...provided,
      maxHeight: "300px",
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: "#6BB3E4",
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: "#C5E2F5",
    }),
    input: (provided: any) => ({
      ...provided,
      color: "#C5E2F5",
    }),
  };

  if (selectedCount >= maxSelections) {
    return null;
  }

  return (
    <div className="mb-6">
      <label className="mb-3 block text-lg font-semibold text-white md:text-xl">
        Select Markets ({selectedCount}/{maxSelections})
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
        menuPlacement="auto"
        menuPosition="fixed"
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
    <div className="container-fluid mx-auto pb-4 md:pb-6">
      <div className="mb-8 md:mb-12">
        <h1 className="mb-4 text-center text-2xl font-bold text-white md:text-3xl">
          Create Combinatorial Market
        </h1>

        {/* Concise Instructions */}
        <div className="mx-auto mt-6">
          <div className="rounded-lg bg-white/10 p-5 shadow-xl backdrop-blur-lg md:p-6">
            <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-white md:text-lg">
              <span className="h-1.5 w-10 rounded-full bg-ztg-green-500"></span>
              How Combinatorial Markets Work
            </h3>

            <div className="space-y-4 text-sm">
              {/* Core Concept */}
              <p className="text-white/90">
                Trade on <strong>conditional outcomes</strong> — what happens in
                one market given an outcome in another.
                <strong className="text-blue-300">
                  {" "}
                  Market 1 ("Assume")
                </strong>{" "}
                is the condition, and
                <strong className="text-ztg-green-400">
                  {" "}
                  Market 2 ("Then")
                </strong>{" "}
                is the consequence or welfare metric.
              </p>

              {/* Examples */}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-md bg-white/5 p-3 shadow-sm backdrop-blur-sm">
                  <div className="mb-1 text-xs font-semibold text-white/80">
                    Example 1:
                  </div>
                  <p className="text-xs leading-relaxed text-white/75">
                    <strong className="text-blue-300">Assume:</strong>{" "}
                    "Referendum #1764 passes",{" "}
                    <strong className="text-blue-300">No</strong> <br />
                    <strong className="text-ztg-green-400">THEN:</strong> "Ecosystem
                    gains 100k new users",
                    <strong className="text-ztg-green-400"> Short</strong>
                  </p>
                </div>
                <div className="rounded-md bg-white/5 p-3 shadow-sm backdrop-blur-sm">
                  <div className="mb-1 text-xs font-semibold text-white/80">
                    Example 2:
                  </div>
                  <p className="text-xs leading-relaxed text-white/75">
                    <strong className="text-blue-300">Assume:</strong> "Lakers
                    win championship",{" "}
                    <strong className="text-blue-300">Yes</strong> <br />
                    <strong className="text-ztg-green-400">THEN:</strong> "Bitcoin
                    reaches $100k",{" "}
                    <strong className="text-ztg-green-400">Long</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Market Selection */}
      <div className="mb-8">
        {/* Selected Markets */}
        {form.selectedMarkets.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white md:text-xl">
              <span className="h-1.5 w-8 rounded-full bg-ztg-green-500"></span>
              Selected Markets ({form.selectedMarkets.length})
            </h2>
            <div className="space-y-3">
              {form.selectedMarkets.map((market, index) => {
                const marketRole = index === 0 ? "Assume" : "Then";
                const roleColor =
                  index === 0
                    ? "bg-blue-100/80 text-blue-800"
                    : "bg-green-100/80 text-green-800";
                const roleDescription =
                  index === 0
                    ? "The condition/assumption market (i.e. event market)"
                    : "The outcome/consequence market (i.e. welfare metric market)";

                return (
                  <div
                    key={market.marketId}
                    className="flex flex-col gap-3 rounded-lg bg-white/10 p-4 shadow-lg backdrop-blur-md transition-all hover:bg-white/15 hover:shadow-xl md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded px-2 py-1 text-xs font-semibold ${roleColor}`}
                        >
                          "{marketRole}" Market
                        </span>
                        <h3 className="text-sm font-medium text-white md:text-base">
                          {market.question}
                        </h3>
                      </div>
                      <div className="mb-1 text-xs italic text-white/70">
                        {roleDescription}
                      </div>
                      <p className="text-xs text-white/80 md:text-sm">
                        {market.categories?.length} Outcomes:{" "}
                        {market.categories?.map((cat) => cat.name).join(" • ")}
                      </p>
                    </div>
                    <button
                      onClick={() => removeMarket(market.marketId)}
                      className="self-end rounded p-2 text-ztg-red-500 transition-all hover:bg-ztg-red-50/80 hover:text-ztg-red-700 active:scale-95 md:self-auto"
                      title="Remove market"
                    >
                      <AiOutlineClose size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Market Dropdown Search */}
        <MarketSelect
          onSelectMarket={selectMarket}
          excludeMarketIds={form.selectedMarkets.map((m) => m.marketId)}
          selectedCount={form.selectedMarkets.length}
          maxSelections={2}
        />

        {/* Duplicate warning - shown immediately when duplicate is detected */}
        {duplicatePool && !errors.markets && (
          <div className="mt-4 rounded-lg border-2 border-orange-500/60 bg-white/10 p-4 backdrop-blur-lg">
            <div className="flex items-start gap-2">
              <BsExclamationTriangle className="mt-0.5 flex-shrink-0 text-orange-400" size={18} />
              <div>
                <p className="text-sm font-semibold text-white">
                  Duplicate Markets Detected
                </p>
                <p className="mt-1 text-sm text-white/90">
                  A combo pool with these markets already exists as{" "}
                  <a
                    href={`/multi-market/${duplicatePool.poolId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-ztg-green-400 underline transition-colors hover:text-ztg-green-300"
                  >
                    Combo Pool #{duplicatePool.poolId}
                  </a>
                  . Please select different markets.
                </p>
              </div>
            </div>
          </div>
        )}

        {errors.markets && (
          <div className="mt-4 flex items-start gap-2 text-sm text-ztg-red-500">
            <BsExclamationTriangle className="mt-0.5 flex-shrink-0" size={16} />
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
        <div className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white md:text-xl">
            <span className="h-1.5 w-10 rounded-full bg-ztg-green-500"></span>
            Outcome Combinations & Pricing ({outcomeCombinations.length}{" "}
            Outcomes)
          </h2>
          {/* Helpful tip */}
          <div className="my-3 rounded-md bg-white/10 p-3 text-xs text-white/90 backdrop-blur-lg">
            💡 <strong className="text-ztg-green-400">Tip:</strong> These combinations show how traders will
            interpret your market. Make sure the logic flows naturally from the
            "Assume" condition to the "Then" outcome.
          </div>
          <div className="space-y-4">
            {outcomeCombinations.map((combination, index) => {
              const rawPrice = form.spotPrices[index] || "0";
              const percentage = isNaN(parseFloat(rawPrice))
                ? 0
                : parseFloat(rawPrice);
              const spotPrice = (percentage / 100).toFixed(2);

              return (
                <div
                  key={combination.id}
                  className="rounded-lg border-l-4 border-white/20 bg-white/5 p-4 shadow-lg backdrop-blur-md transition-all hover:bg-white/10 hover:shadow-xl md:p-5"
                  style={{ borderLeftColor: combination.color }}
                >
                  <div className="flex flex-col gap-4 sm:flex-row lg:items-start lg:justify-between">
                    {/* Left side: Outcome details */}
                    <div className="flex flex-1 items-start gap-3">
                      <div className="flex-1">
                        <div className="mb-2 font-bold text-white">
                          {combination.name}
                        </div>
                        <div className="text-xs leading-relaxed text-white/80">
                          <div className="mb-1">
                            <span className="font-semibold text-blue-300">
                              Assume:
                            </span>{" "}
                            <span className="italic text-white/70">
                              {form.selectedMarkets[0].question},{" "}
                            </span>
                            <span className="font-semibold uppercase text-blue-300">
                              {combination.market1Outcome}
                            </span>
                          </div>
                          <div>
                            <span className="font-semibold text-ztg-green-400">
                              THEN:
                            </span>{" "}
                            <span className="italic text-white/70">
                              {form.selectedMarkets[1].question},{" "}
                            </span>
                            <span className="font-semibold uppercase text-ztg-green-400">
                              {combination.market2Outcome}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right side: Pricing */}
                    <div className="flex items-center gap-4 lg:flex-shrink-0">
                      {/* Spot Price Display */}
                      <div className="text-right">
                        <div className="text-xl font-bold text-white">
                          ${spotPrice}
                        </div>
                        <div className="text-xxs text-white/75">
                          initial price
                        </div>
                      </div>
                      {/* Percentage Input */}
                      <div className="flex items-center">
                        <Input
                          type="number"
                          value={form.spotPrices[index] || ""}
                          onChange={(e) =>
                            updateSpotPrice(index, e.target.value)
                          }
                          className="w-30 bg-white/10 text-right text-white backdrop-blur-sm"
                          step="0.1"
                          min="0"
                          max="95"
                          onKeyDown={handleKeyDown}
                        />
                        <span className="ml-2 text-white">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Price Summary */}
            <div className="flex items-center justify-between rounded-lg bg-white/10 p-4 backdrop-blur-lg">
              <span className="font-semibold text-white">Total Probability</span>
              <div className="text-right">
                <div className="text-lg font-bold text-white">
                  {form.spotPrices
                    .reduce((sum, price) => {
                      const numPrice = parseFloat(price || "0");
                      return sum + (isNaN(numPrice) ? 0 : numPrice);
                    }, 0)
                    .toFixed(2)}
                  %
                </div>
                <div
                  className={`text-sm ${
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
                  {Math.abs(
                    form.spotPrices.reduce((sum, price) => {
                      const numPrice = parseFloat(price || "0");
                      return sum + (isNaN(numPrice) ? 0 : numPrice);
                    }, 0) - 100,
                  ) < 0.01
                    ? "✓ Probabilities sum to 100%"
                    : "⚠ Must sum to 100%"}
                </div>
              </div>
            </div>
          </div>

          {errors.spotPrices && (
            <div className="mt-2 flex items-start gap-2 text-sm text-ztg-red-500">
              <BsExclamationTriangle className="mt-0.5 flex-shrink-0" size={16} />
              <span>{errors.spotPrices}</span>
            </div>
          )}
        </div>
      )}

      {/* Pool Configuration */}
      {form.selectedMarkets.length === 2 && (
        <div className="mb-8 rounded-lg bg-white/10 p-5 shadow-xl backdrop-blur-lg md:p-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Liquidity Amount */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <label className="flex items-center gap-2 text-lg font-semibold text-white md:text-xl">
                <span className="h-1.5 w-10 rounded-full bg-ztg-green-500"></span>
                Initial Liquidity
              </label>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  className="w-32 bg-white/10 text-white backdrop-blur-sm"
                  value={form.liquidityAmount}
                  onChange={(e) => updateLiquidityAmount(e.target.value)}
                  onKeyDown={handleKeyDown}
                  min="200"
                  placeholder="200"
                />
                <span className="font-medium text-white">
                  {form.selectedMarkets[0]?.baseAsset.toLocaleUpperCase() ||
                    "ZTG"}
                </span>
              </div>
            </div>
            {errors.liquidityAmount && (
              <div className="flex items-start gap-2 text-sm text-ztg-red-500">
                <BsExclamationTriangle className="mt-0.5 flex-shrink-0" size={16} />
                <span>{errors.liquidityAmount}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deploy Button */}
      {form.selectedMarkets.length === 2 && outcomeCombinations.length > 0 && (
        <div className="text-center">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleDeploy();
            }}
          >
            <FormTransactionButton
              loading={isTransactionLoading || isDeploying}
              disabled={!wallet.activeAccount || !!duplicatePool}
              className="px-8 py-3 text-lg"
              type="submit"
            >
              Deploy Combinatorial Pool
            </FormTransactionButton>
          </form>

          {fee && !duplicatePool && (
            <p className="mt-3 text-sm text-white/90">
              Estimated transaction fee:{" "}
              <span className="font-semibold text-white">
                {formatNumberCompact(fee.amount.div(ZTG).toNumber())} {fee.symbol}
              </span>
            </p>
          )}

          {!wallet.activeAccount && (
            <div className="mt-3 rounded-md border-2 border-orange-500/60 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-lg">
              Please connect your wallet to deploy the pool
            </div>
          )}

          {duplicatePool && (
            <div className="mt-3 rounded-md border-2 border-r-2ed-500/60 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-lg">
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
        </div>
      )}
    </div>
  );
};

export default ComboMarketEditor;
