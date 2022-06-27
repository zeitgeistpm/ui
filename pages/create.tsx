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
import { MarketPeriod } from "@zeitgeistpm/sdk/dist/types";
import Moment from "moment";

import { defaultOptions, defaultPlugins } from "lib/form";
import { useStore } from "lib/stores/Store";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { useMarketsStore } from "lib/stores/MarketsStore";
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
import { Input, TextArea } from "components/ui/inputs";
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

interface CreateMarketFormData {
  slug: string;
  marketImage?: string;
  question: string;
  end: { type: EndType; value?: number | typeof NaN };
  tags: string[];
  outcomes: {
    type: OutcomeType;
    value?: Outcomes;
  };
  oracle: string;
  description: string;
  advised: boolean;
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
};

const CreatePage: NextPage = observer(() => {
  const store = useStore();
  const notificationStore = useNotificationStore();
  const markets = useMarketsStore();
  const [formData, setFormData] = useState<CreateMarketFormData>({
    slug: "",
    question: "",
    end: { type: "timestamp", value: Moment().add(1, "day").valueOf() },
    tags: [],
    outcomes: { type: "multiple" },
    oracle: "",
    description: "",
    advised: false,
  });

  const [form] = useState(() => {
    return new MobxReactForm(
      { fields: initialFields },
      {
        plugins: defaultPlugins,
        options: defaultOptions,
      }
    );
  });

  const [deployPool, setDeployPool] = useState(false);
  const [poolRows, setPoolRows] = useState<PoolAssetRowData[] | null>(null);
  const [txFee, setTxFee] = useState<string>();

  const router = useRouter();

  const questionInputRef = useRef();
  const oracleInputRef = useRef();
  const descriptionInputRef = useRef();

  const [marketCost, setMarketCost] = useState<number>();

  useEffect(() => {
    if (!form.isValid || poolRows == null) {
      return;
    }
    const sub = from(getTransactionFee()).subscribe(setTxFee);
    return () => sub.unsubscribe();
  }, [form.isValid, formData, poolRows, deployPool]);

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
        deployPool === true ? poolRows?.map((row) => Number(row.amount)) : null
      ) + Number(txFee || 0);
    setMarketCost(marketCost);
  }, [store.config, formData, deployPool, poolRows]);

  useEffect(() => {
    if (formData?.end?.type === "block") {
      changeEnd(store.blockNumber.toNumber() + NUM_BLOCKS_IN_DAY);
      form.$("end").set("rules", `gt_current_blocknum|required`);
    } else {
      changeEnd(Moment().add(1, "day").valueOf());
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

  const changeEnd = (value: number) => {
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

  const changeMarketImage = async (marketImage: File) => {
    const base64Image = await toBase64(marketImage);
    setFormData((data) => ({ ...data, marketImage: base64Image }));
  };

  const getMarketPeriod = (): MarketPeriod => {
    return formData.end.type === "block"
      ? { block: [store.blockNumber.toNumber(), formData.end.value] }
      : { timestamp: [store.blockTimestamp, formData.end.value] };
  };

  const mapRangeToEntires = (
    range: RangeOutcomeEntry
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

    const metadata = {
      slug: formData.slug,
      question: formData.question,
      description: formData.description,
      tags: formData.tags,
      img: formData.marketImage,
      categories: entries,
    };
    return metadata;
  };

  const getCreateMarketParameters = async (
    callbackOrPaymentInfo:
      | ((result: ISubmittableResult, _unsub: () => void) => void)
      | boolean
  ): Promise<CreateMarketParams> => {
    const signer = store.wallets.getActiveSigner();
    const oracle = formData.oracle;
    const period = getMarketPeriod();
    const creationType = formData.advised ? "Advised" : "Permissionless";

    const mdm = {
      Authorized: process.env.NEXT_PUBLIC_MDM_AUTHORIZED_DEFAULT_ADDRESS,
    };

    const scoringRule = "CPMM";
    const metadata = getMarketMetadata();

    const outcomes = formData.outcomes.value;
    const marketType = isMultipleOutcomeEntries(outcomes)
      ? {
          Categorical: outcomes.length,
        }
      : {
          Scalar: [outcomes.minimum, outcomes.maximum],
        };

    return {
      marketType,
      signer,
      oracle,
      period,
      creationType,
      mdm,
      scoringRule,
      metadata,
      callbackOrPaymentInfo,
    };
  };

  const getCreateCpmmMarketAndAddPoolParameters = async (
    callbackOrPaymentInfo:
      | ((result: ISubmittableResult, _unsub: () => void) => void)
      | boolean
  ): Promise<CreateCpmmMarketAndDeployAssetsParams> => {
    const signer = store.wallets.getActiveSigner();
    const oracle = formData.oracle;
    const period = getMarketPeriod();
    const mdm = {
      Authorized: process.env.NEXT_PUBLIC_MDM_AUTHORIZED_DEFAULT_ADDRESS,
    };
    const metadata = getMarketMetadata();

    const numOutcomes = metadata.categories.length;

    const baseWeight = (1 / numOutcomes) * 10 * ZTG;

    const weightsNums = poolRows.slice(0, -1).map((_) => {
      return baseWeight;
    });

    // total used for ztg weight
    const totalWeight = weightsNums.reduce<number>((acc, curr) => {
      return acc + curr;
    }, 0);

    const weights = [
      ...weightsNums.map((w) => Math.floor(w).toString()),
      totalWeight.toString(),
    ];

    const amounts = poolRows.slice(0, -1).map((r) => {
      return (Number(r.amount) * ZTG).toString();
    });

    const baseAssetAmount = (
      Number([...poolRows].pop().amount) * ZTG
    ).toString();

    const marketType = isMultipleOutcomeEntries(formData.outcomes.value)
      ? { Categorical: numOutcomes }
      : {
          Scalar: [
            formData.outcomes.value.minimum,
            formData.outcomes.value.maximum,
          ],
        };

    return {
      signer,
      oracle,
      period,
      marketType,
      mdm,
      amount: baseAssetAmount,
      weights,
      metadata,
      callbackOrPaymentInfo,
    };
  };

  const createCategoricalCpmmMarketAndDeployPoolTransaction =
    async (): Promise<number> => {
      return new Promise(async (resolve, reject) => {
        const params = await getCreateCpmmMarketAndAddPoolParameters(
          extrinsicCallback({
            notificationStore,
            successMethod: "PoolCreate",
            successCallback: (data) => {
              const marketId: number = data.events[2].event.data[0];
              notificationStore.pushNotification(
                `Market successfully created with id: ${marketId}`,
                {
                  type: "Success",
                }
              );
              resolve(marketId);
            },
            failCallback: ({ index, error }) => {
              notificationStore.pushNotification(
                store.getTransactionError(index, error),
                { type: "Error" }
              );
              reject();
            },
          })
        );

        await store.sdk.models.createCpmmMarketAndDeployAssets(params);
      });
    };

  const createMarket = async () => {
    if (!form.isValid) {
      return;
    }

    const marketId = await new Promise<number>(async (resolve, reject) => {
      if (!deployPool) {
        const params = await getCreateMarketParameters(
          extrinsicCallback({
            notificationStore,
            successMethod: "MarketCreated",
            finalizedCallback: (data: JSONObject) => {
              const marketId = data[0];
              notificationStore.pushNotification(
                `Transaction successful! Market id ${marketId}`,
                { type: "Success" }
              );
              resolve(Number(marketId));
            },
            failCallback: ({ index, error }) => {
              notificationStore.pushNotification(
                store.getTransactionError(index, error),
                { type: "Error" }
              );
              reject();
            },
          })
        );
        return parseInt(await store.sdk.models.createMarket(params));
      } else {
        return createCategoricalCpmmMarketAndDeployPoolTransaction();
      }
    });

    await markets.updateMarketIds();
    await markets.getMarket(marketId);
    router.push(`/markets/${marketId}`, undefined, {
      shallow: true,
      scroll: true,
    });
  };

  const getTransactionFee = async (): Promise<string> => {
    if (!deployPool) {
      const params = await getCreateMarketParameters(true);
      return new Decimal(await store.sdk.models.createMarket(params))
        .div(ZTG)
        .toFixed(4);
    } else {
      const params = await getCreateCpmmMarketAndAddPoolParameters(true);
      const fee = await store.sdk.models.createCpmmMarketAndDeployAssets(
        params
      );
      return new Decimal(typeof fee == "string" ? fee : "0")
        .div(ZTG)
        .toFixed(4);
    }
  };
  return (
    <form data-test="createMarketForm">
      <InfoBoxes />
      <h2 className="header mb-ztg-23" data-test="createMarketHeader">
        Create Market
      </h2>
      <MarketFormCard header="1. Market name">
        <MarketSlugField
          slug={formData.slug}
          base64Image={formData.marketImage}
          onSlugChange={changeSlug}
          onImageChange={changeMarketImage}
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
          value={isNaN(formData.end.value) ? "" : formData.end.value.toString()}
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
        <div className="flex h-ztg-22 items-center text-sky-600 font-lato">
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
        <TextArea
          dataTest="marketDescriptionInput"
          placeholder="Additional information you want to provide about the market, such as resolution source, special cases, or other details."
          value={formData.description}
          name="description"
          onChange={changeDescription}
          ref={descriptionInputRef}
          form={form}
        />
        <div className="flex items-center">
          <LabeledToggle
            leftLabel="Permissionless"
            rightLabel="Advised"
            side={!formData.advised ? "left" : "right"}
            onChange={(_) => {
              changeAdvised(!formData.advised);
            }}
          />
          <div className="ml-ztg-15 font-lato text-ztg-10-150 text-sky-600">
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
                className="text-ztg-20-150 font-bold font-kanit"
              >
                Deploy Liquidity Pool
              </label>
            </div>
            <p className="text-ztg-14-150 mb-ztg-15 text-sky-600 font-lato">
              Deploying a pool will require at least two further transactions
              after the market is created, one to buy a full set of tokens and
              another to deploy the pool. If different amounts are specified an
              additional transaction per token will be required.
            </p>
          </>
        )}
        {deployPool && poolRows != null && (
          <PoolSettings
            data={poolRows}
            onChange={(v) => {
              setPoolRows(v);
            }}
          />
        )}

        <div className="flex justify-center mb-ztg-10 mt-ztg-12 w-full h-ztg-40">
          <TransactionButton
            className="w-ztg-266 ml-ztg-8 center flex-shrink-0"
            dataTest="createMarketSubmitButton"
            onClick={(e) => {
              e.preventDefault();
              form.onSubmit(e);
              createMarket();
            }}
            disabled={
              !form.isValid || store.wallets.activeBalance.lessThan(marketCost)
            }
          >
            Create Market
          </TransactionButton>
          <div className="w-full flex items-center text-ztg-12-150 font-bold ml-ztg-8 text-sky-600">
            <div className="mr-ztg-15" data-test="totalCost">
              Total Cost:
              <span className="font-mono">
                {" "}
                {marketCost} {store.config?.tokenSymbol}
              </span>
            </div>
            {txFee && (
              <div className="mr-ztg-15">
                Transaction Fee: <span className="font-mono">{txFee}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
});

export default CreatePage;
