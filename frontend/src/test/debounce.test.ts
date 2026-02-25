import debounce from "lodash.debounce";
import { describe, expect, it, vi } from "vitest";

describe("debounced save behavior", () => {
  it("coalesces rapid calls into one invocation", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced("a");
    debounced("b");
    debounced("c");

    expect(fn).toHaveBeenCalledTimes(0);
    vi.advanceTimersByTime(299);
    expect(fn).toHaveBeenCalledTimes(0);
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith("c");

    vi.useRealTimers();
  });
});

