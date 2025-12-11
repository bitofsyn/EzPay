import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { BrowserRouter } from "react-router-dom";

// Sentry import
import * as Sentry from "@sentry/react";

// Sentry 초기화 (DSN이 설정된 경우에만)
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    sendDefaultPii: true
  });
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      {/* App 전체를 Sentry ErrorBoundary로 감쌈 */}
      <Sentry.ErrorBoundary fallback={<p>예기치 않은 오류가 발생했어요 😢</p>}>
        <App />
      </Sentry.ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);
