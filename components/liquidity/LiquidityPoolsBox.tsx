import { Skeleton } from "@material-ui/lab";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import React, { ChangeEvent, useEffect, useState } from "react";

import { useNotificationStore } from "lib/stores/NotificationStore";
import { CPool, usePoolsStore } from "lib/stores/PoolsStore";
import { useStore } from "lib/stores/Store";
import { extrinsicCallback } from "lib/util/tx";
import LiquidityCell from "../liquidity/LiquidityCell";
import Slider from "../ui/Slider";
import TransactionButton from "../ui/TransactionButton";

interface Asset {
  amount?: Decimal;
  balance: Decimal;
  poolBalance: Decimal;
  name: string;
  color: string;
}

const LiquidityPoolsBox = observer(() => {
  const [joinPool, setJoinPool] = useState<boolean>(true);
  const [multiAsset, setMultiAsset] = useState<boolean>(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [percentage, setPercentage] = useState<number>(0);
  const [selectedAssetIndex, setSelectedAssetIndex] = useState<number>(0);
  const [percentageChange, setPercentageChange] = useState<number>(0);
  const [poolSharesAmount, setPoolSharesAmount] = useState<string>("0");
  const [totalPoolShares, setTotalPoolShares] = useState<Decimal>();
  const [sharesToRecieve, setSharesToRecieve] = useState<Decimal>(
    new Decimal(0)
  );
  const [usersPoolShares, setUsersPoolShares] = useState<Decimal>(
    new Decimal(0)
  );
  const [pool, setPool] = useState<CPool>();
  const [showSkeleton, setShowSkeleton] = useState(true);
  const notificationStore = useNotificationStore();
  const router = useRouter();
  const store = useStore();

  const { wallets } = store;

  const poolsStore = usePoolsStore();

  const poolId = Number(router.query.poolid);

  const loadPoolDetails = async (pool: CPool) => {
    const swap = pool.pool;
    if (swap.status === "Stale") {
      setJoinPool(false);
    }

    const totalPoolShares = await store.sdk.api.query.tokens.totalIssuance({
      poolShare: poolId,
    });

    const usersPoolShares = await store.sdk.api.query.tokens.accounts(
      wallets.activeAccount.address,
      { poolShare: poolId }
    );

    setUsersPoolShares(
      new Decimal((usersPoolShares as any).free.toString()).div(ZTG)
    );
    setTotalPoolShares(new Decimal(Number(totalPoolShares)).div(ZTG));

    const balancePromises = pool.assets.map(async (asset, idx) => ({
      poolBalance: await store.getPoolBalance(swap, swap.assets[idx]),
      userBalance: await store.getBalance(swap.assets[idx]),
    }));

    const balances = await Promise.all(balancePromises);

    const assets: Asset[] = pool.assets.map((asset, index) => ({
      amount: new Decimal(0),
      balance: balances[index].userBalance,
      poolBalance: balances[index].poolBalance,
      name: asset.ticker,
      color: asset.color,
    }));

    setAssets(assets);
  };

  useEffect(() => {
    if (!wallets.connected) {
      return;
    }
    (async () => {
      if (poolId != null) {
        const pool = await poolsStore.getPoolFromChain(poolId);
        setPool(pool);
        pool != null && loadPoolDetails(pool);
      }
    })();
  }, [poolId, wallets.connected]);

  useEffect(() => {
    if (assets.length > 0) {
      setShowSkeleton(false);
    }
  }, [assets]);

  useEffect(() => {
    if (joinPool === true) return;

    const poolSharesToExit = Decimal.mul(
      percentageChange / 100,
      usersPoolShares
    );
    const poolSharesRatio = Decimal.div(poolSharesToExit, totalPoolShares);

    if (multiAsset === true) {
      setAssets((prevAssets) => {
        return prevAssets.map((asset) => {
          return {
            ...asset,
            amount: Decimal.mul(poolSharesRatio, asset.poolBalance),
          };
        });
      });
    } else {
      //TODO: after release
      // const balance = wallets.activeBalance.toNumber();
      // setAssets((prevAssets) => {
      //   return prevAssets.map((asset, index) => {
      //     if (index === selectedAssetIndex) {
      //       return {
      //         ...asset,
      //         amount: (percentageChange / 100) * balance,
      //       };
      //     } else {
      //       return { ...asset, amount: 0 };
      //     }
      //   });
      // });
    }
    setPercentage(percentageChange);
  }, [percentageChange, multiAsset, selectedAssetIndex, wallets.activeBalance]);

  const handlePoolSharesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const amount = event.target.value;

    if (amount !== "") {
      setPoolSharesAmount(amount);
      setPercentageChange(
        Number(
          Decimal.mul(Decimal.div(amount, usersPoolShares), 100).toFixed(1)
        )
      );
    } else {
      setPoolSharesAmount("");

      setPercentageChange(0);
    }
  };

  const handleSignTransaction = async () => {
    const signer = wallets.getActiveSigner();

    if (joinPool === true && isValidJoin(assets) === true) {
      const amountsIn = assets.map((asset) =>
        new Decimal(new Decimal(asset.amount).toFixed(2, Decimal.ROUND_UP))
          .mul(10 ** 10)
          .toString()
      );
      const sharesOut = new Decimal(
        new Decimal(sharesToRecieve).toFixed(2, Decimal.ROUND_DOWN)
      )
        .mul(10 ** 10)
        .toString();

      await pool.pool.joinPool(
        signer,
        sharesOut,
        amountsIn,
        poolTransactionCallback(
          `Swapped ${assets
            .map((asset) => `${asset.amount.toFixed(2)} ${asset.name}`)
            .join(", ")} for ${sharesToRecieve.toFixed(2)} Pool Shares`
        )
      );
    } else if (
      joinPool === false &&
      new Decimal(poolSharesAmount).lessThanOrEqualTo(usersPoolShares)
    ) {
      const amountsOut = assets.map((asset) =>
        new Decimal(new Decimal(asset.amount).toFixed(1, Decimal.ROUND_DOWN))
          .mul(10 ** 10)
          .toString()
      );
      const sharesIn = new Decimal(
        new Decimal(poolSharesAmount).toFixed(1, Decimal.ROUND_UP)
      )
        .mul(10 ** 10)
        .toString();

      await pool.pool.exitPool(
        signer,
        sharesIn,
        amountsOut,
        poolTransactionCallback(
          `Swapped ${Number(poolSharesAmount).toFixed(
            1
          )} Pool Shares for ${assets
            .map((asset) => `${asset.amount.toFixed(1)} ${asset.name}`)
            .join(", ")}`
        )
      );
    }
  };

  const poolTransactionCallback = (successMessage: string) => {
    return extrinsicCallback({
      notificationStore,
      successCallback: async () => {
        notificationStore.pushNotification(successMessage, {
          type: "Success",
        });
        await loadPoolDetails(pool);
        await pool.market.updatePool();
        resetAssetAmounts();
      },
      failCallback: ({ index, error }) => {
        notificationStore.pushNotification(
          store.getTransactionError(index, error),
          { type: "Error" }
        );
      },
    });
  };

  const isValidJoin = (assets: Asset[]) => {
    return (
      assets.some((asset) => asset.amount.greaterThan(asset.balance)) === false
    );
  };

  const handlePercentageChange = (value: number) => {
    setPoolSharesAmount(usersPoolShares.mul(value / 100).toFixed(2));
    setPercentageChange(value);
  };

  const handleAmountChange = (amount: number, index: number) => {
    if (joinPool === true) {
      setSharesToRecieve(
        totalPoolShares.mul(new Decimal(amount).div(assets[index].poolBalance))
      );
    } else {
      const poolShares = usersPoolShares.mul(
        new Decimal(amount).div(assets[index].poolBalance)
      );
      setPoolSharesAmount(poolShares.toFixed(2));
      setPercentage(
        Number(poolShares.div(usersPoolShares).mul(100).toFixed(1))
      );
    }
    if (multiAsset === true) {
      setAssets((prevAssets) => {
        const amountToPoolBalanceRatio = new Decimal(amount).div(
          prevAssets[index].poolBalance
        );

        return prevAssets.map((asset) => {
          return {
            ...asset,
            amount: amountToPoolBalanceRatio.mul(asset.poolBalance),
          };
        });
      });
    } else {
      //TODO: after release
      // setAssets((prevAssets) => {
      //   prevAssets[index].amount = amount;
      //   return [...prevAssets];
      // });
    }
  };

  const handleAssetSelection = (assetIndex: number) => {
    setSelectedAssetIndex(assetIndex);
  };

  const handleMultiAssetClick = () => {
    setMultiAsset(true);
    resetAssetAmounts();
  };

  const handleSingleAssetClick = () => {
    setMultiAsset(false);
    resetAssetAmounts();
  };

  const handleJoinPoolClick = () => {
    setJoinPool(true);
    resetAssetAmounts();
  };

  const handleExitPoolClick = () => {
    setJoinPool(false);
    resetAssetAmounts();
  };

  const resetAssetAmounts = () => {
    setAssets((prevAssets) => {
      return prevAssets.map((asset) => {
        return { ...asset, amount: new Decimal(0) };
      });
    });
    setPercentageChange(0);
    setPoolSharesAmount("0");
    setSharesToRecieve(new Decimal(0));
  };

  const canJoin = (): boolean => {
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      if (asset.amount.equals(0) || asset.balance.lessThan(asset.amount)) {
        return false;
      }
    }

    return true;
  };

  const canExit = (): boolean => {
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      if (asset.amount.equals(0)) {
        return false;
      }
    }

    if (!poolSharesAmount) return false;

    if (usersPoolShares.lessThan(poolSharesAmount)) {
      return false;
    } else {
      return true;
    }
  };

  if (pool == null) {
    return null;
  }

  if (showSkeleton) {
    return (
      <Skeleton
        className="!py-ztg-10 !rounded-ztg-10 !transform-none"
        height={474}
      />
    );
  }

  return (
    <div className="p-ztg-15 rounded-ztg-10 text-sky-600 bg-white dark:bg-sky-1000">
      <div className="font-kanit font-bold text-ztg-14-150">
        {pool?.pool?.status !== "Stale" ? (
          <span
            onClick={handleJoinPoolClick}
            className={`${joinPool === true ? "text-sunglow" : ""}`}
            role="button"
          >
            Join
          </span>
        ) : (
          <></>
        )}
        <span
          onClick={handleExitPoolClick}
          className={`${joinPool === false ? "text-sunglow" : ""} ml-ztg-15`}
          role="button"
        >
          Exit
        </span>
      </div>
      {/* <Switch
        leftLabel="Join Pool"
        rightLabel="Exit Pool"
        onLeftSideClick={handleJoinPoolClick}
        onRightSideClick={handleExitPoolClick}
      /> */}
      {/* TODO- post beta */}
      {/* <Switch
        leftLabel="Multi Asset"
        rightLabel="Single Asset"
        onLeftSideClick={handleMultiAssetClick}
        onRightSideClick={handleSingleAssetClick}
      /> */}
      {assets.map((cell, index) => (
        <LiquidityCell
          key={index}
          amount={cell.amount.toString()}
          color={cell.color}
          balance={cell.balance.toString()}
          asset={cell.name}
          selectable={multiAsset === false}
          selected={multiAsset === false && selectedAssetIndex === index}
          disabled={multiAsset === false && selectedAssetIndex !== index}
          onSelected={() => handleAssetSelection(index)}
          onAmountChange={(amount) => handleAmountChange(amount, index)}
        />
      ))}
      {joinPool === false ? (
        <>
          <label>
            <div className="font-kanit font-bold text-black dark:text-white px-ztg-8 mb-ztg-10 mt-ztg-20">
              Pool Shares to Withdraw
            </div>
            <input
              className="font-mono text-ztg-14-150 h-ztg-40 w-full rounded-ztg-5 bg-sky-200  text-right mb-ztg-10 !pr-ztg-8 !pl-ztg-38 dark:bg-black text-black dark:text-white"
              value={poolSharesAmount}
              onChange={handlePoolSharesChange}
              // min="0"
              // max={usersPoolShares.toString()}
            />
            {/* TODO use this instead, seems to be emitting the onChange event when poolShareAmount is updated which is creating an infite loop */}
            {/* <AmountInput
            className="font-mono text-ztg-16-150 font-bold w-32"
            value={poolSharesAmount}
            onChange={handlePoolSharesChange}
            min="0"
          /> */}
          </label>
          <div className="flex flex-col items-center my-4 mx-2">
            <Slider onChange={handlePercentageChange} value={percentage} />
          </div>
        </>
      ) : (
        <></>
      )}

      {joinPool === true ? (
        <div className="h-ztg-18 flex px-ztg-8 justify-between text-ztg-12-150 my-ztg-10 ">
          <span className="font-lato font-bold">Pool Shares to Receive:</span>
          <span className="font-mono font-medium">
            {sharesToRecieve.toFixed(2)}
          </span>
        </div>
      ) : (
        <></>
      )}
      <TransactionButton
        className="mb-ztg-10 shadow-ztg-2"
        onClick={handleSignTransaction}
        disabled={joinPool === true ? canJoin() === false : canExit() === false}
      >
        {joinPool === true ? "Add Liquidity" : "Remove Liquidity"}
      </TransactionButton>
      {/* <div className="h-ztg-18 flex px-ztg-8 justify-between text-ztg-12-150 font-bold">
        <span>Exchange Fee:</span>
        <span className="font-mono">2000,78687</span>
      </div> */}
    </div>
  );
});

export default LiquidityPoolsBox;
