# First Run: A First Dashboard

Load this from first-run.md when the user wants a dashboard or something to keep watching, or when a quick answer or a metric continues into one. Goal: a working dashboard they understand, built only after you agree what it is for. Example wording is illustrative.

## Agree what to watch

Ask what it should help them watch and propose a layout (the KPIs, trends, breakdowns, any before-and-after view) before building. Use a fitting existing data source if one covers it. Otherwise say a new one comes first, with its estimated build time (data-sources.md), and read the shape with `graphit metadata columns` before writing its SQL (onboarding.md, step 3).

Before building, say that a private data source refreshes when they ask you. A schedule (nightly, or as often as every 15 minutes) needs its data source in a shared group, which comes with sharing.

## Where it lives

Ask only when their words don't already say who it is for ("for the product team", "just for me"), as a closed choice: My Dashboards (private, share it when it is ready), Org (everyone can view), or a team. With no team yet and an owner or admin in front of you, offer to create one and add people by email once they are org members (others join from the Graphit web app first). A shared choice loads the Share workflow and its checks.

## Build, narrated

Build privately unless they chose otherwise, following the Build workflow and dashboard-create.md. Say what you are building and show sections as they appear; no approval round per chart. Verify real data and rendering before calling it done, then give its name and link.

## First-dashboard tour

On the first dashboard only, tell them what they get with it:
- each graph's menu shows its metric, the SQL, the data source and the current result;
- the dashboard menu shares it with view or edit rights, schedules an email or Slack report, exports, and keeps version history;
- opening it reads the refreshed data source, not the warehouse. Explain that first; then you can call it Graphit's Data Caching Layer.

Then go to the hand-over in first-run.md.
