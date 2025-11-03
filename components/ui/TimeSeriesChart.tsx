import Skeleton from "components/ui/Skeleton";
import { Decimal } from "decimal.js";
import { useEffect, useState } from "react";
import {
  CartesianGrid,
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
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
        <div className={`rounded-lg bg-gradient-to-br from-ztg-primary-50 to-blue-50 shadow-xl backdrop-blur-sm ${isMobile ? "px-2 py-2" : "px-3 py-3"}`}>
          <div className={isMobile ? "text-[10px]" : "text-xs"}>
            <div className={`mb-1.5 flex items-center gap-1.5 border-b-2 border-ztg-primary-200/50 ${isMobile ? "pb-1.5" : "mb-2 gap-2 pb-2"}`}>
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
            <div className={isMobile ? "space-y-1.5" : "space-y-2"}>
              {items?.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between ${isMobile ? "gap-2" : "gap-4"}`}
                >
                  <div className={`flex items-center ${isMobile ? "gap-1.5" : "gap-2"}`}>
                    <div
                      className={`rounded-full ${isMobile ? "h-1.5 w-1.5" : "h-2 w-2"}`}
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <div className={`font-semibold capitalize text-gray-700 ${isMobile ? "text-[10px]" : ""}`}>
                      {item.label}
                    </div>
                  </div>
                  <div className={`font-bold text-gray-900 ${isMobile ? "text-[10px]" : ""}`}>{`${item.value.toFixed(isMobile ? 2 : 3)} ${props.yUnits}`}</div>
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
      style={{ width: "100%", height: isMobile ? 220 : 300 }}
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
        <ResponsiveContainer width="100%">
          <LineChart 
            width={500} 
            height={isMobile ? 220 : 300} 
            data={data}
            margin={{ top: 5, right: 5, left: isMobile ? -25 : -20, bottom: isMobile ? -5 : 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              strokeWidth={1}
              stroke="#BAE6FD"
              vertical={false}
            />
            <XAxis
              dataKey="t"
              domain={[leftX, rightX]}
              tickCount={isMobile ? 4 : 5}
              tick={{
                fontSize: isMobile ? "9px" : "10px",
                stroke: "#6B7280",
                strokeWidth: 1,
                fontWeight: 100,
              }}
              tickMargin={isMobile ? 5 : 10}
              type="number"
              stroke="#BAE6FD"
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
                fontSize: isMobile ? "9px" : "10px",
                stroke: "#6B7280",
                strokeWidth: 1,
                fontWeight: 100,
              }}
              tickLine={false}
              width={isMobile ? 30 : 45}
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
              stroke="#BAE6FD"
              strokeWidth={2}
              tickFormatter={(val) => `${+val.toFixed(isMobile ? 1 : 2)}`}
            />

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
                strokeWidth={mouseInside ? (isMobile ? 2.5 : 3) : (isMobile ? 1.5 : 2)}
                type="linear"
                dataKey={s.accessor}
                dot={false}
                stroke={s.color ? s.color : "#0001FE"}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <Skeleton className="ml-4 sm:ml-ztg-20" height={isMobile ? 220 : 350} />
      )}
    </div>
  );
};

export default TimeSeriesChart;
