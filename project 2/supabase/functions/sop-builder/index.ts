import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SOP_SYSTEM_PROMPT = `You are an expert operations manager for Delikat, a restaurant franchise. Generate a professional Standard Operating Procedure (SOP) in plain text using EXACTLY the following section structure. Do not add extra sections or change the headings.

PURPOSE
[2-3 sentences explaining why this process exists and what it achieves.]

SCOPE
[Who this applies to, when it is used, and any relevant locations or contexts.]

RESPONSIBILITIES
- [Role]: [Responsibility]
- [Role]: [Responsibility]

PROCEDURE
1. [Action verb + specific instruction]
2. [Action verb + specific instruction]
[Continue — be specific, actionable, and complete. Use sub-steps (a, b, c) for complex actions.]

QUALITY STANDARDS
- [Key checkpoint or measurable standard]
- [Key checkpoint or measurable standard]

NOTES
[Any exceptions, safety considerations, references to related SOPs, or additional guidance. Write "None." if not applicable.]

Rules:
- Use plain text only. No markdown, no asterisks, no bullet symbols other than the dash (-) shown above.
- Be specific to the Delikat restaurant context.
- Write every step as an instruction an employee can follow directly.`;

async function generateEmbedding(openaiKey: string, text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Authorization": `Bearer ${openaiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text }),
  });
  if (!res.ok) throw new Error(`OpenAI embeddings error: ${await res.text()}`);
  const data = await res.json();
  return data.data[0].embedding;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;
    const openaiKey = Deno.env.get("OPENAI_API_KEY")!;

    // ── GENERATE ───────────────────────────────────────────────────────────
    if (action === "generate") {
      const { title, description, category } = body;
      if (!title || !description) {
        return new Response(
          JSON.stringify({ error: "title and description are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const chatRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${openaiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: SOP_SYSTEM_PROMPT },
            { role: "user", content: `Process title: ${title}\nCategory: ${category ?? "Operations"}\n\nDescription:\n${description}` },
          ],
          temperature: 0.3,
        }),
      });
      if (!chatRes.ok) throw new Error(`OpenAI error: ${await chatRes.text()}`);
      const data = await chatRes.json();
      return new Response(
        JSON.stringify({ draft: data.choices[0].message.content }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── SAVE (insert new) ──────────────────────────────────────────────────
    if (action === "save") {
      const { title, content, category } = body;
      if (!title || !content || !category) {
        return new Response(
          JSON.stringify({ error: "title, content, and category are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const embedding = await generateEmbedding(openaiKey, `${title}\n\n${content}`);
      const { data: doc, error } = await supabase
        .from("delikat_documents")
        .insert({ content, metadata: { title, category, status: "approved", created_by: "manual" }, embedding })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return new Response(
        JSON.stringify({ id: doc.id, success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── UPDATE (edit existing) ─────────────────────────────────────────────
    if (action === "update") {
      const { id, title, content, category, status = "approved" } = body;
      if (!id || !content) {
        return new Response(
          JSON.stringify({ error: "id and content are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: existing, error: fetchErr } = await supabase
        .from("delikat_documents")
        .select("metadata")
        .eq("id", id)
        .single();
      if (fetchErr) throw new Error(fetchErr.message);
      const embedding = await generateEmbedding(openaiKey, `${title}\n\n${content}`);
      const { error: updateErr } = await supabase
        .from("delikat_documents")
        .update({ content, metadata: { ...existing.metadata, title, category, status }, embedding })
        .eq("id", id);
      if (updateErr) throw new Error(updateErr.message);
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ANALYZE GAPS ───────────────────────────────────────────────────────
    if (action === "analyze-gaps") {
      const existingDocs = (body.existingDocs ?? []) as { title: string; category: string }[];
      const docList = existingDocs.length > 0
        ? existingDocs.map((d, i) => `${i + 1}. "${d.title}" [${d.category}]`).join("\n")
        : "(No existing documents found — assume all 15 are missing)";

      const userPrompt = `Existing knowledge base documents:\n${docList}\n\nIdentify which of the 15 critical restaurant processes listed below are MISSING or not adequately covered. Return only valid JSON.\n\nCritical processes to check:\n1. POS system failure\n2. Internet outage\n3. Power outage / blackout\n4. Customer complaint escalation\n5. Customer injury on premises\n6. Food poisoning complaint\n7. Emergency closure procedure\n8. Supplier delivery rejection\n9. Employee no-show / last-minute absence\n10. Cash register mismatch / discrepancy\n11. Product out of stock handling\n12. Kitchen printer failure\n13. Pest sighting response\n14. Water leak / flooding response\n15. Fire or smoke incident\n\nJSON structure:\n{\n  "gaps": [\n    {\n      "title": "SOP title (specific and actionable)",\n      "category": "Operations|Kitchen|Bar|Service|HR|Training|Suppliers|Finance|Franchise",\n      "priority": "High|Medium|Low",\n      "reason": "One sentence: why this matters for a restaurant",\n      "description": "2-3 sentences describing what this SOP should cover, suitable as a starting prompt for the SOP builder"\n    }\n  ]\n}\n\nPriority: High=safety or financial risk, Medium=operational impact, Low=efficiency. Only include genuinely missing processes.`;

      const chatRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${openaiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You analyze restaurant knowledge bases for gaps. Return only valid JSON as instructed." },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
      });
      if (!chatRes.ok) throw new Error(`OpenAI error: ${await chatRes.text()}`);
      const data = await chatRes.json();
      const parsed = JSON.parse(data.choices[0].message.content);
      return new Response(
        JSON.stringify({ gaps: parsed.gaps ?? [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── LIST (fetch all documents) ─────────────────────────────────────────
    if (action === "list") {
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: docs, error } = await supabase
        .from("delikat_documents")
        .select("id, content, metadata, created_at");
      if (error) throw new Error(error.message);
      return new Response(
        JSON.stringify({ documents: docs ?? [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── UPDATE STATUS ──────────────────────────────────────────────────────
    if (action === "update-status") {
      const { id, status } = body;
      if (!id || !status) {
        return new Response(
          JSON.stringify({ error: "id and status are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: existing, error: fetchErr } = await supabase
        .from("delikat_documents")
        .select("metadata")
        .eq("id", id)
        .single();
      if (fetchErr) throw new Error(fetchErr.message);
      const { error } = await supabase
        .from("delikat_documents")
        .update({ metadata: { ...existing.metadata, status } })
        .eq("id", id);
      if (error) throw new Error(error.message);
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use generate, save, update, analyze-gaps, list, or update-status." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message ?? "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
