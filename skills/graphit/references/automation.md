# Running Graphit unattended

Load this when Graphit must run with no person signed in: CI, cron, a cloud routine, or any environment with no browser login. It covers the credential only. Setting up a scheduled routine itself is a separate reference.

## The credential: GRAPHIT_TOKEN

An unattended run authenticates with a personal access token in the `GRAPHIT_TOKEN` environment variable. Every command then sends that token instead of a login; `graphit auth login` is never needed there. The token acts as the user who created it, narrowed to the scope chosen at creation, and it never exceeds that user's current access.

Create it once, with a login, preferably as a dedicated bot user whose own access is exactly what the automation needs (a person leaving then breaks nothing, and the audit trail names the bot):

1. `graphit token scope-template > scope.json` writes the creator's current access as a token scope.
2. Delete from scope.json everything the automation does not need: domains, write grants, the private sandbox, dashboard reach.
3. `graphit token create --name <recognizable name> --scope-file scope.json --expires 90d` prints the token once, as the only stdout line.

Never put the token in a prompt, a chat message, a file in the repository or a command-line argument. It belongs in the environment's secret store only. Never run `token create` and read its output yourself: the token would enter this conversation. Ask the user to run it, or pipe stdout straight into the secret store (for example `... --expires 90d | gh secret set GRAPHIT_TOKEN`), and never echo, log or repeat it.

## What a token can and cannot do

It can run the data and dashboard work the scope allows: queries, data-source refresh and re-upload, KB reads and writes, dashboard reads, edits and `dashboard export` (the export shows only what the token can read).

It cannot, by design:
- run admin operations: `governance audit`, connector management, team administration;
- manage tokens: `token create`, `list` and `revoke` need a login;
- use `graphit report` at all, reads included. The routine refreshes data and updates dashboards; the person creates the scheduled report on that dashboard with their own login;
- fetch a graph's staged image (`dashboard get-entity --image` prints a note instead); `dashboard export` works instead;
- run `kb repo verify` or `apply`, which need a `gkb.` machine token from `kb repo token mint`.

A refusal says "access tokens cannot call this route; it needs an interactive login" (403 `token_route_not_allowed`). Do not retry it or look for another credential; report that this step needs the person.

## Status, expiry and revocation

- `graphit auth status` under a token shows the token's id, name, expiry, last use and scope. `graphit auth logout` refuses: unset `GRAPHIT_TOKEN` to stop using it here.
- `graphit token list` (with a login) warns about tokens expiring within 7 days. An expired token answers 401 `token_expired`: create a replacement and update the secret.
- `graphit token revoke <id>` stops a token at its next request; `--all --yes` revokes every token the user owns. A revoked token answers 401 `token_revoked`.
- An empty or malformed `GRAPHIT_TOKEN` stops the command with an error instead of falling back to a login: fix the secret.
