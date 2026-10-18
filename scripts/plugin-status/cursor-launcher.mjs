// Feature #1150: the `graphit` launcher for Cursor. Cursor's Run prompt offers a
// command's opening word to allowlist; for `npx -y @graphit/cli@latest ...` that is
// the unsafe `npx -y`, so a user had to type the entry into Settings. A launcher
// named `graphit` beside npx makes the offered word `graphit`: one Always Run click.
//
// Standalone on purpose (Gate 1): a link to the plugin's bin/graphit resolves its
// plugin root to the link's folder, and the Claude Code cache path changes on every
// plugin update. The launcher reads the same latest-version cache the session-start
// hook refreshes and never sets GRAPHIT_PLUGIN_ROOT, so the CLI sees the npx channel.
//
// Written only by an explicit `setup --editor cursor`, never by a hook. It never
// overwrites a file it did not write and removes only files carrying the marker.

import { accessSync, constants, existsSync, lstatSync, readFileSync, realpathSync, unlinkSync, writeFileSync } from "node:fs";
import { delimiter, dirname, isAbsolute, join } from "node:path";

export const LAUNCHER_MARKER = "graphit-launcher v1";

const POSIX_SCRIPT = `#!/bin/sh
# ${LAUNCHER_MARKER}: written by \`graphit setup --editor cursor\`. Runs the newest
# Graphit CLI through npx, so Cursor can allowlist the one word \`graphit\`.
# The version comes from the cache the Graphit session-start hook refreshes; a
# missing or invalid cache falls back to npm's latest tag.
cache="\${GRAPHIT_PLUGIN_DATA:-\${HOME:-}/.graphit}/plugin-status.json"
version=latest
if [ -r "$cache" ]; then
  contents=$(cat "$cache" 2>/dev/null)
  if printf '%s' "$contents" | grep -Eq '"schemaVersion"[[:space:]]*:[[:space:]]*1[,}[:space:]]' \\
     && printf '%s' "$contents" | grep -Fq '"packageName":"@graphit/cli"'; then
    candidate=$(printf '%s' "$contents" | sed -n 's/.*"latestVersion"[[:space:]]*:[[:space:]]*"\\([^"][^"]*\\)".*/\\1/p' | head -n1)
    if printf '%s' "$candidate" | grep -Eq '^[0-9]+\\.[0-9]+\\.[0-9]+(-[0-9A-Za-z.-]+)?$'; then
      version=$candidate
    fi
  fi
fi
# Same as the plugin wrapper: Node's keychain CA lookup crashes in sandboxed shells.
[ -n "\${GRAPHIT_USE_SYSTEM_CA:-}" ] || unset NODE_USE_SYSTEM_CA
exec npx -y "@graphit/cli@$version" "$@"
`;

// No Windows launcher: a .cmd re-parses %* through cmd.exe, so an allowlisted
// `graphit` could run an argument's `&` or `|` as a second, unapproved command
// (security review). Windows keeps the typed npx allowlist entry.
export function launcherName(platform = process.platform) {
  return platform === "win32" ? null : "graphit";
}

export function launcherScript(platform = process.platform) {
  return platform === "win32" ? null : POSIX_SCRIPT;
}

// POSIX: the first PATH folder holding npx - where the user's shell finds npx, it
// finds `graphit` too. Not dirname(execPath): Node resolves it, so on Homebrew it is
// the Cellar folder, which is not on PATH. Falls back to the folder beside Node.
// Windows: none (no launcher there).
export function launcherDir({
  platform = process.platform,
  pathValue = process.env.PATH ?? "",
  execPath = process.execPath,
} = {}) {
  if (platform === "win32") return null;
  const onPath = absolutePathDirs(pathValue).find((dir) => existsSync(join(dir, "npx")));
  if (onPath) return onPath;
  const beside = dirname(execPath);
  return existsSync(join(beside, "npx")) ? beside : null;
}

// Gate 2: a relative entry (".", "bin") resolves against the cwd, so setup would
// write `graphit` into whatever folder it ran in. Only absolute folders count.
function absolutePathDirs(pathValue) {
  return pathValue.split(delimiter).filter((dir) => isAbsolute(dir));
}

function readHead(path) {
  try {
    return readFileSync(path, "utf8").slice(0, 2048);
  } catch {
    return null;
  }
}

// Gate 2: the marker counts only as the header line setup writes, so a file that
// merely mentions it is never treated (or overwritten, or removed) as ours.
const MARKER_HEADER = `#!/bin/sh\n# ${LAUNCHER_MARKER}:`;

export function isOurLauncher(path) {
  return readHead(path)?.startsWith(MARKER_HEADER) ?? false;
}

// An old `npm install -g @graphit/cli` links `graphit` into the package.
function isLegacyGlobal(path) {
  let real = path;
  try {
    real = realpathSync(path);
  } catch {
    // Dangling link: judge by name only.
  }
  return /[/\\]node_modules[/\\]@graphit[/\\]cli[/\\]/.test(real) || /@graphit[/\\]cli/.test(readHead(path) ?? "");
}

// lstat, not existsSync: a dangling link still occupies the name and is not ours.
function exists(path) {
  try {
    lstatSync(path);
    return true;
  } catch {
    return false;
  }
}

// Actions: installed | updated | current | would-install | would-update | legacy-global
// | foreign | unwritable | no-dir | unsupported.
export function installLauncher({ dir, platform = process.platform, dryRun = false } = {}) {
  if (platform === "win32") return { action: "unsupported" };
  if (!dir) return { action: "no-dir" };
  const path = join(dir, launcherName(platform));
  const script = launcherScript(platform);
  if (exists(path)) {
    if (!isOurLauncher(path)) return { action: isLegacyGlobal(path) ? "legacy-global" : "foreign", path };
    if (readFileSync(path, "utf8") === script) return { action: "current", path };
    if (dryRun) return { action: "would-update", path };
    try {
      writeFileSync(path, script, { mode: 0o755 });
      return { action: "updated", path };
    } catch {
      return { action: "unwritable", path, dir };
    }
  }
  try {
    accessSync(dir, constants.W_OK);
  } catch {
    return { action: "unwritable", path, dir };
  }
  if (dryRun) return { action: "would-install", path };
  try {
    // "wx": never replaces a file that appeared since the check above.
    writeFileSync(path, script, { mode: 0o755, flag: "wx" });
    return { action: "installed", path };
  } catch {
    return { action: "unwritable", path, dir };
  }
}

// Actions: removed | would-remove | absent | kept-foreign.
export function removeLauncher({ dir, platform = process.platform, dryRun = false } = {}) {
  if (!dir || platform === "win32") return { action: "absent" };
  const path = join(dir, launcherName(platform));
  if (!exists(path)) return { action: "absent", path };
  if (!isOurLauncher(path)) return { action: "kept-foreign", path };
  if (!dryRun) unlinkSync(path);
  return { action: dryRun ? "would-remove" : "removed", path };
}

// The first `graphit` on PATH, and whether it is our launcher. The Cursor session-start
// hook uses it to name the command form (the Claude Code shadow check uses isOurLauncher).
export function findLauncherOnPath(pathValue = process.env.PATH ?? "", platform = process.platform) {
  if (platform === "win32") return null;
  for (const dir of absolutePathDirs(pathValue)) {
    const candidate = join(dir, "graphit");
    if (existsSync(candidate)) return { path: candidate, ours: isOurLauncher(candidate) };
  }
  return null;
}
