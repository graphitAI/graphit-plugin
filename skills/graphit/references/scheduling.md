# Running Graphit on a Schedule

Load when the user wants something to happen on a schedule: every day, every Monday, after a refresh, "keep this updated". It picks the mechanism; the user's analysis stays theirs.

## Pick the mechanism, in one sentence

| The user wants | Use | Credential |
|---|---|---|
| A dashboard delivered on a schedule, optionally with commentary | A scheduled report (scheduled-reports.md) | The user's own login |
| Multi-step agent work on a schedule, or results written back into Graphit | A Claude Code routine running the Graphit skill (routines.md) | A scoped access token (automation.md) |
| Both: the agent writes, people receive it | A routine, then a scheduled report on the dashboard it updates, sent after it | A token for the routine; the user's login for the report |
| The same on Codex | A Codex desktop scheduled task on the user's machine; there is no cloud option | The user's normal login |

Prefer a report whenever it does the job: it needs no token, no cloud environment and no setup. Say the choice and why in one sentence, then continue; ask only if two rows fit equally.

- An access token cannot create, read or send reports. The user creates the report with their own login, even when a routine feeds the dashboard.
- A report renders the dashboard as it is when it runs, so schedule it after the routine, with a buffer, in the same timezone.

## In the app

A routine is set up from a coding agent (Claude Code), not from this chat. When a routine fits, say so in one sentence, offer the report half here if it applies, and tell the user to ask their coding agent to "set up a Graphit routine" with the same request.
