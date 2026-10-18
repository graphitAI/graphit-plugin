# First Run: A Quick Answer

Load this from first-run.md when the user answers the start line with a question. Goal: the fastest trustworthy answer, a conversation about what it means, then an offer of what it could become. Nothing gets created unless they choose it. Example wording is illustrative.

## Answer

- **Owner or admin, new org (no data source yet):** answer straight from the warehouse with one small, bounded query: aggregate, use a recent window and a LIMIT, and run it with `graphit query --warehouse --adhoc-reason "<a specific reason, 12+ characters>"` on the first call. A call without a reason is refused and still uses one of the 20 live queries per hour. Say in one line that you are checking it directly on their warehouse and nothing gets created. Don't ask again; first-run.md explains why this counts as confirmed.
- **Existing org:** answer as the Explore workflow does: a fitting saved definition first, then a cached data source, and a live query only when neither covers it and the user confirms.
- **Member (an existing org with a connector), when no definition or cached source covers it:** members can't query the warehouse directly by default. Offer a small private data source for the question, with its estimated build time, and answer from it once they agree. Skip any live check before the build (members can't run one); the build is the check.
- **A file:** answer from its data source (`graphit query --ds`); upload it first (onboarding.md, File) only if it isn't uploaded yet.

In every branch, read the shape with `graphit metadata columns` before writing any SQL, for a query or a data source.

## Say how you got it

With the number, give one plain line on how it was calculated: the table, the columns and filters, the period. The SQL is in the query card; don't paste it unless asked. With no saved definition behind it, say it is your calculation, not the team's definition.

## Discuss before building

Give the finding and your read of it, then stop and talk. Ask the question that would explain it, such as whether something shipped around the date the trend changed.

## Offer a data source, shaped by its purpose

When the answer ran on the warehouse, every follow-up will too. Offer a data source: Graphit keeps an encrypted copy of the result, follow-ups and dashboards read that instead, and it refreshes when they ask (a private one can't run on a schedule). Ask what they would use it for before shaping it, so it isn't built for one question only. Give its estimated build time and the basis for it (data-sources.md).

## What next

Ask what this could become: a kept metric, a dashboard, or nothing for now.

- **A dashboard:** continue in first-run-dashboard.md.
- **A kept metric:** if their words don't say who it is for, ask where it lives, as a closed choice: Private (only them), a new group such as Store (its own access; recommend it to an owner or admin, so everyone gets the same number and they control changes), or Org (everyone). A member keeps it Private; offer to draft a note asking an admin to share it. Org or a group loads the Share workflow and its checks; nothing is shared silently.
- **Nothing:** go to the hand-over in first-run.md.
