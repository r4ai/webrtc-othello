import {
  act,
  fireEvent,
  render as testingLibraryRender,
  type RenderOptions,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ReactElement } from "react";
import { normalizeHTMLElementFocus } from "./normalizeHTMLElementFocus";

export { act, fireEvent, screen, waitFor, within };

export function render(ui: ReactElement, options?: RenderOptions) {
  normalizeHTMLElementFocus(HTMLElement.prototype);
  return testingLibraryRender(ui, options);
}
