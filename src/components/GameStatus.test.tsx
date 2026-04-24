import { render } from "../test/render";
import { describe, expect, test } from "vite-plus/test";
import { GameStatus } from "./GameStatus";

describe("GameStatus", () => {
  test("renders title and detail", () => {
    const { container } = render(<GameStatus title="対局中" detail="黒の番です。" />);

    expect(container).toHaveTextContent("対局中");
    expect(container).toHaveTextContent("黒の番です。");
  });
});
