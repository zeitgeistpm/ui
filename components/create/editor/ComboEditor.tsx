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
          <div className="text-sm font-medium">{children}</div>
          <div className="mt-1 text-xs text-gray-500">
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
      <div className="p-3 text-center text-sm text-gray-500">
        {inputValue ? "No markets found" : "No active markets available"}
      </div>
    ),
    MenuList: ({ children, ...props }: any) => (
      <components.MenuList {...props}>
        {!searchQuery && marketOptions.length > 0 && (
          <div className="border-b p-2 text-xs text-gray-500">
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
      borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
      boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
      "&:hover": {
        borderColor: "#9ca3af",
      },
    }),
    menu: (provided: any) => ({
      ...provided,
      zIndex: 50,
    }),
    menuList: (provided: any) => ({
      ...provided,
      maxHeight: "300px",
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: "#9ca3af",
    }),
  };

  if (selectedCount >= maxSelections) {
    return null;
  }

  return (
    <div className="mb-6">
      <label className="mb-4 block text-xl font-semibold">
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
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-12">
        <h1 className="mb-4 text-center text-3xl font-bold">
          Create Combinatorial Market
        </h1>
        <p className="text-center text-gray-600">
          Combine two existing markets to create complex multi-outcome
          combinations.
        </p>
      </div>

      {/* Market Selection */}
      <div className="mb-8">
        {/* Selected Markets */}
        {form.selectedMarkets.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-4 text-xl font-semibold">
              Selected Markets ({form.selectedMarkets.length})
            </h2>
            <div className="space-y-3">
              {form.selectedMarkets.map((market, index) => (
                <div
                  key={market.marketId}
                  className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm"
                >
                  <div className="flex-1">
                    <div className="mb-2 flex items-center">
                      <span className="mr-3 rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                        Market {index + 1}
                      </span>
                      <h4 className="font-medium">{market.question}</h4>
                    </div>
                    <p className="text-sm text-gray-500">
                      {market.categories?.length} Outcomes:{" "}
                      {market.categories?.map((cat) => cat.name).join(" • ")}
                    </p>
                  </div>
                  <button
                    onClick={() => removeMarket(market.marketId)}
                    className="rounded p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                    title="Remove market"
                  >
                    <AiOutlineClose size={18} />
                  </button>
                </div>
              ))}
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

        {errors.markets && (
          <div className="mt-4 flex items-center text-sm text-red-500">
            <BsExclamationTriangle className="mr-1" />
            {errors.markets}
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
              <div key={combination.id} className="p-4 border rounded-lg bg-white shadow-sm">
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

      {/* Spot Prices */}
      {outcomeCombinations.length > 0 && (
        <div className="mb-4">
          <h2 className="mb-4 text-xl font-semibold">
            Outcome Combinations ({outcomeCombinations.length})
          </h2>
          <div className="space-y-4">
            {outcomeCombinations.map((combination, index) => {
              const rawPrice = form.spotPrices[index] || "0";
              // Safely parse the percentage, handling temporary invalid states
              const percentage = isNaN(parseFloat(rawPrice))
                ? 0
                : parseFloat(rawPrice);
              const spotPrice = (percentage / 100).toFixed(2);

              return (
                <div
                  key={combination.id}
                  className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-1 items-center">
                    <div
                      className="mr-3 h-4 w-4 rounded-full"
                      style={{ backgroundColor: combination.color }}
                    />
                    <div className="flex-1">
                      <span className="font-medium">{combination.name}</span>
                      <div className="mt-1 text-sm text-gray-500">
                        Market 1: {combination.market1Outcome} • Market 2:{" "}
                        {combination.market2Outcome}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {/* Prominent Spot Price Display */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        ${spotPrice}
                      </div>
                      <div className="text-xxs text-gray-500">
                        initial spot price
                      </div>
                    </div>
                    {/* Percentage Input */}
                    <div className="flex items-center">
                      <Input
                        type="number"
                        value={form.spotPrices[index] || ""}
                        onChange={(e) => updateSpotPrice(index, e.target.value)}
                        className="text-right"
                        step="0.1"
                        min="0"
                        max="95"
                        onKeyDown={handleKeyDown}
                      />
                      <span className="ml-2 text-gray-500">%</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Price Summary */}
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
              <span className="font-semibold">Total Probability</span>
              <div className="text-right">
                <div className="text-lg font-bold">
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
                      ? "text-green-600"
                      : "text-red-600"
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
            <div className="mt-2 flex items-center text-sm text-red-500">
              <BsExclamationTriangle className="mr-1" />
              {errors.spotPrices}
            </div>
          )}
        </div>
      )}

      {/* Pool Configuration */}
      {form.selectedMarkets.length === 2 && (
        <div className="mb-8 rounded-lg bg-gray-50 p-4">
          <div className="grid grid-cols-1 gap-6">
            {/* Liquidity Amount */}
            <div className="flex items-center justify-between">
              <label className="text-xl font-semibold">Initial Liquidity</label>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  className="w-32"
                  value={form.liquidityAmount}
                  onChange={(e) => updateLiquidityAmount(e.target.value)}
                  onKeyDown={handleKeyDown}
                  min="200"
                  placeholder="200"
                />
                <span>
                  {form.selectedMarkets[0]?.baseAsset.toLocaleUpperCase() ||
                    "ZTG"}
                </span>
              </div>
              {errors.liquidityAmount && (
                <div className="mt-1 flex items-center text-sm text-red-500">
                  <BsExclamationTriangle className="mr-1" />
                  {errors.liquidityAmount}
                </div>
              )}
            </div>
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
              disabled={!wallet.activeAccount}
              className="px-8 py-3 text-lg"
              type="submit"
            >
              Deploy Combinatorial Pool
            </FormTransactionButton>
          </form>

          {fee && (
            <p className="mt-2 text-sm text-gray-500">
              Estimated transaction fee:{" "}
              {formatNumberCompact(fee.amount.div(ZTG).toNumber())} {fee.symbol}
            </p>
          )}

          {!wallet.activeAccount && (
            <p className="mt-2 text-sm text-red-500">
              Please connect your wallet to deploy the pool
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ComboMarketEditor;
