# Data Sources a Routine Writes

Load when a routine writes results back into Graphit: findings, rankings, a daily summary that people read on a dashboard. Create the source once, interactively; each run then replaces its rows.

## Create once

- Choose a fixed column set up front, for example `date, rank, item, metric, value, change, compared_to`. It never changes afterwards.
- Seed it with one real result, each column holding a value of its real type in the text format every run will write: a rate as `0.004375`, never `0` (that makes the column an integer); a time as `YYYY-MM-DD HH:MM:SS`. Check the inferred types once with a `typeof()` query. A run that writes another type changes the schema, and `ds re-upload` refuses it.
- Create the source from that seed file in a shared domain the dashboard's viewers read: `ds create --file seed.csv --domain <SHARED_KEY>`. Never the private sandbox, even though a token can write it: only its owner can read a private source, so every other viewer sees the block empty. Suggest a dedicated domain for agent output where the org can create one, so the token writes nowhere else.
- Add a dashboard block bound to the source that shows the latest date's rows by rank, with that date visible.

## Each run

1. Read the current rows with `graphit query` on the source into a file (`> "$TMPDIR/history.json"`), with `--limit 50000` (the default is 50), each column selected in its pinned format (for example `strftime(run_at, '%Y-%m-%d %H:%M:%S')`), and an `--adhoc-reason` written into the routine prompt at setup (the source is the routine's own output and has no governed metrics), so the ad-hoc gate cannot stop the run. Stop if the file says `"truncated": true`.
2. Add this run's rows, replacing any rows for the same date, and keep a bounded history (for example the last 90 days).
3. Write the full file with the same columns, each in its pinned format, and `ds re-upload` it.

The same columns mean a re-upload never pauses a source other things depend on. A failed re-upload leaves the previous version serving. The dashboard shows the new rows on its next load.

## Least privilege

The routine's token needs ds-write only on that domain, read on the sources the analysis uses, and reach to that dashboard.
