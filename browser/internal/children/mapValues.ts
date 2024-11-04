export function mapValues<T, U extends Record<keyof T, any>>(
  input: T,
  transform: <K extends keyof T>(propValue: T[K], key: K) => U[K],
): { [id in keyof T]: U[id] };
export function mapValues<K extends string, T, U>(
  input: Record<K, T>,
  transform: (propValue: T, key: K) => U,
): Record<K, U>;
export function mapValues<K extends string, T, U>(
  input: Record<K, T>,
  transform: (propValue: T, key: K) => U,
): Record<K, U> {
  return Object.fromEntries(
    Object.entries<T>(input).map(([key, propValue]) => [
      key as K,
      transform(propValue, key as K),
    ]),
  ) as Record<K, U>;
}
