import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MAX_NOTES_PER_BATCH = 30;
const MAX_TOKENS = 4096;

const SYSTEM_PROMPT = `You are a beekeeping data extraction assistant for a New Zealand beekeeping operation.
Parse raw field notes into structured event data. Each note may describe one or more events at a site.

Extract the following event types:
- inspection: frames_of_bees, frames_of_stores, frames_of_brood (numbers 0-20)
- feed: feed_type (sugar syrup, fondant, pollen patty, dry sugar, other), amount (e.g. "2L per hive")
- treatment: product (Apivar, Apitraz, Bayvarol, oxalic acid, formic acid, thymol, other), method (strip, sublimation, dribble, other)
- box_added: box_type (brood, super), action (added, removed)
- cost: category (feed, treatment, transport, equipment, labour, other), amount (number in NZD)
- visit: hive_count, strong/medium/weak counts, feeding_done, treatment_applied, boxes_added/removed, queen_events

Rules:
- If a date is mentioned, extract it. Otherwise leave event_date as null.
- If a site name is mentioned, extract it. Otherwise leave site_name as null.
- If a hive name/number is mentioned, extract it. Otherwise leave hive_name as null.
- Use NZD for currency. Convert if another currency is mentioned.
- "Good" or "strong" hives = strong. "OK" or "average" = medium. "Poor" or "struggling" = weak.
- If note mentions "all hives" at a site, create a visit event rather than individual inspections.
- Always return valid JSON.

Respond with a JSON array of parsed events:
[{
  "event_type": "inspection" | "feed" | "treatment" | "box_added" | "cost" | "visit",
  "event_date": "YYYY-MM-DD" | null,
  "site_name": string | null,
  "hive_name": string | null,
  "data": { ... type-specific fields ... },
  "notes": "original relevant text snippet",
  "confidence": 0.0-1.0
}]`;

interface ParseRequest {
  notes: string[];
}

function extractText(
  content: Array<{ type: string; text?: string }>,
): string | null {
  const textBlock = content?.find((b) => b.type === "text");
  return textBlock?.text ?? null;
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

  let body: ParseRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  }

  if (!Array.isArray(body.notes) || body.notes.length === 0) {
    return new Response(
      JSON.stringify({ error: "notes must be a non-empty array of strings" }),
      {
        status: 400,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      },
    );
  }

  if (body.notes.length > MAX_NOTES_PER_BATCH) {
    return new Response(
      JSON.stringify({
        error: `Maximum ${MAX_NOTES_PER_BATCH} notes per batch`,
      }),
      {
        status: 400,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      },
    );
  }

  const notesText = body.notes
    .map((n, i) => `Note ${i + 1}: ${n}`)
    .join("\n\n");

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-5-5",
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Parse the following beekeeper field notes into structured events:\n\n${notesText}`,
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
    const content = extractText(result.content) ?? "[]";

    let parsed;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      parsed = [];
    }

    return new Response(
      JSON.stringify({
        events: parsed,
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
