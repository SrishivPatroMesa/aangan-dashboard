// Local preview data only (MOCK_DATA=1). Never used in production.
const now = Date.now(), h = 3600e3;
const mk = (i, o) => ({
  id: `00000000-0000-0000-0000-${String(i).padStart(12, "0")}`, vaani_call_id: `mock-${i}`, source: "vaani", status: "done",
  caller_phone: `+9198220${String(10000 + i)}`, after_hours: i % 3 === 0, duration_sec: 180 + i * 17, pricing_asked: i % 4 === 0 ? 1 : 0,
  created_at: new Date(now - i * 7 * h).toISOString(), started_at: new Date(now - i * 7 * h).toISOString(),
  processed_at: new Date(now - i * 7 * h + 60e3).toISOString(), booking_status: null, designer_id: null, hubspot_deal_id: `90${i}`, hubspot_task_id: `80${i}`, hubspot_contact_id: `70${i}`,
  ...o,
});
export const MOCK = {
  calls: [
    mk(1, { caller_name: "Kavya Iyer", tier: "P1", disposition: "book_consultation", reasons: ["In area, in scope, timeline workable"], extraction: { location: "Baner", property_type: "2BHK apartment", carpet_sqft: 950, scope_summary: "Full interiors", deadline_text: "By March", missing_information: ["budget", "who decides"] }, designer_id: "d1", summary: "2BHK in Baner, full interiors by March; wants a weekend site visit.", handoff_note: "P1 · book consultation · after hours\nKavya Iyer · +919822010001\n\nFull interiors for a 950 sq ft 2BHK in Baner, done by March.\nAsk on callback: budget, who decides" }),
    mk(2, { caller_name: "Rohan Deshmukh", tier: "P1", disposition: "book_consultation", reasons: ["Personal referral lifts this to P1", "Single room only"], extraction: { location: "Aundh", property_type: "3BHK", scope_summary: "Master bedroom", referral_source: "Friend of Nikhil" }, designer_id: "d2", booking_status: "confirmed" }),
    mk(3, { caller_name: "Meera Kulkarni", tier: "P2", disposition: "designer_review", reasons: ["Stated budget may be below the studio's range"], extraction: { location: "Kharadi", property_type: "1BHK", carpet_sqft: 550, scope_summary: "Kitchen and bedroom" }, designer_id: "d3" }),
    mk(4, { caller_name: null, tier: "P3", disposition: "dropped_call", reasons: ["Call ended before any project details were given"], extraction: {} }),
    mk(5, { caller_name: "Sheetal Deshpande", tier: "SERVICE", disposition: "existing_client_escalation", reasons: ["Existing client calling about their project"], extraction: { location: "Viman Nagar" }, hubspot_deal_id: null }),
    mk(6, { caller_name: "Anand Sharma", tier: "P1", disposition: "book_consultation", reasons: ["In area, in scope"], extraction: { location: "Kalyani Nagar", property_type: "Villa", carpet_sqft: 5500, scope_summary: "Full villa" }, designer_id: "d1" }),
    mk(7, { caller_name: "Suresh Patil", tier: "P3", disposition: "not_serviceable", reasons: ["Nashik is outside Pune and PCMC"], extraction: { location: "Nashik", scope_summary: "Home office" } }),
    mk(8, { caller_name: "Pooja Rao", tier: "P2", disposition: "designer_review", reasons: ["Tenant (needs landlord consent)"], extraction: { location: "Baner", property_type: "2BHK rented" }, designer_id: "d4" }),
    mk(9, { caller_name: "Ritu Kapoor", tier: "P1", disposition: "book_consultation", reasons: ["In area, in scope"], extraction: { location: "Pimple Saudagar", property_type: "3BHK", carpet_sqft: 1050 }, designer_id: "d2" }),
    mk(10, { caller_name: "Kabir Mehta", tier: "P3", disposition: "not_serviceable", reasons: ["Restaurants are out of scope"], extraction: { location: "Koregaon Park", property_type: "Restaurant" } }),
    mk(11, { caller_name: "Nisha Joshi", tier: null, status: "waiting_credentials", waiting_on: "calendly_token", processed_at: null }),
  ],
  designers: [
    { id: "d1", name: "Riya Shah", role: "designer", active: true, areas: ["baner", "aundh"] },
    { id: "d2", name: "Arjun Nair", role: "designer", active: true, areas: ["kalyani", "viman"] },
    { id: "d3", name: "Isha Patil", role: "designer", active: true, areas: [] },
    { id: "d4", name: "Dev Kulkarni", role: "designer", active: true, areas: [] },
  ],
  rules: { sla_hours: { P1: 2, P2: 24, P3: 72, SERVICE: 0.25 }, default_owner_hubspot_id: "1", gross_margin_pct: null, front_desk_minutes_per_call: 4.9 },
  costs: [{ vendor: "vaani", source: "actual", amount_inr: 412, units: 2400, unit: "seconds" }, { vendor: "gemini", source: "unavailable", amount_inr: null, units: 48000, unit: "tokens" }],
  stages: { "901": "new_enquiry", "902": "consultation_booked", "903": "needs_review", "906": "consultation_held", "909": "won" },
  amounts: { "909": 1150000 },
  tasks: { "801": { done: false, due: new Date(now + 0.7 * h).toISOString() }, "803": { done: false, due: new Date(now - 3 * h).toISOString() }, "806": { done: false, due: new Date(now + 5 * h).toISOString() }, "805": { done: false, due: new Date(now - 0.5 * h).toISOString() }, "808": { done: false, due: new Date(now + 20 * h).toISOString() }, "804": { done: false, due: new Date(now + 40 * h).toISOString() }, "807": { done: true, due: null }, "810": { done: true, due: null }, "802": { done: true, due: null }, "809": { done: false, due: new Date(now + 1.5 * h).toISOString() } },
};
