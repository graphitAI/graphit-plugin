# Cursor: approve Graphit once

Load this on Cursor at the first Run/Skip prompt for a Graphit command or the `graphit-view` card, during onboarding, or when the user asks why Cursor keeps asking.

Cursor asks before each command that is not on its allowlist, and its Run prompt offers the command's opening word to allowlist. Tell the user once, in minimum words, before the first Graphit command.

When the Graphit session note says to run `graphit <command>`:

> Cursor will ask before the first Graphit step. Click **Always Run**: it saves `graphit`, which covers every Graphit command. For the query result card, add `graphit-view:*` once in Cursor Settings > Agents > Execution and Approvals > MCP Allowlist; clicking Always Run on the card does not stick in current Cursor versions.
> Graphit commands then run without asking, including ones that change things. I still check with you in chat before deleting anything.

When it says `npx -y @graphit/cli@latest <command>`:

> Cursor will ask before the first Graphit step. Click **Run**, not Always Run: Cursor would save `npx -y`, which allows any package. Then add `npx -y @graphit/cli@latest` once in Cursor Settings > Agents > Execution and Approvals > Command Allowlist. In the same place, add `graphit-view:*` to the MCP Allowlist for the query result card.
> Graphit commands then run without asking, including ones that change things. I still check with you in chat before deleting anything.

To get the one-click path instead, the user runs `npx -y @graphit/cli setup --editor cursor` in a terminal, which adds the `graphit` command, and reloads Cursor.

If the allowlist can't be edited:
- Settings say it comes from `permissions.json`: the user adds the entries to `terminalAllowlist` and `mcpAllowlist` in `~/.cursor/permissions.json`. Never write that file yourself.
- Their team manages it: draft a short message asking the Cursor admin to allow `graphit` (or `npx -y @graphit/cli@latest`) and add a team MCP server row named `graphit-view`.

Run one Graphit command per shell call. Cursor asks again for commands joined with `&&`, `;` or a pipe, even when each one is allowed.

If the user says a query card disappeared: Cursor folds earlier steps into the "Worked for ..." row above its reply. Clicking that row opens the card again.
