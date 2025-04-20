/* eslint-disable @typescript-eslint/no-unused-vars */
export const removeFalsyFields = <T extends Record<string, unknown>>(
  obj: T
): Partial<T> =>
  Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => Boolean(value))
  ) as Partial<T>;
