import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ToastProvider } from "./providers/ToastProvider";
import { WalletProvider } from "./providers/WalletProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WalletProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </WalletProvider>
  </StrictMode>,
);
