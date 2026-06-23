import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { logServerStartup } from "./logger";

const port = Number(process.env.PORT ?? 4747);

serve(
  {
    fetch: createApp().fetch,
    port
  },
  (info) => {
    logServerStartup(info.port);
  }
);
