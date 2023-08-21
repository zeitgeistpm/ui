import ZeitgeistIcon from "components/icons/ZeitgeistIcon";
import { getColour } from "components/ui/TableChart";
import { random } from "lodash-es";
import Image from "next/image";
import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";

export const HeroBanner = () => {
  const mockChartData = [...Array(10).keys()].map(() => {
    const v = random(4, 10);
    return { v, t: 1 };
  });

  return (
    <div className="relative main-container mt-12 md:mt-28 mb-20 z-2">
      <div className="relative flex flex-col-reverse md:flex-row md:gap-8">
        <div className="md:w-[890px] lg:w-[690px]">
          <h1 className="text-5xl mb-8">Welcome to the Future of Betting</h1>
          <h2 className="text-xl mb-8">
            Zeitgeist is a new innovative platform for predicting future events
          </h2>
          <div className="flex gap-4 mb-8">
            <button className="rounded-md flex-1 md:flex-none bg-vermilion text-white px-6 py-3">
              Learn More
            </button>
            <button className="rounded-md flex-1 md:flex-none bg-transparent border-2 border-black text-black px-6 py-3">
              Get Started
            </button>
          </div>
          <div className="bg-blue-300 py-3 px-4 bg-opacity-70 w-full rounded-md flex gap-2">
            <div className="flex justify-start items-center gap-2 w-1/3">
              <div>
                <ZeitgeistIcon variant="blue" height={28} width={28} />
              </div>
              <div>
                <div className="font-bold text-md">Zeitgeist</div>
                <div className="text-sm">ZTG</div>
              </div>
            </div>
            <div className="flex center w-1/3">
              <ResponsiveContainer width={"100%"} height="65%">
                <LineChart data={mockChartData}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    dot={false}
                    strokeWidth={2}
                    stroke={getColour(
                      mockChartData[0].v,
                      mockChartData[mockChartData.length - 1].v,
                    )}
                  />
                  <YAxis hide={true} domain={["dataMin", "dataMax"]} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-end items-center gap-2 flex-1">
              <div>
                <div className="font-semibold text-md text-center">$0.55</div>
                <div className="text-sm text-center">+2.3%</div>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full h-64 md:h-auto relative rounded-lg overflow-hidden mb-8 md:mb-0">
          <Image
            alt="Futuristic City Image"
            fill={true}
            sizes="100vw"
            className="object-cover"
            src="https://cdn.discordapp.com/attachments/826371897084215376/1138829878188327043/image.png"
          />
        </div>
      </div>
    </div>
  );
};
