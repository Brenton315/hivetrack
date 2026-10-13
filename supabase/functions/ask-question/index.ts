import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MAX_TOKENS = 2048;

const SYSTEM_PROMPT = `You are a beekeeping data analyst for a New Zealand beekeeping operation.
You answer questions about the beekeeper's hive data. You receive a JSON summary of their data
and a natural language question.

Rules:
- Answer concisely and specifically based on the data provided.
- Use NZD for monetary values.
- Reference specific sites or hives by name when relevant.
- If the data doesn't contain enough information to answer, say so clearly.
- Format numbers nicely (e.g. percentages, currency).
- Keep answers under 200 words unless the question requires more detail.
- If asked for recommendations, base them on the data trends.`;

interface AskRequest {
  question: string;
  data_summary: {
    sites: Array<{
      name: string;
      hive_count: number;
      strength: number;
      last_checked: string | null;
      overdue: boolean;
    }>;
    total_hives: number;
    total_revenue: number;
    total_costs: number;
    recent_events: Array<{
      type: string;
      date: string;
      site: string;
      notes: string | null;
    }>;
  };
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not configured on server" }),
      {
        status: 500,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      },
    );
  }

  let body: AskRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  }

  if (!body.question || typeof body.question !== "string") {
    return new Response(
      JSON.stringify({ error: "question is required" }),
      {
        status: 400,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      },
    );
  }

  if (body.question.length > 500) {
    return new Response(
      JSON.stringify({ error: "Question must be under 500 characters" }),
      {
        status: 400,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      },
    );
  }

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-3-5-20241022",
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Here is my beekeeping data:\n\n${JSON.stringify(body.data_summary, null, 2)}\n\nQuestion: ${body.question}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: "Anthropic API error", detail: errorText }),
        {
          status: 502,
          headers: { ...corsHeaders(), "Content-Type": "application/json" },
        },
      );
    }

    const result = await response.json();
    const answer = result.content?.[0]?.text ?? "Unable to generate an answer.";

    return new Response(
      JSON.stringify({
        answer,
        usage: {
          input_tokens: result.usage?.input_tokens ?? 0,
          output_tokens: result.usage?.output_tokens ?? 0,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Failed to call AI service",
        detail: String(err),
      }),
      {
        status: 500,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      },
    );
  }
});
