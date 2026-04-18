export function generatePickupCode(existingCodes: Set<string>): string {
  function make(): string {
    return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  }

  const first = make();
  if (!existingCodes.has(first)) return first;

  const second = make();
  if (!existingCodes.has(second)) return second;

  throw new Error("Pickup code collision — retry the request");
}
