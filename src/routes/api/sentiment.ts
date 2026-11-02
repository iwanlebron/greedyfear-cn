import { createFileRoute } from "@tanstack/react-router";
import { getSentiment } from "@/lib/sentiment.server";

export const Route = createFileRoute("/api/sentiment")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const fresh = new URL(request.url).searchParams.has("fresh");
        const data = await getSentiment(fresh);
        return Response.json(data, {
          headers: { "Cache-Control": "no-store" },
        });
      },
    },
  },
});
