import Skeleton from "@material-ui/lab/Skeleton";
import React, { useState, useEffect } from "react";

import { Axis, Grid, LineSeries, XYChart, Tooltip } from "@visx/xychart";
import { defaultStyles } from "@visx/tooltip";
import { curveStepAfter } from "@visx/curve";
import { ParentSize } from "@visx/responsive";
import { timeFormat } from "d3-time-format";

//TMP
import { gql, GraphQLClient } from "graphql-request";
const query = gql`
  query MyQuery2($outcomeAsset: String) {
    historicalAssets(where: { assetId_contains: $outcomeAsset }) {
      timestamp
      assetId
      newPrice
      blockNumber
    }
  }
`;

const dateFmt = timeFormat("%m/%d/%y");
const formatDate = (date: string) => dateFmt(new Date(date));

const accessors = {
  xAccessor: (d) => d.x,
  yAccessor: (d) => d.y,
};

const TooltipContent = ({ tooltipData, categories }) => {
  console.log(tooltipData);
  const { nearestDatum, datumByKey } = tooltipData;

  return (
    <div className="font-lato text-black">
      <div className="font-bold text-ztg-14-150">
        <span>{formatDate(nearestDatum.datum.x)}</span>
        <span className="text-sky-600 ml-ztg-34">
          {new Intl.DateTimeFormat("default", {
            hour: "numeric",
            minute: "numeric",
          }).format(new Date(nearestDatum.datum.x))}
        </span>
      </div>
      <div className="mt-ztg-13">
        {Object.keys(datumByKey).map((key, idx) => {
          const value = datumByKey[key].datum.y;
          const { ticker, color } = categories[idx];
          return (
            <div className="flex">
              <span style={{ color }}>{ticker}</span>
              <span className="ml-auto text-xs">
                {value.toFixed(3)} ZTG ({Math.floor(value.toFixed(2) * 100)}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MarketChart = ({ market }) => {
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState(market.categories);

  console.log(market);

  const handleClick = (event) => {
    const { name } = event.target;
    console.log(name);
  };

  useEffect(() => {
    const getData = async () => {
      const url = process.env.NEXT_PUBLIC_SSR_INDEXER_URL;
      const client = new GraphQLClient(url);

      const { historicalAssets } = await client.request(query, {
        outcomeAsset: `[${market.marketId}`,
      });

      let lastPrices = {};
      market.outcomeAssets.forEach((asset) => {
        lastPrices[asset] = 0;
      });

      const d = historicalAssets
        .map((entry) => {
          const { timestamp, assetId, newPrice } = entry;

          // console.log("LAST_PRICES", lastPrices);
          lastPrices[assetId] = newPrice;

          return Object.assign(
            {
              timestamp: new Date(timestamp).getTime(),
            },
            lastPrices,
          );
        })
        .filter((entry) => {
          const e = Object.keys(entry).map((key) => {
            return entry[key];
          });

          return e.indexOf(0) === -1;
        });

      d.push(
        Object.assign(
          {
            timestamp: new Date().getTime(),
          },
          lastPrices,
        ),
      );

      const result = d.reduce((acc, e) => {
        for (let key in e) {
          if (key !== "timestamp") {
            if (!acc[key]) {
              acc[key] = [];
            }
            acc[key].push({ x: e.timestamp, y: e[key] });
          }
        }

        return acc;
      }, {});

      console.log("RESULT", result);

      setData(result);
    };

    getData();
  }, []);

  if (!data) {
    return (
      <Skeleton
        className="rounded-ztg-5"
        animation="wave"
        height={350}
        variant="rect"
      />
    );
  }

  return (
    <div style={{ width: "100%", height: 400 }}>
      <ParentSize>
        {(parent) => (
          <XYChart
            height={parent.height}
            width={parent.width}
            xScale={{ type: "time", clamp: true }}
            yScale={{ domain: [0, 1], type: "linear" }}
          >
            <Axis
              orientation="bottom"
              numTicks={4}
              label="Date"
              tickFormat={formatDate}
            />
            <Axis orientation="left" numTicks={8} label="Price ($ZTG)" />
            <Grid columns={false} numTicks={8} />
            <Tooltip
              snapTooltipToDatumX
              snapTooltipToDatumY
              showVerticalCrosshair
              showSeriesGlyphs
              detectBounds
              glyphStyle={{
                fill: "#000000",
                strokeWidth: 3,
              }}
              style={{
                ...defaultStyles,
                paddingLeft: "9px",
                paddingRight: "9px",
                paddingTop: "12px",
                paddingBottom: "12px",
                borderRadius: "10px",
                boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
              }}
              renderTooltip={({ tooltipData }) => (
                <TooltipContent
                  tooltipData={tooltipData}
                  categories={categories}
                />
              )}
            />
            {market.outcomeAssets.map((asset, i) => {
              return (
                <LineSeries
                  dataKey={`Line ${asset}`}
                  data={data[asset]}
                  curve={curveStepAfter}
                  stroke={categories[i].color}
                  {...accessors}
                />
              );
            })}
          </XYChart>
        )}
      </ParentSize>
      {/* <div className="mb-10 flex flex-row">
        {market.outcomeAssets.map((asset) => (
          <button
            className="bg-blue-300 mx-4 p-2"
            name={asset}
            onClick={handleClick}
          >
            {asset}
          </button>
        ))}
      </div> */}
    </div>
  );
};

export default MarketChart;
