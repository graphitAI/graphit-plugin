# First Run: Setting Up Metrics

Load this from first-run.md when the user wants metrics or definitions ("what is our GMV", "set up our KPIs"). Goal: definitions the whole company can use, each checked against their data before they approve it. Example wording is illustrative.

## Pin down what it means

A question like "what was GMV last week" often can't be answered as asked: the data supports several meanings. If they say a definition already exists (dbt, a doc, their BI tool), ask for it, read it and use it instead of proposing your own. Graphit has no importer, so you write the same definition here (attached-docs.md). Otherwise propose the candidates:

- Name the columns and filters behind each meaning (gross amount, refunds, test purchases).
- Show each one's number for a recent period, so they choose between numbers, not formulas.
  - **Owner or admin, new org:** compute every candidate in one small warehouse query, run with `graphit query --warehouse --adhoc-reason "<a specific reason, 12+ characters>"` on the first call. Say it is running; first-run.md explains why this counts as confirmed.
  - **Existing org:** check the team's definitions first and never create a second, competing one.
  - **Member (an existing org with a connector):** no direct warehouse queries by default, so skip any live check. Offer a small private data source, with its estimated build time, and compute them from it once they agree.
  - In every branch, read the shape with `graphit metadata columns` before writing any SQL.
- Ask which one is theirs. Never pick a meaning for them. Suggest the related metrics most teams track next to it.

## Propose the setup, already calculated

Make one proposal: each definition with its value from their data, the dimensions, any business rule (such as "test purchases never count"), the data source that will feed them (its grain and columns, and its estimated build time), and where they live: for an owner or admin, a new group such as Store that the whole company can use; a member keeps them Private. Offer to show the SQL behind each before saving. Ask what to change.

## Build, publish, answer again

On their go-ahead, create the data source, and save the definitions into the group (kb-structure.md, kb-actions.md) through the Share workflow and its checks. A member keeps everything Private and gets a note to send an admin. Read back what was saved before saying it is live for the company. Then answer the original question again from the approved definition and say what changed.

Next, a dashboard continues in first-run-dashboard.md; otherwise go to the hand-over in first-run.md.
