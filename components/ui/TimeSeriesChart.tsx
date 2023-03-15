import { Decimal } from "decimal.js";
import Skeleton from "@material-ui/lab/Skeleton";
import { observer } from "mobx-react";
import React, { useCallback, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AxisDomain } from "recharts/types/util/types";

interface TimeSeriesChartProps {
  data: ChartData[];
  series: ChartSeries[];
  yDomain?: AxisDomain;
  yUnits: string;
}

export interface ChartSeries {
  accessor: string;
  label: string;
  color?: string;
}

export interface ChartData {
  t: number;
  [key: string]: number;
}

const ChartToolTip = observer((props) => {
  return (
    <>
      {props.label !== undefined &&
      props.label !== -Infinity &&
      props.label !== Infinity ? (
        <div
          className="px-ztg-9 py-ztg-12 bg-white dark:bg-black  rounded-ztg-10"
          style={{ boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)" }}
        >
          <div className="text-ztg-12-150">
            <span>
              {new Intl.DateTimeFormat("default", {
                dateStyle: "short",
              }).format(new Date(props.label))}
            </span>
            <span className="ml-ztg-34">
              {new Intl.DateTimeFormat("default", {
                hour: "numeric",
                minute: "numeric",
              }).format(new Date(props.label))}
            </span>
            <div className="mt-ztg-13">
              {props.series?.map((asset, index) => (
                <div key={index} className="flex flex-col mt-1">
                  <span className="font-semibold capitalize">
                    {asset.label}
                  </span>
                  <span className="">
                    {new Decimal(props.payload[index]?.value ?? 0).toFixed(3) +
                      ` ${props.yUnits}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}
    </>
  );
});

const TimeSeriesChart = observer(
  ({ data, series, yDomain, yUnits }: TimeSeriesChartProps) => {
    const [refAreaLeft, setRefAreaLeft] = useState("");
    const [refAreaRight, setRefAreaRight] = useState("");
    const [leftX, setLeftX] = useState("dataMin");
    const [rightX, setRightX] = useState("dataMax");
    const [mouseInside, setMouseInside] = useState(false);

    const lessThanTwoDays =
      data?.length > 0
        ? Math.abs(data[data.length - 1].t - data[0].t) < 172800
        : false;

    const zoom = () => {
      let left = refAreaLeft;
      let right = refAreaRight;

      if (left === right || right === "") {
        setRefAreaLeft("");
        setRefAreaRight("");
        return;
      }

      if (left > right) {
        [left, right] = [right, left];
      }

      setLeftX(left);
      setRightX(right);
      setRefAreaLeft("");
      setRefAreaRight("");
    };

    const handleMouseMove = useCallback(
      (e) => {
        if (refAreaLeft) {
          setRefAreaRight(e.activeLabel);
        }
      },

      [refAreaLeft],
    );

    const handleMouseEnter = () => {
      setMouseInside(true);
    };

    const handleMouseLeave = () => {
      setMouseInside(false);
    };

    return (
      <div
        style={{ width: "100%", height: 350 }}
        onMouseMove={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDoubleClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setLeftX("dataMin");
          setRightX("dataMax");
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {data?.length > 0 ? (
          <ResponsiveContainer>
            <LineChart
              width={500}
              height={300}
              data={data}
              onMouseDown={(e) => {
                if (e) setRefAreaLeft(e.activeLabel);
              }}
              onMouseMove={handleMouseMove}
              onMouseUp={zoom}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                strokeWidth={1}
                stroke="#E8EAED"
                vertical={false}
              />
              <XAxis
                dataKey="t"
                domain={[leftX, rightX]}
                tickCount={5}
                tick={{
                  fontSize: "10px",
                  stroke: "black",
                  strokeWidth: 1,
                  fontWeight: 100,
                }}
                type="number"
                stroke="#E8EAED"
                tickLine={false}
                strokeWidth={2}
                tickFormatter={(unixTime) => {
                  if (unixTime !== -Infinity && unixTime !== Infinity) {
                    if (lessThanTwoDays === true) {
                      return new Intl.DateTimeFormat("default", {
                        weekday: "short",
                        hour: "numeric",
                        minute: "numeric",
                      }).format(new Date(unixTime));
                    } else {
                      return new Intl.DateTimeFormat().format(
                        new Date(unixTime),
                      );
                    }
                  }
                }}
              />
              <YAxis
                tick={{
                  fontSize: "10px",
                  stroke: "black",
                  strokeWidth: 1,
                  fontWeight: 100,
                }}
                tickLine={false}
                domain={
                  yDomain ?? [
                    (dataMin: number) => {
                      return dataMin < 0.3 ? 0 : Math.floor(dataMin * 10) / 10;
                    },
                    (dataMax) => {
                      return dataMax === 0 ? 1 : Math.ceil(dataMax * 10) / 10;
                    },
                  ]
                }
                stroke="#E8EAED"
                strokeWidth={2}
                tickFormatter={(val) => `${+val.toFixed(2)} ${yUnits}`}
              />

              <Tooltip
                animationEasing={"linear"}
                animationDuration={0}
                content={<ChartToolTip series={series} yUnits={yUnits} />}
              />
              {series.map((s, index) => (
                <Line
                  key={index}
                  strokeWidth={mouseInside ? 3 : 2}
                  type="linear"
                  dataKey={s.accessor}
                  dot={false}
                  stroke={s.color ? s.color : "#0001FE"}
                />
              ))}

              <ReferenceArea x1={refAreaLeft} x2={refAreaRight} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Skeleton
            className="ml-ztg-20 rounded-ztg-5"
            animation="wave"
            height={350}
            variant="rect"
          />
        )}
      </div>
    );
  },
);

export default TimeSeriesChart;
