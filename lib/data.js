import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { demoData } from "./demo";

// Server-only. The service key never reaches the browser.
export function getMode() {
  if (process.env.MOCK_DATA === "1") return "demo";
  try { return cookies().get("aangan_mode")?.value === "demo" ? "demo" : "live"; } catch { return "live"; }
}
function db() {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not set in Vercel.");
  return createClient(url, key, { auth: { persistSession: false } });
}
const CALL_FIELDS = "id,vaani_call_id,source,status,waiting_on,last_error,attempts,caller_name,caller_phone,email,tier,disposition,reasons,extraction,summary,handoff_note,after_hours,duration_sec,pricing_asked,booking_status,designer_id,assigned_owner_id,hubspot_contact_id,hubspot_deal_id,hubspot_ticket_id,hubspot_task_id,created_at,started_at,processed_at,recording_url";

async function hs(path, body) {
  const token = process.env.HUBSPOT_TOKEN;
  if (!token) return { error: "HUBSPOT_TOKEN is not set" };
  const r = await fetch(`https://api.hubapi.com${path}`, { method: body ? "POST" : "GET", cache: "no-store", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) return { error: `HubSpot ${r.status}` };
  return { data: await r.json() };
}
async function batchRead(object, ids, properties) {
  const out = {}; let error = null;
  for (let i = 0; i < ids.length; i += 100) {
    const r = await hs(`/crm/v3/objects/${object}/batch/read`, { inputs: ids.slice(i, i + 100).map((id) => ({ id })), properties });
    if (r.error) { error = r.error; break; }
    for (const o of r.data.results ?? []) out[o.id] = o.properties;
  }
  return { out, error };
}

function enrich(rows, designers, rules, stages, amounts, tasks) {
  const sla = rules.sla_hours ?? { P1: 2, P2: 24, P3: 72, SERVICE: 0.25 };
  const byId = Object.fromEntries(designers.map((d) => [d.id, d]));
  return rows.map((c) => {
    const task = c.hubspot_task_id ? tasks[c.hubspot_task_id] : null;
    const stage = c.hubspot_deal_id ? stages[c.hubspot_deal_id] ?? null : null;
    const slaDue = c.tier && c.processed_at ? new Date(Date.parse(c.processed_at) + Number(sla[c.tier] ?? 24) * 3600e3).toISOString() : null;
    const closed = stage === "won" || stage === "lost";
    return {
      ...c, extraction: c.extraction ?? {}, reasons: c.reasons ?? [], stage, amount: c.hubspot_deal_id ? amounts[c.hubspot_deal_id] ?? null : null,
      designer: c.designer_id ? byId[c.designer_id] ?? null : null, task, due: task?.due ?? slaDue, dueSource: task?.due ? "hubspot" : "sla",
      needsCall: !!c.tier && !closed && !(task?.done) && c.status === "done",
      stuck: c.status === "needs_attention" || c.status === "waiting_credentials",
      when: c.started_at ?? c.created_at,
    };
  });
}

export async function loadCore({ days = 30, includeTest = false } = {}) {
  const mode = getMode();
  if (mode === "demo") {
    const x = demoData();
    const since = Date.now() - days * 86400e3;
    const all = enrich(x.rows, x.designers, x.rules, x.stages, x.amounts, x.tasks).sort((a, b) => Date.parse(b.when) - Date.parse(a.when));
    const calls = all.filter((c) => Date.parse(c.when) >= since);
    return { mode, calls, allCalls: all, designers: x.designers, rules: x.rules, pipeline: null, portalId: null, hubspotError: null, costs: x.costs.filter((c) => Date.parse(c.created_at) >= since), liveOnly: true, bookings: x.bookings };
  }
  const sb = db();
  const since = new Date(Date.now() - days * 86400e3).toISOString();
  const [{ data: rows, error }, { data: designers }, { data: rulesRows }, { data: cfg }, { data: costs }] = await Promise.all([
    sb.from("call_records").select(CALL_FIELDS).gte("created_at", since).order("created_at", { ascending: false }).limit(1000),
    sb.from("designers").select("*").order("name"),
    sb.from("studio_rules").select("key,value"),
    sb.from("app_config").select("key,value").eq("key", "hubspot_pipeline"),
    sb.from("usage_costs").select("vendor,source,amount_inr,units,unit,created_at").gte("created_at", since),
  ]);
  if (error) throw new Error(error.message);
  const rules = Object.fromEntries((rulesRows ?? []).map((r) => [r.key, r.value]));
  const pipeline = cfg?.[0]?.value ? JSON.parse(cfg[0].value) : null;
  const stageById = pipeline ? Object.fromEntries(Object.entries(pipeline.stages).map(([k, id]) => [String(id), k])) : {};
  const dealIds = [...new Set((rows ?? []).map((r) => r.hubspot_deal_id).filter(Boolean))];
  const taskIds = [...new Set((rows ?? []).map((r) => r.hubspot_task_id).filter(Boolean))];
  const [deals, tasks, acct] = await Promise.all([batchRead("deals", dealIds, ["dealstage", "amount"]), batchRead("tasks", taskIds, ["hs_task_status", "hs_timestamp"]), hs("/account-info/v3/details")]);
  const stages = {}, amounts = {}, taskMap = {};
  for (const [id, p] of Object.entries(deals.out)) { stages[id] = stageById[String(p.dealstage)] ?? null; amounts[id] = p.amount ? Number(p.amount) : null; }
  for (const [id, p] of Object.entries(tasks.out)) taskMap[id] = { done: p.hs_task_status === "COMPLETED", due: p.hs_timestamp ?? null };
  const enriched = enrich(rows ?? [], designers ?? [], rules, stages, amounts, taskMap);
  const live = enriched.filter((c) => c.source === "vaani");
  const liveOnly = !includeTest && live.length > 0;
  return { mode, calls: liveOnly ? live : enriched, allCalls: enriched, designers: designers ?? [], rules, pipeline, portalId: acct.data?.portalId ?? null, hubspotError: deals.error ?? acct.error ?? null, costs: costs ?? [], liveOnly, bookings: null };
}

export async function loadBookings() {
  const core = await loadCore({ days: 120, includeTest: true });
  if (core.mode === "demo") return { ...core, bookings: core.bookings };
  const { data } = await db().from("bookings_log").select("id,call_ref,designer_id,slot_start,status").eq("status", "confirmed").order("slot_start");
  const byRef = Object.fromEntries(core.allCalls.map((c) => [c.vaani_call_id, c]));
  const bookings = (data ?? []).map((b) => { const c = byRef[b.call_ref]; return { ...b, call_id: c?.id ?? null, caller_name: c?.caller_name ?? "Caller", location: c?.extraction?.location ?? null, kind: "Consultation" }; });
  return { ...core, bookings };
}

export async function loadLead(id) {
  const core = await loadCore({ days: 3650, includeTest: true });
  const call = core.allCalls.find((x) => x.id === id) ?? null;
  if (!call) return { call: null, mode: core.mode };
  if (core.mode === "demo") return { call, mode: "demo", portalId: null, transcript: `Agent: Thank you for calling Aangan Studio. I'm the studio's virtual assistant, and this call is recorded so a designer can follow up. What are you planning?\nCaller: Hi, I'm ${call.caller_name ?? "calling"}. I have a ${call.extraction.property_type ?? "flat"} in ${call.extraction.location ?? "Pune"}.\nAgent: Lovely. What would you like done?\nCaller: ${call.extraction.scope_summary ?? "Not sure yet"}.\nAgent: And when does it need to be finished?\nCaller: ${call.extraction.deadline_text ?? "No fixed date"}.`, events: [
    { created_at: call.when, system: "vaani", action: "webhook", status: "ok" }, { created_at: call.when, system: "gemini", action: "extract", status: "ok" }, { created_at: call.when, system: "pipeline", action: "classify", status: "ok" },
    { created_at: call.processed_at, system: "hubspot", action: "contact_upsert", status: "ok" }, { created_at: call.processed_at, system: "hubspot", action: "deal_create", status: "ok" }, { created_at: call.processed_at, system: "hubspot", action: "task_create", status: "ok" },
  ], quals: [] };
  const sb = db();
  const [{ data: full }, { data: events }] = await Promise.all([
    sb.from("call_records").select("transcript").eq("id", id).single(),
    sb.from("integration_events").select("created_at,system,action,status,detail").eq("call_record_id", id).order("created_at"),
  ]);
  return { call, mode: "live", transcript: full?.transcript ?? null, events: events ?? [], portalId: core.portalId };
}

export async function loadSystem() {
  if (process.env.MOCK_DATA === "1") return { secrets: { hubspot_token: true, gemini_api_key: true, calendly_token: false, vaani_webhook_secret: false }, lastEvents: [], rules: [], kb: [], lastRun: new Date().toISOString() };
  const sb = db();
  const [{ data: secrets }, { data: lastEvents }, { data: rules }, { data: kb }] = await Promise.all([
    sb.rpc("secrets_present"),
    sb.from("integration_events").select("created_at,system,action,status,detail").order("created_at", { ascending: false }).limit(15),
    sb.from("studio_rules").select("key,value,description,updated_at").order("key"),
    sb.from("knowledge_base").select("topic,content,source,approved").order("topic"),
  ]);
  return { secrets: secrets ?? {}, lastEvents: lastEvents ?? [], rules: rules ?? [], kb: kb ?? [], lastRun: lastEvents?.[0]?.created_at ?? null };
}

export async function lastLiveCall() {
  if (getMode() === "demo") return new Date(Date.now() - 38 * 60e3).toISOString();
  try { const { data } = await db().from("call_records").select("created_at").eq("source", "vaani").order("created_at", { ascending: false }).limit(1); return data?.[0]?.created_at ?? null; } catch { return null; }
}
