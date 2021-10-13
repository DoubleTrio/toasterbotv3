function getRandomInt(min: number, max: number) : number {
  const ceilMin = Math.ceil(min);
  const floorMax = Math.floor(max);
  return Math.floor(Math.random() * (floorMax - ceilMin + 1)) + min;
}

export default getRandomInt;
