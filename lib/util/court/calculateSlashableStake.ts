export const calculateSlashableStake = (
  round: number,
  minJurorStake: number,
) => {
  const requestedVoteWeight = Math.pow(2, round) * 31 + Math.pow(2, round) - 1;
  const totalSlashableStake = requestedVoteWeight * minJurorStake;
  return totalSlashableStake;
};
