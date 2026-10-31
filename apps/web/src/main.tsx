import { createRoot } from "react-dom/client";

import { Router } from "./router.js";
import "./styles.css";

createRoot(document.getElementById("root")!).render(<Router />);
