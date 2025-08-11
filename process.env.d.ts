type ProcessEnvShouldBeSuppliedByResources = {
FLOOT_DATABASE_URL: string;
NODE_ENV: string;
}

// Override the global process variable
declare var process: {
  env: ProcessEnvShouldBeSuppliedByResources;
};
