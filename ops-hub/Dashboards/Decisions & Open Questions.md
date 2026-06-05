---
type: dashboard
title: Decisions & Open Questions
updated: 2026-06-04
---

# ❓ Decisions & Open Questions

A running list of what we still need to figure out. Add to it freely — use the
[[Templates/Decision Entry|Decision Entry]] template (or just create a note in the
`Decisions` folder with the right fields).

> [!tip] Tables empty or showing code? Enable **Dataview** once →
> [[Enable the Dashboards (Dataview)]].

---

## 🟠 Open

```dataview
TABLE WITHOUT ID
  file.link AS "Question",
  owner AS "Owner",
  date AS "Opened"
FROM "Decisions"
WHERE type = "decision" AND status = "open"
SORT date ASC
```

## 🟡 Deferred / parked

```dataview
TABLE WITHOUT ID
  file.link AS "Question",
  owner AS "Owner",
  date AS "Opened"
FROM "Decisions"
WHERE type = "decision" AND status = "deferred"
SORT date ASC
```

## ✅ Decided

```dataview
TABLE WITHOUT ID
  file.link AS "Question",
  decision AS "Outcome",
  owner AS "Owner"
FROM "Decisions"
WHERE type = "decision" AND status = "decided"
SORT date DESC
```

---

### How to add a question
1. In Obsidian press the **New note** button (or `Ctrl/Cmd + N`).
2. Apply the [[Templates/Decision Entry|Decision Entry]] template (Insert template).
3. Fill in the question, set `status: open`, and pick an `owner`.
4. Save it in the **Decisions** folder. It appears above automatically.
