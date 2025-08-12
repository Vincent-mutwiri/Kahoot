type ProcessEnvShouldBeSuppliedByResources = {
  FLOOT_DATABASE_URL: string;
  NODE_ENV: string;
  MONGODB_URI: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_REGION: string;
  AWS_S3_BUCKET_NAME: string;
  PORT?: string;
}

// Override the global process variable
declare var process: {
  env: ProcessEnvShouldBeSuppliedByResources;
  exit: (code?: number) => never;
  on: (event: string, listener: (...args: any[]) => void) => any;
};
