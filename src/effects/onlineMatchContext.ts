import { createContext } from "react";
import type { OnlineMatchValue } from "./OnlineMatchContext";

export const OnlineMatchContext = createContext<OnlineMatchValue | null>(null);
