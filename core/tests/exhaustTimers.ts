import { jest } from "@jest/globals";

jest.useFakeTimers();

export async function exhaustTimers() {
  await Promise.resolve();
  while (jest.getTimerCount()) {
    await jest.advanceTimersByTimeAsync(1);
    await Promise.resolve();
  }
}
