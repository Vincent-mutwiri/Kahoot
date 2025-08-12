// Custom type definitions for Node.js process and environment variables

type NodeEnv = 'development' | 'production' | 'test';

interface ProcessEnv {
  NODE_ENV: NodeEnv;
  PORT?: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_REGION: string;
  AWS_S3_BUCKET_NAME: string;
  MONGODB_URI: string;
  [key: string]: string | undefined;
}

declare global {
  namespace NodeJS {
    interface Process {
      env: ProcessEnv;
      on(event: string, listener: (...args: any[]) => void): this;
      exit(code?: number): never;
    }
  }
  
  const process: NodeJS.Process;
}
