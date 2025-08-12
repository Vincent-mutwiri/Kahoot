import fs from 'fs';
import path from 'path';

const envPath = path.resolve('env.json');
const envConfig = JSON.parse(fs.readFileSync(envPath, 'utf8'));

Object.keys(envConfig).forEach(key => {
  process.env[key] = envConfig[key];
});

console.log('Environment variables loaded from env.json');