export function scheduleImmediately(task: () => void) {
  if (globalThis.queueMicrotask) {
    return globalThis.queueMicrotask(task);
  }
  return setTimeout(task, 0);
}
