<div align="center">

# Graphit CLI

### If you can talk it, you can graph it.

The AI-Native Analytics Platform, in your terminal and your AI coding assistant.<br/>
Connect your AI agents to business facts and rules, and turn their work into trusted insights, live dashboards and reports.

[![npm](https://img.shields.io/npm/v/@graphit/cli?color=4DB6AC&label=%40graphit%2Fcli)](https://www.npmjs.com/package/@graphit/cli)
[![node](https://img.shields.io/badge/node-%E2%89%A518-4DB6AC)](https://nodejs.org)
[![docs](https://img.shields.io/badge/docs-graphit--app.com-222224)](https://graphit-app.com)

</div>

---

`@graphit/cli` exposes the [Graphit](https://graphit-app.com) platform as commands your AI coding assistant - **Claude Code**, **Codex** or **Cursor** - or you can drive directly: explore the governed semantic layer (the "knowledge base"), run governed queries against cached data sources or your live warehouse, and build custom HTML/SVG/CSS dashboards on a bespoke canvas.

It installs as a plugin/skill, so your assistant knows how to reach for Graphit on any question about your business data - even when you never say "Graphit."

## Install

**1. Install the CLI** - the `graphit` binary, needed either way (requires Node.js 18+):

```bash
npm install -g @graphit/cli
graphit auth login
```

**2. Connect it to your AI coding assistant** by installing the Graphit plugin.

Plugin marketplace - **Claude Code**:

```text
/plugin marketplace add graphitAI/graphit-plugin
/plugin install graphit@graphit-plugin
```

Plugin marketplace - **Codex**:

```text
codex plugin marketplace add graphitAI/graphit-plugin
```

**Cursor** - install the Graphit plugin into Cursor's local plugins, then reload Cursor (Developer: Reload Window):

```bash
npx -y @graphit/cli setup --editor cursor
```

Cursor also loads Graphit's Claude Code plugin. If that plugin is on for all projects, setup says so and installs nothing. If it is on for one project only, setup still installs and warns that Graphit loads twice in that project. Update later with `npx -y @graphit/cli setup --editor cursor --update`.

In Cursor (2.6+), query results draw as an interactive card in the chat. The plugin registers a local MCP server, `graphit-view` (`hooks/query-view-app/server.mjs`), that Cursor starts with Node. It makes no network calls of its own: it reads the results the query hook saved under `~/.graphit/query-view/` (pruned after 48 hours) and, for the lineage and KB tabs, runs the same `graphit` commands you would (through `npx -y @graphit/cli@<plugin version>` when `graphit` is not on your PATH).

**VS Code** - `graphit setup --editor vscode --project` writes the skill into the repo's `AGENTS.md`.

Each path installs the Graphit skills so the assistant can drive the CLI on your behalf.

> **Start a new session after installing the plugin.** Claude Code (and Codex) load plugin skills and commands at session start, so the Graphit skill, `/graphit`, and the `graphit` commands are not available in the session you installed from. Open a new session first - otherwise the assistant will not have the skill loaded and will improvise instead of following the guided workflow.

## Authenticate

```bash
graphit auth login      # Open the browser login flow
graphit auth status     # Show the current account and org
graphit auth logout     # Clear stored credentials
```

For unattended runs (CI, scheduled routines), use an access token instead of a browser login. A token can only narrow your own access, and its secret is printed once:

```bash
graphit token scope-template > scope.json             # Your access as a scope; trim it
graphit token create --name nightly-report --scope-file scope.json
export GRAPHIT_TOKEN=...                              # Read from your secret store
```

The CLI talks to `https://api.graphit-app.com` by default. Set `GRAPHIT_API_URL` to point at a different backend.

TLS connections are verified against Node's bundled CA certificates, which already cover the public Graphit API. If you are behind a corporate TLS-inspecting proxy whose root certificate lives only in your operating system's trust store, set `GRAPHIT_USE_SYSTEM_CA=1` to also trust the system store. It is off by default because reading the system store is unnecessary for normal use and can crash under sandboxed agent runtimes (e.g. an editor's command sandbox on macOS, where keychain access is blocked).

## Commands

| Group | What it does |
|-------|--------------|
| `graphit auth` | Log in, check status, log out |
| `graphit status` | Show your effective permissions per domain |
| `graphit kb` | The semantic layer ("knowledge base"): browse it (`tree`, `search`, `get`, `explore`, `family`, `entity`, `usage`), create, update and delete semantic models, metrics, groups, rules and chart templates, apply batch edits, hide sensitive columns, and own the KB from a git repository with `kb repo` |
| `graphit query` | Run a governed SQL query against a cached data source or a live warehouse (Snowflake / BigQuery) |
| `graphit metadata` | Browse warehouse schemas, tables and columns |
| `graphit ds` | Data sources: create from SQL or CSV/Excel, refresh, schedule, edit SQL, verify, see usage and history, delete your own private sources |
| `graphit dashboard` | Custom dashboards: create, read, edit the HTML or a single entity, check, export to PNG/PDF, organize in folders, share, draft and publish, invite partners outside your org, delete |
| `graphit report` | Scheduled reports: a dashboard emailed or posted to Slack on a schedule, optionally with agent commentary |
| `graphit connector` | Connections (Snowflake, BigQuery, Slack, GitHub/Bitbucket): list, add, test. OAuth and GitHub connections are set up in the web app; removal is admin-only in the Sources Hub |
| `graphit governance` | Query governance: conformance status, the audit log, and numeric rollup authorization per data source |
| `graphit team` | Teams a dashboard is shared with: list, create, rename, add members, change roles |
| `graphit token` | Access tokens for unattended runs (`GRAPHIT_TOKEN`) |
| `graphit plugin` | Check plugin, package and skill version health |
| `graphit setup` | Install the Graphit plugin for Cursor or the skill for VS Code, or remove legacy copied skill files |

Run any command with `--help` for its exact flags and subcommands:

```bash
graphit kb create metric --help
graphit dashboard export --help
```

Global `--output <json|table|styled>` controls how results print (defaults to `json`, the machine-readable form agents rely on).

## Why Graphit

- **Governed by default.** Every query passes through a server-side governance gateway. Curated metrics and dimensions resolve through reference syntax (`{{metric:NAME}}`, `{{dim:NAME}}`). A verified rule enforces as soon as it is saved, columns marked hidden come back masked everywhere, and an ad-hoc query that bypasses the governed metrics needs a stated reason.
- **Cached and fast.** Create a data source once and query it in milliseconds instead of hitting the live warehouse on every request.
- **A bespoke canvas, not template tiles.** Dashboards are real, hand-authored HTML, SVG, and CSS. The CLI manages the dashboard document; the rendering runtime resolves live data and wires interactivity (filters, parameters, saved views).
- **Retrieve to predict.** Look up a number, monitor it, diagnose why it moved, or project where it is headed - all through one governed semantic layer.

## Documentation

Full docs, the complete CLI reference, and the dashboard build workflow live at **[graphit-app.com](https://graphit-app.com)**.

## License

UNLICENSED. Copyright Graphit.
