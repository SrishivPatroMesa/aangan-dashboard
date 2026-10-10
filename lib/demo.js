// Demo dataset for presentations. Deterministic, clearly labelled "Demo data" in the UI, never written anywhere.
const NAMES = ["Kavya Iyer","Rohan Deshmukh","Meera Kulkarni","Anand Sharma","Pooja Rao","Ritu Kapoor","Siddharth Gupta","Neha Joshi","Amol Patil","Sunil Yadav","Tanvi Kulkarni","Kiran Mazumdar","Preethi Nair","Divya Hegde","Vikram Bhosale","Aditi Phadke","Nikhil Jain","Sneha Pawar","Rahul Menon","Ishaan Kale","Gauri Apte","Harsh Vora","Leena D'Souza","Manish Thakur","Shruti Gokhale","Arjun Rane","Zoya Khan","Omkar Shinde","Prachi Bapat","Varun Sethi","Anjali Mehta","Kunal Desai","Ritika Ghosh","Sameer Pathak","Natasha Fernandes","Yash Agarwal","Bhavna Iyer","Chetan More","Farah Sheikh","Devika Naik","Rakesh Pillai","Swati Joshi","Abhay Rathi","Mitali Sen","Parag Oak","Esha Kamat"];
const AREAS = ["Baner","Aundh","Kothrud","Wakad","Hinjewadi","Kalyani Nagar","Viman Nagar","Koregaon Park","Magarpatta","Kharadi","Pimple Saudagar","Undri","NIBM","Hadapsar","Ravet","Bavdhan"];
const PROPS = [["2BHK apartment",950],["3BHK apartment",1250],["3BHK apartment",1400],["4BHK apartment",2200],["Villa",4200],["2BHK apartment",880],["Office",1600],["Clinic",900],["3BHK apartment",1100]];
const SCOPES = ["Full home: kitchen, wardrobes, living and bedrooms","Modular kitchen and two bedrooms","Living, dining and master bedroom","Complete fit-out from bare shell","Workstations for 25, two cabins, meeting room","Kitchen and wardrobes"];
const SOURCES = ["Instagram","Referral from a past client","Google search","Friend's recommendation","Builder referral","LinkedIn"];
const DESIGNERS = [
  { id: "demo-d1", name: "Riya Shah", role: "designer", active: true, areas: ["baner","aundh","bavdhan"] },
  { id: "demo-d2", name: "Arjun Nair", role: "designer", active: true, areas: ["kalyani","viman","koregaon","kharadi"] },
  { id: "demo-d3", name: "Isha Patil", role: "designer", active: true, areas: ["wakad","hinjewadi","pimple","ravet"] },
  { id: "demo-d4", name: "Dev Kulkarni", role: "designer", active: true, areas: ["kothrud","magarpatta","undri","nibm","hadapsar"] },
];
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

export function demoData() {
  const r = rng(20261010), pick = (a) => a[Math.floor(r() * a.length)];
  const now = Date.now(), H = 3600e3, D = 86400e3;
  const rows = [], stages = {}, amounts = {}, tasks = {}, bookings = [], costs = [];
  for (let i = 0; i < 92; i++) {
    const daysAgo = i < 7 ? 0 : i < 10 ? 1 : Math.floor(Math.pow(r(), 1.1) * 60);
    const hour = r() < 0.38 ? 19 + Math.floor(r() * 4) : 10 + Math.floor(r() * 9);
    const t = new Date(now - daysAgo * D); t.setUTCHours(hour - 5, Math.floor(r() * 60) - 30, 0, 0);
    const started = i < 7 ? now - (35 + i * 95) * 60e3 : Math.min(t.getTime(), now - 40 * 60e3);
    const roll = r();
    const tier = i < 7 ? ["P1","P2","P1","SERVICE","P1","P3","P2"][i] : roll < 0.44 ? "P1" : roll < 0.64 ? "P2" : roll < 0.93 ? "P3" : "SERVICE";
    const area = tier === "P3" && r() < 0.35 ? pick(["Nashik","Talegaon","Lonavala","Mumbai"]) : pick(AREAS);
    const [prop, sq] = pick(PROPS);
    const d = tier === "P1" || tier === "P2" ? DESIGNERS[(i + Math.floor(r() * 4)) % 4] : null;
    const id = `demo-${String(i).padStart(3, "0")}`, deal = tier === "SERVICE" ? null : `dd${i}`, task = `dt${i}`;
    const dur = 140 + Math.floor(r() * 300);
    const disp = { P1: "book_consultation", P2: "designer_review", P3: pick(["not_serviceable","advice_only","timeline_too_short","exploring","dropped_call"]), SERVICE: "existing_client_escalation" }[tier];
    const reasons = { book_consultation: ["In area, in scope, timeline workable, decision-maker engaged"], designer_review: [pick(["Stated budget may be below the studio's range","Single room only","Tenant (needs landlord consent)","Decision-maker not on the call or attending"])], not_serviceable: [`${area} is outside Pune and PCMC`], advice_only: ["Wants advice only; the studio only takes redesign with execution"], timeline_too_short: ["Must be ready in about 3 weeks; minimum is 6. Offer a later start."], exploring: ["Still exploring; no project commitment yet"], dropped_call: ["Call ended before any project details were given; call back"], existing_client_escalation: ["Existing client calling about their project"] }[disp];
    const age = (now - started) / D;
    let stage = null;
    if (deal) {
      if (tier === "P1") stage = age < 2 ? "new_enquiry" : age < 6 ? "consultation_booked" : age < 12 ? pick(["consultation_held","proposal_sent"]) : pick(["won","won","proposal_sent","lost","consultation_held"]);
      else if (tier === "P2") stage = age < 3 ? "needs_review" : pick(["needs_review","consultation_booked","lost","new_enquiry"]);
      else stage = age < 4 ? "follow_up" : pick(["follow_up","lost"]);
      stages[deal] = stage;
      if (stage === "won" || stage === "proposal_sent") amounts[deal] = Math.round((800000 + r() * 600000) / 10000) * 10000;
    }
    const sla = { P1: 2, P2: 24, P3: 72, SERVICE: 0.25 }[tier];
    const processed = started + 90e3;
    const done = age > 1.6;
    tasks[task] = { done, due: i < 7 ? new Date(now + (i * 70 - 110) * 60e3).toISOString() : new Date(processed + sla * H).toISOString() };
    const name = disp === "dropped_call" ? null : NAMES[i % NAMES.length];
    const booked = ["consultation_booked", "consultation_held", "proposal_sent", "won"].includes(stage);
    rows.push({
      id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`, vaani_call_id: id, source: "vaani", status: "done",
      caller_name: name, caller_phone: `+9198${String(2200000 + Math.floor(r() * 7999999)).slice(0, 8)}`,
      tier, disposition: disp, reasons, after_hours: hour >= 19 || hour < 10, duration_sec: dur, pricing_asked: r() < 0.3 ? 1 + Math.floor(r() * 2) : 0,
      booking_status: booked ? "confirmed" : null, designer_id: d?.id ?? null, assigned_owner_id: null,
      hubspot_contact_id: `dc${i}`, hubspot_deal_id: deal, hubspot_task_id: task,
      created_at: new Date(started).toISOString(), started_at: new Date(started).toISOString(), processed_at: new Date(processed).toISOString(),
      recording_url: null,
      extraction: disp === "dropped_call" ? {} : { location: area, property_type: prop, carpet_sqft: sq, scope_summary: pick(SCOPES), deadline_text: pick(["By March","Before Diwali next year","In 4 months","Flexible","By January"]), decision_maker: pick(["Caller and spouse","Caller","Parents, both attending"]), referral_source: pick(SOURCES), missing_information: r() < 0.5 ? ["budget"] : [] },
      summary: name ? `${name.split(" ")[0]} wants interiors for a ${prop} in ${area}.` : "Call dropped before details were given",
      handoff_note: name ? `${tier} · ${disp.replace(/_/g, " ")}\n${name}\n\n${prop}, about ${sq} sq ft in ${area}. ${pick(SCOPES)}.\nLead with: timeline and who decides.` : null,
    });
    if (booked && d) {
      const slot = stage === "consultation_booked" ? now + (1 + Math.floor(r() * 6)) * D : started + (2 + Math.floor(r() * 3)) * D;
      const s = new Date(slot); s.setUTCHours(4 + Math.floor(r() * 8), r() < 0.5 ? 0 : 30, 0, 0);
      bookings.push({ id: `b${i}`, call_id: rows[rows.length - 1].id, designer_id: d.id, slot_start: s.toISOString(), status: "confirmed", caller_name: name, location: area, kind: r() < 0.6 ? "Site visit" : "Studio" });
    }
    costs.push({ vendor: "vaani", source: "actual", amount_inr: (dur / 60) * 5.65, units: dur, unit: "seconds", created_at: new Date(started).toISOString() });
    costs.push({ vendor: "gemini", source: "estimated", amount_inr: 0.35 + r() * 0.3, units: 2600 + Math.floor(r() * 1800), unit: "tokens", created_at: new Date(started).toISOString() });
  }
  const rules = { sla_hours: { P1: 2, P2: 24, P3: 72, SERVICE: 0.25 }, gross_margin_pct: 0.32, front_desk_minutes_per_call: 4.9,
    fixed_costs_monthly: [{ name: "Vaani platform", inr: 4999 }, { name: "HubSpot (free plan)", inr: 0 }, { name: "Supabase and Vercel (free tiers)", inr: 0 }] };
  return { rows, stages, amounts, tasks, bookings, costs, designers: DESIGNERS, rules };
}
