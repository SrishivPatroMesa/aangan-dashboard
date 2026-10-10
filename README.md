# Aangan lead desk

The studio's dashboard for phone leads: who to call next, every lead and its HubSpot stage, team load, costs and ROI, a recovery queue, and system health.

- Reads Supabase (call log) and HubSpot (stages, tasks, amounts) on the server; nothing secret reaches the browser.
- Protected by a username and password (DASHBOARD_USER / DASHBOARD_PASSWORD).
- Local preview with sample data: `MOCK_DATA=1 npm run dev`.

Pages: Today, Leads (views: needs a call, new, P1, P2, P3, client issues, overdue, unassigned, booked, won and lost), lead record, Team, Costs and ROI, Recovery, System.
