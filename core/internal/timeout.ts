export function timeout(periodMs: number = 0) {
  return new Promise<void>((resolve) => setTimeout(resolve, periodMs));
}
