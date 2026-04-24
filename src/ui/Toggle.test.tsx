import { render } from "@testing-library/react";
import { describe, expect, test } from "vite-plus/test";
import { Toggle } from "./Toggle";

describe("Toggle", () => {
  test("renders selected styles when on", () => {
    const { container } = render(<Toggle label="AI" isSelected={true} onChange={() => {}} />);

    expect(container.querySelector(".bg-emerald-300")).toBeTruthy();
    expect(container.querySelector(".left-5")).toBeTruthy();
  });

  test("renders unselected styles when off", () => {
    const { container } = render(<Toggle label="AI" isSelected={false} onChange={() => {}} />);

    expect(container.querySelector(".bg-white\\/30")).toBeTruthy();
    expect(container.querySelector(".left-1")).toBeTruthy();
  });
});
