import Skeleton from "components/ui/Skeleton";
import { Decimal } from "decimal.js";
import { useState } from "react";
import {
  CartesianGrid,
  Label,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AxisDomain } from "recharts/types/util/types";

interface TimeSeriesChartProps {
  data?: ChartData[];
  series: ChartSeries[];
  yDomain?: AxisDomain;
  yUnits: string;
  isLoading: boolean;
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

const ChartToolTip = (props) => {
  const items = props.series
    ?.map((s, index) => ({
      color: s.color,
      label: s.label,
      value: new Decimal(props.payload[index]?.value ?? 0),
    }))
    .sort((a, b) => b.value.minus(a.value).toNumber());

  return (
    <>
      {props.label !== undefined &&
      props.label !== -Infinity &&
      props.label !== Infinity ? (
        <div className="rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 px-3 py-3 shadow-xl backdrop-blur-sm">
          <div className="text-xs">
            <div className="mb-2 flex items-center gap-2 border-b border-purple-200/50 pb-2">
              <span className="font-semibold text-gray-700">
                {new Intl.DateTimeFormat("default", {
                  dateStyle: "short",
                }).format(new Date(props.label))}
              </span>
              <span className="text-gray-500">
                {new Intl.DateTimeFormat("default", {
                  hour: "numeric",
                  minute: "numeric",
                }).format(new Date(props.label))}
              </span>
            </div>
            <div className="space-y-2">
              {items?.map((item, index) => (
                <div key={index} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <div className="font-semibold capitalize text-gray-700">
                      {item.label}
                    </div>
                  </div>
                  <div className="font-bold text-gray-900">{`${item.value.toFixed(3)} ${props.yUnits}`}</div>
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
};

const TimeSeriesChart = ({
  data,
  series,
  yDomain,
  yUnits,
  isLoading,
}: TimeSeriesChartProps) => {
  const [leftX, setLeftX] = useState("dataMin");
  const [rightX, setRightX] = useState("dataMax");
  const [mouseInside, setMouseInside] = useState(false);

  const roundingThreshold = 0.3;

  const lessThanTwoDays =
    data && data.length > 0
      ? Math.abs(data[data.length - 1].t - data[0].t) < 172800
      : false;

  const handleMouseEnter = () => {
    setMouseInside(true);
  };

  const handleMouseLeave = () => {
    setMouseInside(false);
  };

  return (
    <div
      className="relative"
      style={{ width: "100%", height: 300 }}
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
      {isLoading === false ? (
        <ResponsiveContainer width="99%">
          <LineChart width={500} height={300} data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              strokeWidth={1}
              stroke="#E9D5FF"
              vertical={false}
            />
            <XAxis
              dataKey="t"
              domain={[leftX, rightX]}
              tickCount={5}
              tick={{
                fontSize: "10px",
                stroke: "#6B7280",
                strokeWidth: 1,
                fontWeight: 100,
              }}
              tickMargin={10}
              type="number"
              stroke="#E9D5FF"
              tickLine={true}
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
                    return new Intl.DateTimeFormat().format(new Date(unixTime));
                  }
                } else {
                  return "";
                }
              }}
            />
            <YAxis
              tick={{
                fontSize: "10px",
                stroke: "#6B7280",
                strokeWidth: 1,
                fontWeight: 100,
              }}
              tickLine={false}
              domain={
                yDomain ?? [
                  (dataMin: number) => {
                    return dataMin < roundingThreshold
                      ? 0
                      : Math.floor(dataMin * 10) / 10;
                  },
                  (dataMax) => {
                    return dataMax > 1 - roundingThreshold
                      ? 1
                      : Math.ceil(dataMax * 10) / 10;
                  },
                ]
              }
              stroke="#E9D5FF"
              strokeWidth={2}
              tickFormatter={(val) => `${+val.toFixed(2)}`}
            >
              <Label
                fontSize={10}
                stroke="#6B7280"
                value={yUnits}
                offset={15}
                position="insideLeft"
                angle={-90}
              />
            </YAxis>

            <Tooltip
              animationEasing={"linear"}
              animationDuration={0}
              content={
                data && data.length > 0 ? (
                  <ChartToolTip series={series} yUnits={yUnits} />
                ) : undefined
              }
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
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <Skeleton className="ml-ztg-20" height={350} />
      )}
    </div>
  );
};

export default TimeSeriesChart;
