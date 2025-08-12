import { VercelRequest, VercelResponse } from '@vercel/node';
import { app } from '../server';

// We'll use the existing Hono instance from server.ts

// Vercel Serverless Function handler
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Convert Vercel request to Hono request
  const url = new URL(req.url || '/', `https://${req.headers.host}`);
  const request = new Request(url.toString(), {
    method: req.method,
    headers: new Headers(req.headers as Record<string, string>),
    body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
  });

  // Handle the request with Hono
  const response = await app.fetch(request);
  
  // Convert Hono response to Vercel response
  const body = await response.text();
  
  // Set headers
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  
  // Send response
  res.status(response.status).send(body);
}
