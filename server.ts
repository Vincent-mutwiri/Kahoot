import "./loadEnv.js";
import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { serve } from '@hono/node-server';
import fs from 'fs';

const logStream = fs.createWriteStream('./server.log', { flags: 'a' });
console.log = function (d) {
  logStream.write(new Date().toISOString() + ' ' + d + '\n');
  process.stdout.write(new Date().toISOString() + ' ' + d + '\n');
};
console.error = function (d) {
  logStream.write(new Date().toISOString() + ' [ERROR] ' + d + '\n');
  process.stderr.write(new Date().toISOString() + ' [ERROR] ' + d + '\n');
};

const app = new Hono();

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
app.post('/_api/vote/redemption', async c => {
  try {
    const { handle } = await import("./endpoints/vote/redemption_POST.js");
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
app.post('/_api/vote/end-redemption', async c => {
  try {
    const { handle } = await import("./endpoints/vote/end-redemption_POST.js");
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
serve({ fetch: app.fetch, port: 3344 });
console.log("Running at http://localhost:3344")
      