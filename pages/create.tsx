import { observer } from "mobx-react";
import { NextPage } from "next";
import { useRouter } from "next/router";
import MobxReactForm from "mobx-react-form";
import Decimal from "decimal.js";
import React, { useEffect, useRef, useState } from "react";
import { from } from "rxjs";
import { AlertTriangle } from "react-feather";
import {
  CreateMarketParams,
  CreateCpmmMarketAndDeployAssetsParams,
} from "@zeitgeistpm/sdk/dist/types/market";
import { ISubmittableResult } from "@polkadot/types/types";
import {
  DecodedMarketMetadata,
  MarketPeriod,
  MarketTypeOf,
} from "@zeitgeistpm/sdk/dist/types";
import Moment from "moment";

import { defaultOptions, defaultPlugins } from "lib/form";
import { useStore } from "lib/stores/Store";
import { useNotifications } from "lib/state/notifications";
import {
  EndType,
  isMultipleOutcomeEntries,
  isRangeOutcomeEntry,
  MultipleOutcomeEntry,
  Outcomes,
  OutcomeType,
  RangeOutcomeEntry,
} from "lib/types/create-market";
import { JSONObject } from "lib/types";
import { toBase64 } from "lib/util";
import { extrinsicCallback } from "lib/util/tx";
import { calculateMarketCost } from "lib/util/market";
import { NUM_BLOCKS_IN_DAY, ZTG } from "lib/constants";
import { Input } from "components/ui/inputs";
import OutcomesField from "components/create/OutcomesField";
import MarketSlugField from "components/create/MarketSlugField";
import TagChoices from "components/create/TagChoices";
import EndField from "components/create/EndField";
import InfoBoxes from "components/ui/InfoBoxes";
import LabeledToggle from "components/ui/LabeledToggle";
import Toggle from "components/ui/Toggle";
import PoolSettings, {
  PoolAssetRowData,
  poolRowDataFromOutcomes,
} from "components/liquidity/PoolSettings";
import TransactionButton from "components/ui/TransactionButton";
import MarketFormCard from "components/create/MarketFormCard";
import { useModalStore } from "lib/stores/ModalStore";
import MarketCostModal from "components/markets/MarketCostModal";
import { checkMarketExists } from "lib/gql/markets";
import dynamic from "next/dynamic";
import {
  getBlocksDeltaForDuration,
  MarketDeadlinesInput,
  MarketDeadlinesValue,
} from "components/create/MarketDeadlinesInput";
import { dateBlock } from "@zeitgeistpm/utility/dist/time";
import { useChainTimeNow } from "lib/hooks/queries/useChainTime";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useWallet } from "lib/state/wallet";
import { useZtgBalance } from "lib/hooks/queries/useZtgBalance";

const QuillEditor = dynamic(() => import("../components/ui/QuillEditor"), {
  ssr: false,
});

export interface CreateMarketFormData {
  slug: string;
  question: string;
  end: { type: EndType; value?: string };
  tags: string[];
  outcomes: {
    type: OutcomeType;
    value?: Outcomes;
  };
  oracle: string;
  description: string;
  advised: boolean;
  deadlines: MarketDeadlinesValue & { isValid: boolean };
}

const initialFields = {
  slug: {
    value: "",
    rules: "required",
  },
  question: {
    value: "",
    rules: "required",
  },
  oracle: {
    value: "",
    rules: "required|address_input",
  },
  description: {
    value: "",
  },
  end: {
    value: "",
    rules: "timestamp_gt_now",
  },
  outcomes: {
    fields: [],
  },
  deadlines: {
    grace: {
      value: 0,
    },
    oracle: {
      value: 28800,
    },
    dispute: {
      value: 28800,
    },
  },
};

const CreatePage: NextPage = observer(() => {
  const store = useStore();
  const { data: now } = useChainTimeNow();
  const notificationStore = useNotifications();
  const modalStore = useModalStore();
  const [sdk] = useSdkv2();
  const wallet = useWallet();
  const [formData, setFormData] = useState<CreateMarketFormData>({
    slug: "",
    question: "",
    end: { type: "timestamp", value: `${Moment().add(1, "day").valueOf()}` },
    tags: [],
    outcomes: { type: "multiple" },
    oracle: "",
    description: "",
    advised: false,
    deadlines: {
      grace: {
        label: "None",
        value: 0,
      },
      oracle: {
        label: "4 Days",
        value: 28800,
      },
      dispute: {
        label: "4 Days",
        value: 28800,
      },
      isValid: true,
    },
  });

  const [form] = useState(() => {
    return new MobxReactForm(
      { fields: initialFields },
      {
        plugins: defaultPlugins,
        options: defaultOptions,
      },
    );
  });

  const [deployPool, setDeployPool] = useState(false);
  const [poolRows, setPoolRows] = useState<PoolAssetRowData[] | null>(null);
  const [swapFee, setSwapFee] = useState<string>();
  const [txFee, setTxFee] = useState<string>();

  const { data: activeBalance } = useZtgBalance(wallet.activeAccount?.address);

  const router = useRouter();

  const questionInputRef = useRef();
  const oracleInputRef = useRef();

  const ipfsClient = store.sdk.models.ipfsClient;

  const [marketCost, setMarketCost] = useState<number>();
  const [newMarketId, setNewMarketId] = useState<number>();

  const [marketImageFile, setMarketImageFile] = useState<File | undefined>();
  const [base64MarketImage, setBase64MarketImage] = useState<
    string | undefined
  >(null);

  const [marketImageCid, setMarketImageCid] = useState<string>();

  useEffect(() => {
    if (marketImageFile == null) {
      setBase64MarketImage(undefined);
      return;
    }
    const sub1 = from(toBase64(marketImageFile)).subscribe((encoded) => {
      setBase64MarketImage(encoded);
    });
    const sub2 = from(ipfsClient.addFile(marketImageFile, true)).subscribe(
      (cid) => {
        setMarketImageCid(cid.toString());
      },
    );
    return () => {
      sub1.unsubscribe();
      sub2.unsubscribe();
    };
  }, [marketImageFile]);

  useEffect(() => {
    if (store?.graphQLClient == null || newMarketId == null) return;
    const timer = setInterval(async () => {
      const marketIndexed = await checkMarketExists(
        store.graphQLClient,
        newMarketId,
      );

      if (marketIndexed === true) {
        clearInterval(timer);
        notificationStore.pushNotification(`Market Indexed, redirecting`, {
          type: "Success",
        });
        router.push(`/markets/${newMarketId}`, undefined, {
          shallow: true,
          scroll: true,
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [store?.graphQLClient, newMarketId]);

  useEffect(() => {
    if (
      !form.isValid ||
      !formData.deadlines.isValid ||
      wallet.activeAccount == null
    ) {
      return;
    }
    const sub = from(getTransactionFee()).subscribe(setTxFee);
    return () => sub.unsubscribe();
  }, [
    form.isValid,
    formData.deadlines.isValid,
    formData,
    poolRows,
    deployPool,
    wallet.activeAccount,
    marketImageCid,
  ]);

  useEffect(() => {
    if (!formData.outcomes.value) {
      return;
    }

    const entries = isRangeOutcomeEntry(formData.outcomes.value)
      ? mapRangeToEntires(formData.outcomes.value)
      : formData.outcomes.value;
    formData.outcomes.value &&
      setPoolRows(poolRowDataFromOutcomes(entries, store.config.tokenSymbol));
  }, [deployPool, formData.outcomes.type]);

  useEffect(() => {
    if (wallet.activeAccount == null || formData.oracle !== "") {
      return;
    }
    changeOracle(wallet.activeAccount.address);
  }, [wallet.activeAccount]);

  useEffect(() => {
    if (!store.config) {
      return;
    }
    const bondCost = store.config.markets.oracleBond;
    const marketCost =
      calculateMarketCost(
        {
          advisedCost: store.config.markets.advisoryBond + bondCost,
          permissionlessCost: store.config.markets.validityBond + bondCost,
        },
        formData.advised,
        deployPool === true ? poolRows?.map((row) => Number(row.amount)) : null,
      ) + Number(txFee || 0);
    setMarketCost(marketCost);
  }, [store.config, formData, deployPool, poolRows]);

  useEffect(() => {
    if (formData?.end?.type === "block") {
      changeEnd(`${store.blockNumber.toNumber() + NUM_BLOCKS_IN_DAY}`);
      form.$("end").set("rules", `gt_current_blocknum|required`);
    } else {
      const date = Moment();
      date.set({ hour: 23, minute: 59 });
      changeEnd(`${date.add(1, "day").valueOf()}`);
      form.$("end").set("rules", "timestamp_gt_now");
    }
  }, [formData?.end?.type]);

  useEffect(() => {
    if (!form.isValid && deployPool) {
      setDeployPool(false);
    }
  }, [form.isValid]);

  const changeEndType = (type: EndType) => {
    setFormData((data) => {
      return {
        ...data,
        end: {
          type,
        },
      };
    });
  };

  const changeEnd = (value: string) => {
    setFormData((data) => {
      return { ...data, end: { ...data.end, value } };
    });
  };

  const changeSlug = (marketId: string) => {
    setFormData((data) => {
      return { ...data, slug: marketId };
    });
  };

  const changeTags = (tags: string[]) => {
    setFormData((data) => {
      return { ...data, tags };
    });
  };

  const changeOutcome = (type: OutcomeType, value: Outcomes) => {
    const newOutcomes = { type, value };
    setFormData((data) => {
      return { ...data, outcomes: newOutcomes };
    });
    if (deployPool) {
      const entries = isRangeOutcomeEntry(formData.outcomes.value)
        ? mapRangeToEntires(formData.outcomes.value)
        : formData.outcomes.value;
      setPoolRows(poolRowDataFromOutcomes(entries, store.config.tokenSymbol));
    }
  };

  const changeQuestion = (question: string) => {
    setFormData((data) => {
      return { ...data, question };
    });
  };

  const changeOracle = (oracle: string) => {
    setFormData((data) => ({ ...data, oracle }));
  };

  const changeDescription = (description: string) => {
    setFormData((data) => ({ ...data, description }));
  };

  const changeAdvised = (advised: boolean) => {
    if (advised && deployPool) {
      setDeployPool(false);
    }
    setFormData((data) => ({ ...data, advised }));
  };

  const onChangeDeadlines = (deadlines: MarketDeadlinesValue) => {
    setFormData((data) => ({ ...data, deadlines }));
  };

  const getMarketPeriod = (): MarketPeriod => {
    return formData.end.type === "block"
      ? { block: [store.blockNumber.toNumber(), Number(formData.end.value)] }
      : { timestamp: [store.blockTimestamp, Number(formData.end.value)] };
  };

  const getMarketEndBlock = () => {
    return formData.end.type === "block"
      ? Number(formData.end.value)
      : dateBlock(now, new Date(Number(formData.end.value)));
  };

  const mapRangeToEntires = (
    range: RangeOutcomeEntry,
  ): MultipleOutcomeEntry[] => {
    return [
      {
        name: "Long",
        ticker: `${range.ticker}-L`,
        color: "#24FF00",
      },
      {
        name: "Short",
        ticker: `${range.ticker}-S`,
        color: "#FF0000",
      },
    ];
  };

  const getMarketMetadata = () => {
    const entries = isRangeOutcomeEntry(formData.outcomes.value)
      ? mapRangeToEntires(formData.outcomes.value)
      : formData.outcomes.value;

    const metadata: DecodedMarketMetadata = {
      slug: formData.slug,
      question: formData.question,
      description: formData.description,
      tags: formData.tags,
      img: marketImageCid,
      categories: entries,
      scalarType: isRangeOutcomeEntry(formData.outcomes.value)
        ? formData.outcomes.value.type
        : undefined,
    };
    return metadata;
  };

  const getMarketDeadlines = () => {
    const gracePeriod = (
      formData.deadlines.grace.label === "Custom"
        ? dateBlock(now, formData.deadlines.grace.value) - getMarketEndBlock()
        : formData.deadlines.grace.value
    ).toString();
    const oracleDuration = (
      formData.deadlines.oracle.label === "Custom"
        ? getBlocksDeltaForDuration(now, formData.deadlines.oracle.value)
        : formData.deadlines.oracle.value
    ).toString();
    const disputeDuration = (
      formData.deadlines.dispute.label === "Custom"
        ? getBlocksDeltaForDuration(now, formData.deadlines.dispute.value)
        : formData.deadlines.dispute.value
    ).toString();
    return {
      gracePeriod,
      oracleDuration,
      disputeDuration,
    };
  };

  const getCreateMarketParameters = async (
    callbackOrPaymentInfo:
      | ((result: ISubmittableResult, _unsub: () => void) => void)
      | boolean,
  ): Promise<CreateMarketParams> => {
    const signer = wallet.getActiveSigner();
    const oracle = formData.oracle;
    const period = getMarketPeriod();
    const creationType = formData.advised ? "Advised" : "Permissionless";

    const scoringRule = "CPMM";
    const metadata = getMarketMetadata();

    const outcomes = formData.outcomes.value;
    const marketType = getMarketType(outcomes);

    const deadlines = getMarketDeadlines();

    return {
      marketType,
      signer,
      baseAsset: "Ztg",
      oracle,
      period,
      deadlines,
      creationType,
      disputeMechanism: "Authorized",
      scoringRule,
      metadata,
      callbackOrPaymentInfo,
    };
  };

  const getMarketType = (outcomes: Outcomes): MarketTypeOf => {
    return isMultipleOutcomeEntries(outcomes)
      ? {
          categorical: outcomes.length,
        }
      : {
          scalar: [
            new Decimal(outcomes.minimum)
              .mul(ZTG)
              .toDecimalPlaces(0)
              .toFixed(0),
            new Decimal(outcomes.maximum)
              .mul(ZTG)
              .toDecimalPlaces(0)
              .toFixed(0),
          ],
        };
  };

  const getCreateCpmmMarketAndAddPoolParameters = async (
    callbackOrPaymentInfo:
      | ((result: ISubmittableResult, _unsub: () => void) => void)
      | boolean,
  ): Promise<CreateCpmmMarketAndDeployAssetsParams> => {
    const signer = wallet.getActiveSigner();
    const oracle = formData.oracle;
    const period = getMarketPeriod();
    const metadata = getMarketMetadata();

    const weights = poolRows.slice(0, -1).map((row) => {
      return new Decimal(row.weight).mul(ZTG).toFixed(0, Decimal.ROUND_DOWN);
    });

    const baseAssetAmount = (
      Number([...poolRows].pop().amount) * ZTG
    ).toString();

    const marketType = getMarketType(formData.outcomes.value);

    const deadlines = getMarketDeadlines();

    return {
      signer,
      oracle,
      period,
      deadlines,
      marketType,
      swapFee,
      amount: baseAssetAmount,
      weights,
      disputeMechanism: "Authorized",
      baseAsset: "Ztg",
      metadata,
      callbackOrPaymentInfo,
    };
  };

  const createCategoricalCpmmMarketAndDeployPoolTransaction =
    async (): Promise<number> => {
      return new Promise(async (resolve, reject) => {
        const params = await getCreateCpmmMarketAndAddPoolParameters(
          extrinsicCallback({
            notifications: notificationStore,
            successMethod: "PoolCreate",
            successCallback: (data) => {
              const marketId: number = findMarketId(data);
              if (marketImageFile != null) {
                ipfsClient.addFile(marketImageFile);
              }
              notificationStore.pushNotification(
                `Market successfully created with id: ${marketId}`,
                {
                  type: "Success",
                },
              );
              resolve(marketId);
            },
            failCallback: ({ index, error }) => {
              notificationStore.pushNotification(
                store.getTransactionError(index, error),
                { type: "Error" },
              );
              reject();
            },
          }),
        );

        await store.sdk.models.createCpmmMarketAndDeployAssets(params);
      });
    };

  const findMarketId = (data): number => {
    const marketCreatedEvent = data.events.find(
      (event) => event.event.method === "MarketCreated",
    );

    return marketCreatedEvent.event.data[0].toNumber();
  };

  const createMarket = async () => {
    if (!form.isValid) {
      return;
    }

    try {
      const marketId = await new Promise<number>(async (resolve, reject) => {
        try {
          if (!deployPool) {
            const params = await getCreateMarketParameters(
              extrinsicCallback({
                notifications: notificationStore,
                successMethod: "MarketCreated",
                finalizedCallback: (data: JSONObject) => {
                  if (marketImageFile != null) {
                    ipfsClient.addFile(marketImageFile);
                  }
                  const marketId = data[0];
                  notificationStore.pushNotification(
                    `Transaction successful! Market id ${marketId}`,
                    { type: "Success" },
                  );
                  resolve(Number(marketId));
                },
                failCallback: ({ index, error }) => {
                  notificationStore.pushNotification(
                    store.getTransactionError(index, error),
                    { type: "Error" },
                  );
                  reject();
                },
              }),
            );
            return parseInt(await store.sdk.models.createMarket(params));
          } else {
            const id =
              await createCategoricalCpmmMarketAndDeployPoolTransaction();
            return resolve(id);
          }
        } catch (error) {
          reject(error);
        }
      });

      await sdk.asRpc().model.markets.get(marketId);
      setNewMarketId(marketId);
      notificationStore.pushNotification(`Indexing market`, {
        type: "Info",
        autoRemove: true,
      });
    } catch (error) {
      notificationStore.pushNotification(`Creating market failed: ${error}`, {
        type: "Error",
        autoRemove: true,
      });
    }
  };

  const getTransactionFee = async (): Promise<string> => {
    if (!deployPool) {
      const params = await getCreateMarketParameters(true);
      return new Decimal(await store.sdk.models.createMarket(params))
        .div(ZTG)
        .toFixed(4);
    } else if (poolRows) {
      const params = await getCreateCpmmMarketAndAddPoolParameters(true);
      const fee = await store.sdk.models.createCpmmMarketAndDeployAssets(
        params,
      );
      return new Decimal(typeof fee == "string" ? fee : "0")
        .div(ZTG)
        .toFixed(4);
    }
  };

  const showCostModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const liquidity =
      deployPool === true && poolRows
        ? poolRows
            .map((row) => new Decimal(row.value))
            .reduce((prev, curr) => prev.add(curr), new Decimal(0))
        : new Decimal(0);

    modalStore.openModal(
      <MarketCostModal
        liquidity={liquidity.toFixed(0)}
        permissionless={!formData.advised}
        networkFee={txFee}
      />,
      <div className="ml-[15px] mt-[15px]">Cost Breakdown</div>,
      {
        styles: { width: "70%", maxWidth: "622px" },
      },
    );
  };

  const poolPricesEqualOne = poolRows
    ?.slice(0, -1)
    .reduce((acc, pool) => acc.plus(pool.price.price), new Decimal(0))
    .eq(1);

  const poolPriceNotZero = !poolRows?.some((pool) => pool.price.price.eq(0));

  const poolValid = poolPricesEqualOne === true && poolPriceNotZero === true;

  return (
    <form data-test="createMarketForm">
      <InfoBoxes />
      <h2 className="mb-4" data-test="createMarketHeader">
        Create Market
      </h2>
      <MarketFormCard header="1. Market name*">
        <MarketSlugField
          slug={formData.slug}
          base64Image={base64MarketImage}
          onSlugChange={changeSlug}
          onImageChange={setMarketImageFile}
          textMaxLength={30}
          form={form}
        />
      </MarketFormCard>
      <MarketFormCard header="2. Market name / Question *">
        <Input
          ref={questionInputRef}
          type="text"
          name="question"
          value={formData.question}
          form={form}
          maxLength={164}
          placeholder="The title of the Prediction Market. This should clearly describe the question to be asked."
          className="mb-ztg-20"
          onChange={(e) => changeQuestion(e.target.value)}
          autoComplete="off"
          data-test="marketQuestionInput"
        />
        <TagChoices onTagsChange={changeTags} />
      </MarketFormCard>
      <MarketFormCard header="3. Market ends *">
        <EndField
          endType={formData.end.type}
          value={formData.end.value}
          onEndTypeChange={changeEndType}
          onEndChange={changeEnd}
          form={form}
          timestampFieldName="end"
          blockNumberFieldName="end"
        />
      </MarketFormCard>
      <MarketFormCard header="4. Outcomes *">
        <OutcomesField
          type={formData.outcomes.type}
          value={formData.outcomes.value}
          onChange={changeOutcome}
          namePrefix={`${formData.outcomes.type}`}
          form={form}
        />
      </MarketFormCard>
      <MarketFormCard header="5. Oracle *">
        <Input
          form={form}
          type="text"
          placeholder="FZueGGBbnhZitLs939AF4Fvy5UQqiNmijoo4PSqtcB4zoBm"
          onChange={(e) => changeOracle(e.target.value)}
          value={formData.oracle}
          ref={oracleInputRef}
          className="mb-ztg-20"
          name="oracle"
          data-test="oracleInput"
        />
        <div className="mb-ztg-20">
          <MarketDeadlinesInput
            value={formData.deadlines}
            marketEnd={formData.end}
            onChange={(deadlines) => onChangeDeadlines(deadlines)}
          />
        </div>
        <div className="flex h-ztg-22 items-center text-sky-600 ">
          <div className="w-ztg-20 h-ztg-20">
            <AlertTriangle size={20} />
          </div>
          <div className="text-ztg-12-120 ml-ztg-10">
            This is the account that will be responsible for submitting the
            outcome when the market ends. If the Oracle fails to submit, you
            will lose some of your deposit.
          </div>
        </div>
      </MarketFormCard>
      <MarketFormCard header="6. Market Description">
        <div className="h-[270px]">
          <QuillEditor
            onChange={changeDescription}
            placeholder="Additional information you want to provide about the market, such as resolution source, special cases, or other details."
            className="h-[200px]"
          />
        </div>
        <div className="flex items-center">
          <LabeledToggle
            leftLabel="Permissionless"
            rightLabel="Advised"
            side={!formData.advised ? "left" : "right"}
            onChange={(_) => {
              changeAdvised(!formData.advised);
            }}
          />
          <div className="ml-ztg-15  text-ztg-10-150 text-sky-600">
            An advised market means a smaller deposit, but requires approval
            from the advisory committee before becoming active.
          </div>
        </div>
      </MarketFormCard>
      <div className="flex flex-col mb-ztg-107">
        {!formData.advised && (
          <>
            <div className="flex items-center h-ztg-40 w-full mb-ztg-23 ">
              <Toggle
                active={deployPool}
                onChange={(active) => setDeployPool(active)}
                disabled={!form?.isValid}
                className="mr-ztg-20 mt-ztg-35"
              />
              <label
                htmlFor="deployPool"
                className="text-ztg-20-150 font-bold "
              >
                Deploy Liquidity Pool
              </label>
            </div>
          </>
        )}
        {deployPool && poolRows != null && (
          <>
            {poolPriceNotZero === false && (
              <div className="text-ztg-12-120 ml-ztg-10">
                Pool prices must be greater than zero
              </div>
            )}
            {poolPricesEqualOne === false && (
              <div className="text-ztg-12-120 ml-ztg-10">
                The sum of pool prices must equal one. Unlock prices to
                recalculate
              </div>
            )}
            <PoolSettings
              data={poolRows}
              onChange={(v) => {
                setPoolRows(v);
              }}
              onFeeChange={(fee: Decimal) => {
                setSwapFee(fee.toString());
              }}
            />
          </>
        )}

        <div className="flex justify-center mb-ztg-10 mt-ztg-12 w-full h-ztg-40">
          <TransactionButton
            preventDefault
            className="w-ztg-266 ml-ztg-8 center flex-shrink-0"
            dataTest="createMarketSubmitButton"
            onClick={(e) => {
              form.onSubmit(e);
              createMarket();
            }}
            disabled={
              !form.isValid ||
              !formData.deadlines.isValid ||
              activeBalance?.div(ZTG).lessThan(marketCost) ||
              (poolRows?.length > 0 && poolValid === false)
            }
          >
            Create Market
          </TransactionButton>
          <div className="w-full flex items-center text-ztg-12-150 font-bold ml-[27px] text-sky-600">
            <div className="mr-ztg-15" data-test="totalCost">
              Total Cost:
              <span className="font-mono">
                {" "}
                {marketCost} {store.config?.tokenSymbol}
              </span>
            </div>
            <button
              className="text-ztg-blue underline font-bold"
              onClick={showCostModal}
            >
              View Cost Breakdown
            </button>
          </div>
        </div>
      </div>
    </form>
  );
});

export default CreatePage;
