# First Run: The Scan and the Overview

Load this from first-run.md when a new org has just connected its data, or an existing org has connectors but no data sources. Goal: the first thing of value the user gets, a short picture of what their data holds. Example wording is illustrative.

## Scan

Confirm the connection, scan and give the overview in one run, with no question in between. Before the scan, one line on what it reads and why; nothing else until the overview.

- Names only: `graphit metadata tables` and `metadata columns`.
- At most one small live query for the main table's row count and date range, run with `graphit query --warehouse` and a specific `--adhoc-reason` (12+ characters). Never a full-table scan. first-run.md says why this read counts as confirmed.
- A file: its upload is the scan, with no live query. An existing org with connectors: names only, no live query.

## Overview

The overview is your reply after the scan: written out in full, to the user, in the conversation. A status line ("connected, scan done"), a recap or a host's end-of-turn summary box is not the overview and never replaces it. Saying you gave one is not giving one. It leads the message and always carries all four parts:

- One line: what was connected and what you read.
- A few areas, about three bullets: group the tables by what they describe, name the main tables rather than their columns, and say how the areas join.
- The size and the period you measured.
- Two things worth noticing, the strongest only. One is better than a weak second.

Aim for about 120 words. The budget trims wording, never a part: when it is tight, shorten the sentences and keep all four.

With many tables or schemas, name the areas and main tables only, and offer the full map on request.

End with one question and nothing that competes with it. In a new org, after a warehouse, that is the definitions ask, first-run.md's next step, as its own short message after the overview, never in place of it; otherwise it is the start line. Example questions the data can answer belong to the start line, not here.

## When a check fails

The overview must read well whether or not a query failed, so for the scan this replaces reporting.md's failure report.

- Give the overview from what you did read. A failed check costs one plain line at most, saying what you could not measure, such as size and period.
- Retry a retryable error once, without narrating it.
- Never show a connection id, an endpoint path, an error code or a request id. Keep them for a bug report, if they ask for one.
- Never point them to Graphit support for an error marked retryable or for a single failed query. If nothing could be read at all, say so plainly and recheck the connection with them (connect-warehouse.md).
