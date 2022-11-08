import { observer } from "mobx-react";
import { NextPage } from "next";
import { randomHexColor } from "lib/util";
import NotFoundPage from "./404";
import MarketCard from "components/markets/new/MarketCard";

const demoCategories = [
  { ticker: "Vivamus tortor ipsum", color: randomHexColor() },
  { ticker: "In blandit lorem sed", color: randomHexColor() },
  { ticker: "Nulla sit amet mi", color: randomHexColor() },
  { ticker: "Quisque consectetur massa", color: randomHexColor() },
  { ticker: "Suspendisse ac", color: randomHexColor() },
  { ticker: "Sed dictum ante arcu", color: randomHexColor() },
  { ticker: "Nulla sit amet mi", color: randomHexColor() },
  { ticker: "Vivamus tortor ipsum", color: randomHexColor() },
  { ticker: "Vivamus tortor ipsum", color: randomHexColor() },
  { ticker: "In blandit lorem sed", color: randomHexColor() },
  { ticker: "Nulla sit amet mi", color: randomHexColor() },
  { ticker: "Quisque consectetur massa", color: randomHexColor() },
  { ticker: "Suspendisse ac", color: randomHexColor() },
];

const demoMarketCardProps1 = {
  marketId: 1,
  img: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHsAAABACAMAAAANpPgjAAAANlBMVEXkLyb////kLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLybkLyYif3JYAAAAEXRSTlMAABAgMEBQYHCAj5+vv8/f7/4ucL8AAAQdSURBVFjD7ZhRt6MqDIV3gQ1EDbL//5+9D9pae9tTe8Yz8zCTF11L5CMhCSTAdyQVm9wBAONkVnj818smH2NjGZoWAQCs720s8WfZeZi1yT1bklqNP8XOY9dOHtmSWg3ns6PNepQnbEkjz2WHYTd9d6tkXlVkMd99dp7IzjtjewZ8lrQhyFSnu0HlNHbYoYebpe/YkhvvHIKn6V3v2XzCRpckB8rqFeN5++2SxuwPHsb9ADkA1C5J83ns2KcI8CU7bLuBYRt1TozFdVdfsIskKW+v/ey89pIdNjuXd45+Mju0G6+cHWOv2C0CSNfI8tuIr9BnsfeZPACY36J/hM3bgIbfzW4JiPozequnNcVcA/1H2X3IzJW13eCpv0upv84Oe9uOK5w3+PBzbD7kNbudnXE1QjiPPfBL9jWnqADT14fox+wsOb9io6zGTvRz2Wu+Lmnor9hIXZrteqs77ywZr2FkMU8bO+/rhalaf39p+pS9zalWE4A0S5Lta4a2hXo+855q91e2NlpmLnZVLnKrVSTJwoHcEqyjj+kQvfz/fu7u7u0xvY3xQD6PQ5cgqZVwKLwf65InMh+qS7g40JodDyqfv8TPw4FZLpebY2Bb8bE6MtXRn3Gnemj5cdhW/3EdefUuM7+KVYZjLlt23vFwGk6H8Z9Lnh5ryf9fAo4Z71PwE0/BU6cZcziRG8v01Dfxymmb8RQwh/YKga+i1Ydf05/mX02Pt9liMn7D/1jG9m7qt+y10TAcXgGzTe3QrMfYVxv4aEY+dQQym03eP5juI/Z+HTeZvznFt9knyD/2X8b2Pyf43fIr/fN/7L+GHTV5P5OdGEAmkoxAIAGEajUiMiIxREYAgSmwmlXeXVYjEhOSWUYgSaZEkgnrYznxAtNKQWK4RMbAdIlMcDGr57WwLFJE7JJ6MhlcNBkAyilHuevSmix1pSpJjWuVtHT51se1YHa4CAkuhllGeegqcOWuRDX68lPFqMZR4zP2vGc3lSjV3FVZ1ZhclUxw1fqCbZJRPmm4wNVVQDmqPGpWgysjWjG5zaJp9ikvbNOO3TWiqAGmEZQDrtGMcJFySO417Ni5S0Z1+eUCl5TWYt6qhqa4dhSWBg6XxyCnWvcdW8owOWDyK1tazLWwJY07tstllFQvF7hGNVDdvaKpddlN75vNJ7mckrhjT+oxqwHDpnclI9qVjSzt2JpMRrWudIGLroFyAFHdm+ZRLfvdfru1lX3dwut+mzxIlq/bttjcBgkL2ybN1GyzRpOKS9FklFfNAS5GyeQAqkagK8+SeryxJc1FTik9sMMsK2sjcbO5pIqbzQvvmgUaLwv70jQiMSAxMa0Ri8QQaDls8U2mJb4TwH18RybEUtMaxktgr5kigSTDGvok5bv45u9Mpz7s89p/U2K/e/R3nlkAAAAASUVORK5CYII=",
  question: "Who will win the 2022 Men's T20 Cricket World Cup?",
  status: "Proposed",
  categories: [...demoCategories],
  prediction: demoCategories[2].ticker,
  volume: 456032,
};

const demoMarketCardProps2 = {
  marketId: 2,
  img: null,
  question: "Who will win the 2022 Men's T20 Cricket World Cup?",
  status: "Advised",
  categories: [...demoCategories],
  prediction: demoCategories[5].ticker,
  volume: 4560324354,
};

const demoMarketCardProps3 = {
  marketId: 3,
  img: null,
  question: "Who will win the 2022 Men's T20 Cricket World Cup?",
  status: "Permissionless",
  categories: [...demoCategories],
  prediction: demoCategories[6].ticker,
  volume: 45603243,
};

const DemosPage: NextPage = observer(() => {
  if (process.env.NEXT_PUBLIC_ENVIRONMENT_NAME == null) {
    return <NotFoundPage />;
  }
  return (
    <div className="grid grid-cols-3 gap-[30px]">
      <MarketCard {...demoMarketCardProps1} />
      <MarketCard {...demoMarketCardProps2} />
      <MarketCard {...demoMarketCardProps3} />
      <MarketCard {...demoMarketCardProps2} />
      <MarketCard {...demoMarketCardProps1} />
    </div>
  );
});

export default DemosPage;
