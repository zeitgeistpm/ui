import Decimal from "decimal.js";

export type MarketOrder = {
  price: Decimal;
  amount: Decimal;
  side: "buy" | "sell";
};

export const selectOrdersForMarketBuy = (
  startingPrice: Decimal,
  endingPrice: Decimal,
  assetOrderBook: MarketOrder[], // orders for asset to buy/sell
  amount: Decimal,
) => {
  const sortedOrders = assetOrderBook.sort((a, b) =>
    a.price.minus(b.price).toNumber(),
  );
  const orderCandidates = sortedOrders.filter(
    (order) =>
      order.side === "sell" && order.price.lessThanOrEqualTo(endingPrice),
  );

  console.log(orderCandidates);

  let filledAmount = new Decimal(0);
  const selectedOrders: MarketOrder[] = [];
  orderCandidates.forEach((order) => {
    if (filledAmount.lessThan(amount)) {
      filledAmount = filledAmount.plus(order.amount);
      selectedOrders.push(order);
    }
  });

  return selectedOrders;
};

export const selectOrdersForMarketSell = (
  startingPrice: Decimal,
  endingPrice: Decimal,
  assetOrderBook: MarketOrder[], // orders for asset to buy/sell
  amount: Decimal,
) => {
  const sortedOrders = assetOrderBook.sort((a, b) =>
    b.price.minus(a.price).toNumber(),
  );
  const orderCandidates = sortedOrders.filter(
    (order) =>
      order.side === "buy" && order.price.greaterThanOrEqualTo(endingPrice),
  );

  console.log(orderCandidates);

  let filledAmount = new Decimal(0);
  const selectedOrders: MarketOrder[] = [];
  orderCandidates.forEach((order) => {
    if (filledAmount.lessThan(amount)) {
      filledAmount = filledAmount.plus(order.amount);
      selectedOrders.push(order);
    }
  });

  return selectedOrders;
};
