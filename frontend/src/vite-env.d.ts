/// <reference types="react-scripts" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly REACT_APP_API_URL: string;
    readonly REACT_APP_AI_SERVICE_URL: string;
    readonly REACT_APP_SENTRY_DSN?: string;
  }
}
