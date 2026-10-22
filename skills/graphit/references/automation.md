# Running Graphit unattended

Load this when Graphit must run with no person signed in: CI, cron, a cloud routine, or any environment with no browser login. It covers the credential only. Setting up a scheduled routine itself is a separate reference.

## The credential: GRAPHIT_TOKEN

An unattended run authenticates with a personal access token in the `GRAPHIT_TOKEN` environment variable. Every command then sends that token instead of a login; `graphit auth login` is never needed there. The token acts as the user who created it, narrowed to the scope chosen at creation, and it never exceeds that user's current access. Commands call `https://api.graphit-app.com`, so a network allowlist must include that host. With `GRAPHIT_AUTH=proxy` instead, the CLI sends no token: the environment's credential proxy (a Claude Code network secret) adds it, and the session never holds it.

Create it once, with a login, preferably as a dedicated bot user whose own access is exactly what the automation needs (a person leaving then breaks nothing, and the audit trail names the bot):

1. `graphit token scope-template > scope.json` writes the creator's current access as a token scope.
2. Delete from scope.json everything the automation does not need: domains, write grants, the private sandbox, dashboard reach.
3. `graphit token create --name <recognizable name> --scope-file scope.json --expires 90d | <destination>` (below). The token is its only stdout line, printed once, so never run it without that pipe; the stderr note gives its id.

## Explaining it to the user

Say it in plain words, for example: "A token is a password for this one job. It lets the job act as you in Graphit, only within what we chose, until it expires or you cancel it. Nobody needs to see it, me included: it goes from the command to your clipboard, and from there into one place, the settings of the environment that runs the job. Never paste it into this chat, a file or a message. If it ever lands here, tell me and we'll cancel it and make a new one."

## Handing it over without seeing it

Never put the token in a prompt, a chat message, a file in the repository or a command-line argument. It belongs in the environment's secret store only. Its value must never reach this conversation, so run `token create` only with stdout piped where nobody reads it:

- into a secret store: `... --expires 90d | gh secret set GRAPHIT_TOKEN`;
- into a web form, through the clipboard: `... | pbcopy` on macOS, `| clip` on Windows, `| xclip -selection clipboard` on Linux. The user pastes it with Cmd+V or Ctrl+V. Never read the clipboard back, and once the user says it is pasted, overwrite it with an empty value through the same command (`printf '' | pbcopy`, PowerShell `Set-Clipboard -Value $null`, `printf '' | xclip -selection clipboard`), so a later paste into the chat cannot carry it. Clipboard history or sync (Windows Win+V, a clipboard manager, Universal Clipboard) keeps a copy anyway: when one is on, prefer a secret-store pipe or the user's own terminal.

If the pipe fails, that token is lost: revoke it and create another. Where no clipboard command works, the user runs the command in their own terminal, not in this chat or a `!` command. Never echo, log or repeat a token.

If a token's value appears in this conversation, pasted or printed, it is leaked. Say so, and never use or repeat it. Recommend revoking it now (`graphit token revoke <id>`, the id from `graphit token list`) and making a replacement the same way; if the list shows it was used (`last_used_at`), say what stops working and let the user pick the order.

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

- `graphit auth status` under a token shows the token's id, name, expiry, last use and scope, with `auth_method` `access_token` (or `proxy`). It is the sign-in check for a token run: `graphit plugin status` shows only that a token is set (`auth.auth_method`), not that it works. Never answer a token run with `graphit auth login`. `graphit auth logout` refuses: unset `GRAPHIT_TOKEN` to stop using it here.
- `graphit token list` (with a login) warns about tokens expiring within 7 days. An expired token answers 401 `token_expired`: create a replacement and update the secret.
- `graphit token revoke <id>` stops a token at its next request; `--all --yes` revokes every token the user owns. A revoked token answers 401 `token_revoked`.
- An empty or malformed `GRAPHIT_TOKEN` stops the command with an error instead of falling back to a login: fix the secret.
