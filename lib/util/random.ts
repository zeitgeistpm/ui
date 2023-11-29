import seedrandom from "seedrandom";

/**
 * Pseudo-random number generator that returns a number between min and max deterministically based on a seed.
 *
 * @param seed string
 * @param min min range value
 * @param max max range value
 * @returns number
 */
export const seededRandomRangedInt = (
  seed: string,
  min: number,
  max: number,
) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  const rng = seedrandom(seed);
  return Math.floor(rng() * (max - min + 1)) + min;
};

/**
 * Deterministically returns a random element from an array of choices based on a seed.
 *
 * @param seed string
 * @param choices T[]
 * @returns T
 */
export const seededChoice = <T>(seed: string, choices: T[]): T => {
  const index = seededRandomRangedInt(seed, 0, choices.length - 1);
  return choices[index];
};
