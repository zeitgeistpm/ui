export const estimateMarketResolutionDate = (
  endDate: Date,
  blockTimeSeconds: number,
  gracePeriodBlocks: number = 0,
  reportPeriodBlocks: number = 0,
  disputePeriodBlocks: number = 0,
) => {
  const estimatedTimeAfterEnd =
    blockTimeSeconds *
    (gracePeriodBlocks + reportPeriodBlocks / 2 + disputePeriodBlocks);

  return new Date(endDate.getTime() + estimatedTimeAfterEnd * 1000);
};
