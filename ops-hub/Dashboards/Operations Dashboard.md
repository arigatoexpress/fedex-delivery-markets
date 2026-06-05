---
type: dashboard
title: Operations Dashboard
updated: 2026-06-04
---

# 📊 Operations Dashboard

> [!tip] First time? The tables below are empty/look like code until you enable
> **Dataview** once → [[Enable the Dashboards (Dataview)]]. Then they fill in and
> stay current automatically.

---

## 🟢 At a glance

| | |
|---|---|
| **App status** | Paper-only prototype · safe for local demo |
| **Where it runs** | `http://127.0.0.1:5178` (dev) · `http://127.0.0.1:4747` (build) |
| **Real money / data?** | **No** — see [[Safety & What This Is NOT]] |
| **Demo numbers** | [[Demo Tracking Numbers]] |
| **Owners** | [[Roles & Owners]] |

---

## 🗒️ Recent demo sessions

```dataview
TABLE WITHOUT ID
  file.link AS "Session",
  date AS "Date",
  presenter AS "Presenter",
  result AS "Result"
FROM "Logs"
WHERE type = "demo-session"
SORT date DESC
LIMIT 15
```

**Totals**

```dataview
TABLE WITHOUT ID
  length(rows) AS "Demos logged",
  length(filter(rows, (r) => r.result = "success")) AS "✅ Clean",
  length(filter(rows, (r) => r.result = "issues")) AS "⚠️ Issues",
  length(filter(rows, (r) => r.result = "incident")) AS "🚨 Incidents"
FROM "Logs"
WHERE type = "demo-session"
GROUP BY true
```

---

## ❓ Open decisions & questions

```dataview
TABLE WITHOUT ID
  file.link AS "Question",
  owner AS "Owner",
  date AS "Opened"
FROM "Decisions"
WHERE type = "decision" AND status = "open"
SORT date ASC
```

> Add a new one with the [[Templates/Decision Entry|Decision Entry]] template, or
> jump to [[Decisions & Open Questions]].

---

## 🔗 Quick links
[[00 — START HERE]] · [[Run a Demo (step by step)]] · [[Daily Demo Checklist]] ·
[[Troubleshooting]] · [[Incident & Escalation]] · [[System Overview.canvas|🗺️ System map]]
