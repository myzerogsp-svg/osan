import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { asPanel, mergePanel } from "@/lib/panel-merge";
import type { PanelState } from "@/lib/panel-store";

const MAX = 500_000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "cache-control": "no-store",
    },
  });
}

async function readStored(): Promise<PanelState> {
  const sql = await getSql();
  const rows = await sql<{ body: string }>`select body from center_panel where id = 1`;
  if (!rows[0]?.body) return {};
  try {
    return asPanel(JSON.parse(rows[0].body));
  } catch {
    return {};
  }
}

async function writeStored(state: PanelState) {
  const sql = await getSql();
  const body = JSON.stringify(state);
  const savedAt = Number(state.savedAt) || 0;
  await sql`insert into center_panel (id, body, saved_at) values (1, ${body}, ${savedAt})
    on conflict (id) do update set body = excluded.body, saved_at = excluded.saved_at`;
}

export const Route = createFileRoute("/api/panel")({
  server: {
    handlers: {
      OPTIONS: async () => json(null, 204),
      GET: async () => json(await readStored()),
      POST: async ({ request }) => {
        const text = await request.text();
        if (text.length === 0 || text.length > MAX) return json({ error: "너무 큽니다." }, 400);
        let incoming: PanelState;
        try {
          incoming = asPanel(JSON.parse(text));
        } catch {
          return json({ error: "형식이 아닙니다." }, 400);
        }
        const merged = mergePanel(await readStored(), incoming);
        await writeStored(merged);
        return json(merged);
      },
    },
  },
});
