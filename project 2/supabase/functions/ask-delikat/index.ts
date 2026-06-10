import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { question } = await req.json();

    if (!question || typeof question !== "string") {
      return new Response(
        JSON.stringify({ error: "question is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate embedding for the question
    const embeddingRes = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: question,
      }),
    });

    if (!embeddingRes.ok) {
      const err = await embeddingRes.text();
      throw new Error(`OpenAI embeddings error: ${err}`);
    }

    const embeddingData = await embeddingRes.json();
    const embedding = embeddingData.data[0].embedding;

    // Vector similarity search
    const { data: sources, error: matchError } = await supabase.rpc("match_delikat_documents", {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 5,
    });

    if (matchError) {
      throw new Error(`Database error: ${matchError.message}`);
    }

    const context = (sources ?? [])
      .map((s: any) => `## ${s.metadata?.title ?? "Document"}\n\n${s.content}`)
      .join("\n\n---\n\n");

    // Generate answer with OpenAI
    const chatRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are Delikat OS, an internal assistant for the Delikat franchise. Answer questions based only on the provided documentation. Be concise and accurate. Respond in the same language as the question. At the end of your answer, list the source document titles used.",
          },
          {
            role: "user",
            content: `Documentation:\n\n${context}\n\nQuestion: ${question}`,
          },
        ],
        temperature: 0.2,
      }),
    });

    if (!chatRes.ok) {
      const err = await chatRes.text();
      throw new Error(`OpenAI chat error: ${err}`);
    }

    const chatData = await chatRes.json();
    const answer = chatData.choices[0].message.content;

    return new Response(
      JSON.stringify({ answer, sources: sources ?? [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message ?? "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
