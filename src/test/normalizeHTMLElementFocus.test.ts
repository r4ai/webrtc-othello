import { describe, expect, test, vi } from "vite-plus/test";
import { normalizeHTMLElementFocus } from "./normalizeHTMLElementFocus";

describe("normalizeHTMLElementFocus", () => {
  test("converts an accessor-backed focus descriptor into a callable method", () => {
    class FakeElement {}

    const focusImpl = vi.fn(function (this: FakeElement) {
      return this;
    });

    Object.defineProperty(FakeElement.prototype, "focus", {
      configurable: true,
      enumerable: true,
      get() {
        return focusImpl;
      },
    });

    normalizeHTMLElementFocus(FakeElement.prototype as Pick<typeof HTMLElement.prototype, "focus">);

    const element = new FakeElement() as FakeElement & { focus: () => void };
    const descriptor = Object.getOwnPropertyDescriptor(FakeElement.prototype, "focus");

    expect(descriptor?.writable).toBe(true);
    expect(typeof descriptor?.value).toBe("function");

    element.focus();

    expect(focusImpl).toHaveBeenCalledTimes(1);
    expect(focusImpl).toHaveBeenCalledWith();
    expect(focusImpl.mock.instances[0]).toBe(element);
  });

  test("leaves an already writable focus method unchanged", () => {
    class FakeElement {}

    const focusImpl = vi.fn();

    Object.defineProperty(FakeElement.prototype, "focus", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: focusImpl,
    });

    normalizeHTMLElementFocus(FakeElement.prototype as Pick<typeof HTMLElement.prototype, "focus">);

    const descriptor = Object.getOwnPropertyDescriptor(FakeElement.prototype, "focus");

    expect(descriptor?.value).toBe(focusImpl);
    expect(descriptor?.writable).toBe(true);
  });
});
