export function normalizeHTMLElementFocus(
  prototype: Pick<typeof HTMLElement.prototype, "focus">,
): void {
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "focus");

  if (!descriptor?.configurable || descriptor.writable === true) {
    return;
  }

  const focus =
    typeof descriptor.value === "function"
      ? descriptor.value
      : function focus(this: typeof prototype, ...args: unknown[]) {
          const focusImpl = descriptor.get?.call(this);

          if (typeof focusImpl === "function") {
            return focusImpl.apply(this, args);
          }
        };

  Object.defineProperty(prototype, "focus", {
    configurable: true,
    enumerable: descriptor.enumerable ?? false,
    writable: true,
    value: focus,
  });
}
