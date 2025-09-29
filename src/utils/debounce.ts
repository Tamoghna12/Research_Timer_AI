// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout>;
  let isCancelled = false;

  const debouncedFunc = (...args: Parameters<T>) => {
    if (isCancelled) return;

    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      if (!isCancelled) {
        func(...args);
      }
    }, waitMs);
  };

  debouncedFunc.cancel = () => {
    isCancelled = true;
    clearTimeout(timeoutId);
  };

  return debouncedFunc;
}