export function scheduleImmediately(task: () => void) {
  if (globalThis.queueMicrotask) {
    return globalThis.queueMicrotask(task);
  }
  void Promise.resolve().then(task);
  return;
}
