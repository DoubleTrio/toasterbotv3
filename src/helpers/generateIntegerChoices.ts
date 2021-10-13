import { ApplicationCommandOptionChoice } from 'discord.js';

interface IntegerMapFunc {
  (n: number): ApplicationCommandOptionChoice;
}

function defaultMapFunc(n: number) : ApplicationCommandOptionChoice {
  const value = n + 1;
  return {
    name: value.toString(),
    value,
  };
}

function generateIntegerChoices(
  n: number, fn: IntegerMapFunc = defaultMapFunc,
) : ApplicationCommandOptionChoice[] {
  return [...Array(n).keys()].map((i) : ApplicationCommandOptionChoice => fn(i));
}

export default generateIntegerChoices;
