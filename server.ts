import "./loadEnv.js";
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { serve } from '@hono/node-server';
import type { Server } from 'http';
import { setupWebSocket } from './lib/websocket.js';
import fs from 'fs';
import path from 'path';

// Set up logging
const logDir = process.env.NODE_ENV === 'production' ? '/tmp' : '.';
const logStream = fs.createWriteStream(path.join(logDir, 'server.log'), { flags: 'a' });

// Override console.log and console.error to write to both file and stdout/stderr
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = function (...args) {
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
  logStream.write(`${new Date().toISOString()} ${message}\n`);
  originalConsoleLog.apply(console, args as [any?, ...any[]]);
};

console.error = function (...args) {
  const message = args.map(arg => arg instanceof Error ? arg.stack : typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
  logStream.write(`${new Date().toISOString()} [ERROR] ${message}\n`);
  originalConsoleError.apply(console, args as [any?, ...any[]]);
};

// Import custom type declarations
import './types/process.d';

// Environment variable validation
const requiredEnvVars = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'AWS_S3_BUCKET_NAME',
  'MONGODB_URI'
] as const;

// Validate required environment variables
if (process.env.NODE_ENV !== 'test') {
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars.join(', '));
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export const app = new Hono();

// Export the handler for Vercel
const handler = app.fetch;
export { handler };

app.post('/_api/game/create',async c => {
  try {
    const { handle } = await import("./endpoints/game/create_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: `Error loading endpoint code: ${errorMessage}` }, 500);
  }
})
app.post('/_api/game/join',async c => {
  try {
    const { handle } = await import("./endpoints/game/join_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: `Error loading endpoint code: ${errorMessage}` }, 500);
  }
})
app.get('/_api/game/info',async c => {
  try {
    const { handle } = await import("./endpoints/game/info_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: `Error loading endpoint code: ${errorMessage}` }, 500);
  }
})
app.post('/_api/game/start',async c => {
  try {
    const { handle } = await import("./endpoints/game/start_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: `Error loading endpoint code: ${errorMessage}` }, 500);
  }
})
app.post('/_api/game/next-question',async c => {
  try {
    const { handle } = await import("./endpoints/game/next-question_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: `Error loading endpoint code: ${errorMessage}` }, 500);
  }
})
app.post('/_api/game/reveal-answer',async c => {
  try {
    const { handle } = await import("./endpoints/game/reveal-answer_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: `Error loading endpoint code: ${errorMessage}` }, 500);
  }
})
app.post('/_api/game/show-media',async c => {
  try {
    const { handle } = await import("./endpoints/game/show-media_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: `Error loading endpoint code: ${errorMessage}` }, 500);
  }
})
app.post('/_api/game/hide-media',async c => {
  try {
    const { handle } = await import("./endpoints/game/hide-media_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: `Error loading endpoint code: ${errorMessage}` }, 500);
  }
})
app.post('/_api/game/play-sound',async c => {
  try {
    const { handle } = await import("./endpoints/game/play-sound_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: `Error loading endpoint code: ${errorMessage}` }, 500);
  }
})
app.post('/_api/game/clear-sound',async c => {
  try {
    const { handle } = await import("./endpoints/game/clear-sound_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: `Error loading endpoint code: ${errorMessage}` }, 500);
  }
})
app.post('/_api/game/player-hide-media',async c => {
  try {
    const { handle } = await import("./endpoints/game/player-hide-media_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: `Error loading endpoint code: ${errorMessage}` }, 500);
  }
})
app.post('/_api/game/end',async c => {
  try {
    const { handle } = await import("./endpoints/game/end_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: `Error loading endpoint code: ${errorMessage}` }, 500);
  }
})
app.post('/_api/player/answer',async c => {
  try {
    const { handle } = await import("./endpoints/player/answer_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: `Error loading endpoint code: ${errorMessage}` }, 500);
  }
})
app.get('/_api/player/state',async c => {
  try {
    const { handle } = await import("./endpoints/player/state_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: `Error loading endpoint code: ${errorMessage}` }, 500);
  }
})
app.post('/_api/question/add',async c => {
  try {
    const { handle } = await import("./endpoints/question/add_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: `Error loading endpoint code: ${errorMessage}` }, 500);
  }
})
app.get('/_api/question/list',async c => {
  try {
    const { handle } = await import("./endpoints/question/list_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: `Error loading endpoint code: ${errorMessage}` }, 500);
  }
})
app.post('/_api/question/update',async c => {
  try {
    const { handle } = await import("./endpoints/question/update_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: `Error loading endpoint code: ${errorMessage}` }, 500);
  }
})
app.post('/_api/question/delete',async c => {
  try {
    const { handle } = await import("./endpoints/question/delete_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: `Error loading endpoint code: ${errorMessage}` }, 500);
  }
})
app.post('/_api/vote/start',async c => {
  try {
    const { handle } = await import("./endpoints/vote/start_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: `Error loading endpoint code: ${errorMessage}` }, 500);
  }
})
app.post('/_api/vote/cast',async c => {
  try {
    const { handle } = await import("./endpoints/vote/cast_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: `Error loading endpoint code: ${errorMessage}` }, 500);
  }
})
app.get('/_api/vote/state',async c => {
  try {
    const { handle } = await import("./endpoints/vote/state_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: `Error loading endpoint code: ${errorMessage}` }, 500);
  }
})
app.post('/_api/vote/end',async c => {
  try {
    const { handle } = await import("./endpoints/vote/end_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: `Error loading endpoint code: ${errorMessage}` }, 500);
  }
})
app.post('/_api/upload/get-presigned-url', async c => {
  try {
    const { handle } = await import("./endpoints/upload/get-presigned-url_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: `Error loading endpoint code: ${errorMessage}` }, 500);
  }
})
app.post('/_api/game/set-media-url', async c => {
  try {
    const { handle } = await import("./endpoints/game/set-media-url_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: `Error loading endpoint code: ${errorMessage}` }, 500);
  }
})
app.post('/_api/game/set-sequence-video', async c => {
  try {
    const { handle } = await import("./endpoints/game/set-sequence-video_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: `Error loading endpoint code: ${errorMessage}` }, 500);
  }
})
app.post('/_api/game/advance-state', async c => {
  try {
    const { handle } = await import("./endpoints/game/advance-state_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: `Error loading endpoint code: ${errorMessage}` }, 500);
  }
})
// Deprecated endpoints removed: vote/redemption and vote/end-redemption
app.get('/_api/settings/get-global-videos', async c => {
  try {
    const { handle } = await import("./endpoints/settings/get-global-videos_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: `Error loading endpoint code: ${errorMessage}` }, 500);
  }
})
app.post('/_api/settings/set-global-video', async c => {
  try {
    const { handle } = await import("./endpoints/settings/set-global-video_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: `Error loading endpoint code: ${errorMessage}` }, 500);
  }
})
app.get('/_api/questions/global-list', async c => {
  try {
    const { handle } = await import("./endpoints/questions/global-list_GET.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: `Error loading endpoint code: ${errorMessage}` }, 500);
  }
})
app.post('/_api/questions/save-global', async c => {
  try {
    const { handle } = await import("./endpoints/questions/save-global_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: `Error loading endpoint code: ${errorMessage}` }, 500);
  }
})
app.post('/_api/questions/import-global', async c => {
  try {
    const { handle } = await import("./endpoints/questions/import-global_POST.js");
    let request = c.req.raw;
    const response = await handle(request);
    if (!(response instanceof Response)) {
      return c.text("Invalid response format. handle should always return a Response object.", 500);
    }
    return response;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: `Error loading endpoint code: ${errorMessage}` }, 500);
  }
})
app.use('/*', serveStatic({ root: './dist' }))
app.get("*", async (c, next) => {
  const p = c.req.path;
  if (p.startsWith("/_api")) {
    return next();
  }
  return serveStatic({ path: "./dist/index.html" })(c, next);
});

// Get port from environment variable or use default
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Create server
const server = serve({
  fetch: app.fetch,
  port,
}) as unknown as Server; // Type assertion to handle Hono's server type

console.log(`Server is running on http://localhost:${port}`);

// Set up WebSocket
setupWebSocket(server);

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
console.log("Running at http://localhost:3344")