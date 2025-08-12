import { VercelRequest, VercelResponse } from '@vercel/node';
import { app } from '../server.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Convert Vercel request to a standard Request object
  const headers = new Headers();
  Object.entries(req.headers).forEach(([key, value]: [string, string | string[] | undefined]) => {
    if (Array.isArray(value)) {
      value.forEach((v: string) => headers.append(key, v));
    } else if (value) {
      headers.set(key, value);
    }
  });

  const url = new URL(req.url || '/', `https://${req.headers.host}`);
  const request = new Request(url.toString(), {
    method: req.method,
    headers,
    body: req.method !== 'GET' && req.method !== 'HEAD' 
      ? JSON.stringify(req.body) 
      : undefined,
  });

  try {
    // Handle the request with Hono
    const response = await app.fetch(request);
    
    // Convert Hono response to Vercel response
    const body = await response.text();
    
    // Set status and headers
    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    // Send the response
    res.send(body);
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
