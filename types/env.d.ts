namespace NodeJS {
  interface ProcessEnv {
    // AWS
    AWS_ACCESS_KEY_ID: string;
    AWS_SECRET_ACCESS_KEY: string;
    AWS_REGION: string;
    AWS_S3_BUCKET_NAME: string;
    
    // MongoDB
    MONGODB_URI: string;
    
    // Application
    NODE_ENV: 'development' | 'production' | 'test';
    PORT?: string;
    
    // Add other environment variables as needed
  }
}
