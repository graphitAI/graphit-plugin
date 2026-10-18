# Setting Up a Graphit Routine

Load when scheduling.md chose a Claude Code routine: Graphit work that runs on a schedule in a cloud session, with nobody signed in. Set it up from the user's local session, step by step; never run the user's task here instead.

## Setup flow

1. **Task.** Restate the job, its schedule (the user's local time next to UTC) and exactly what it writes. Confirm before going on.
2. **Output.** If the routine writes data back, create its output source now, interactively (agent-written-sources.md), and the dashboard block that shows it.
3. **Scope.** Run `graphit token scope-template > scope.json`, then cut it down to the sources the task reads, ds-write only on the domain of each source it writes, and the dashboards it reaches. Show the result.
4. **Token.** Give the user one command to run in a separate terminal: `graphit token create --name <routine name> --scope-file scope.json --expires 90d`. Never run it here, never ask for the token, never read it back: the secret must not enter this conversation (automation.md).
5. **Web steps only the user can do,** as a checklist:
   - put the token in the cloud environment as `GRAPHIT_TOKEN` (or the environment's API-credential proxy for the Graphit host, with `GRAPHIT_AUTH=proxy`);
   - allow the Graphit API host as a network domain;
   - a setup script that installs the plugin: `claude plugin marketplace add omry-graphit/graphit-plugin && claude plugin install graphit@graphit-plugin`;
   - repository access, if the task needs a repository.
6. **Create.** Hand the name, schedule, repository, environment and the routine prompt (below) to Claude Code's `/schedule`. The skill has no routine API of its own.
7. **First run.** Run it once now and read its log through `/schedule`: the auth line, the plugin line and the first result. Fix any failure with the table below before leaving it.
8. **Delivery.** If the routine writes into Graphit, offer a scheduled report on the dashboard it updates, created with the user's own login and sent after the routine (scheduling.md).

## The routine prompt

Wrap the user's task, verbatim, in this contract:

- First run `graphit auth status`. If it does not report `auth_method` `access_token` or `proxy`, stop with one line saying the token is missing.
- Never ask questions; nobody is there to answer.
- On any failure, stop and print the command and its error.
- Make only the writes the task declares.
- End with one line summarizing what changed.

## When a run fails

| The log shows | Fix |
|---|---|
| 401, `token_expired` or `token_revoked` | Create a new token and replace `GRAPHIT_TOKEN` |
| `access tokens cannot call this route` | The step needs a person (admin operations, reports); move it out of the routine |
| A 403 on a write | The token's scope lacks that write; create a token with it |
| `Query blocked` (ad-hoc) | Add an `--adhoc-reason` to that query in the routine prompt: what governance has and why it does not fit |
| Network refused, or `host_not_allowed` | Allow the Graphit API host in the environment's network settings |
| `graphit: command not found` | Use the pinned `npx -y @graphit/cli@<version>` form in the prompt |
| `Graphit plugin: update failed` | Check the setup script, or add a repository `SessionStart` hook that updates the plugin |
