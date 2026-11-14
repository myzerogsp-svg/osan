import { createRoot } from "react-dom/client";
import { Home } from "../src/dashboard";
import "./offline.css";

const root = document.getElementById("root");
if (root) createRoot(root).render(<Home />);
