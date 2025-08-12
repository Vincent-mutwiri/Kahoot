/// <reference types="@vercel/node" />

// This file ensures TypeScript recognizes Vercel's environment variables
declare namespace NodeJS {
  interface ProcessEnv {
    // Add your environment variables here
    // Example:
    // DATABASE_URL: string;
    // API_KEY: string;
  }
}
