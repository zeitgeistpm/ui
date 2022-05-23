import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";

const TableChart = ({ data }: { data: { v: number; t: number }[] }) => {
  const getColour = (startValue: number, endValue: number) => {
    if (startValue > endValue) {
      return "#FF0054";
    } else if (startValue < endValue) {
      return "#70C703";
    } else {
      return "#0001FE";
    }
  };

  return (
    <>
      {data?.length > 0 ? (
        <ResponsiveContainer width={120} height="65%">
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey="v"
              dot={false}
              strokeWidth={2}
              stroke={getColour(data[0].v, data[data.length - 1].v)}
            />
            <YAxis hide={true} domain={["dataMin", "dataMax"]} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <></>
      )}
    </>
  );
};
export default TableChart;
