// The desktop card's one sidebar, Query details: Results, SQL, Lineage and KB
// as tabs, so every card opens the same place from one Details button. The
// Results, SQL and Lineage tabs draw the panes the card used to open one by one
// (register.tsx draws them and hands the body in); the KB tab lists the query's
// metrics, dimensions and rules, one line each, a click opening a row in place.
// Pure: register.tsx reads the state and supplies the actions.

import type { Ui } from './card'
import { KIND_LABEL, capitalize, cell, clean, own } from './result'
import type { DetailsTab, DetailsView, KbDef, KbSelection } from './state'

export type DetailsActions = {
  setTab: (tab: DetailsTab) => unknown
  setSqlKind: (kind: 'base' | 'runtime') => unknown
  // Open or close one KB tab row: `${kind}:${name}`, or `rule:${i}`.
  toggle: (key: string) => unknown
  copy: (text: string) => unknown
}

const TABS: Array<{ id: DetailsTab; label: string }> = [
  { id: 'results', label: 'Results' },
  { id: 'sql', label: 'SQL' },
  { id: 'lineage', label: 'Lineage' },
  { id: 'kb', label: 'KB' },
]

export function drawDetailsPane(ui: Ui, d: DetailsView | null, body: unknown, defs: Record<string, KbDef>, act: DetailsActions): unknown {
  const { Box, Text, Button } = ui
  if (!d) return <Text dimColor>Press Details on a query result.</Text>
  const kbCount = d.kb.length + d.rules.length
  return (
    <Box flexDirection="column" gap={1}>
      <Box gap={1} paddingX={1} alignItems="center">
        {TABS.map(t => (
          <Button
            key={`dt-tab-${t.id}`}
            label={t.id === 'kb' ? `KB (${kbCount})` : t.label}
            variant={d.tab === t.id ? 'primary' : 'secondary'}
            onPress={() => act.setTab(t.id)}
          />
        ))}
      </Box>
      {d.tab === 'kb' ? drawKbTab(ui, d, defs, act) : body}
      {/* Which SQL is shown, under the SQL it switches. */}
      {d.tab === 'sql' && d.sql.base && d.sql.runtime ? (
        <Box gap={1} paddingX={1} alignItems="center">
          <Button key="dt-sql-base" label="As written" variant={d.sql.kind === 'base' ? 'primary' : 'secondary'} onPress={() => act.setSqlKind('base')} />
          <Button key="dt-sql-run" label="As run" variant={d.sql.kind === 'runtime' ? 'primary' : 'secondary'} onPress={() => act.setSqlKind('runtime')} />
        </Box>
      ) : null}
    </Box>
  )
}

// A dimension's qualified name ("platform_activity_ds_row__event_month") reads
// as its own last part; the entity prefix only matters to the compiler.
export function shortName(name: string): string {
  const at = name.lastIndexOf('__')
  return at >= 0 && at < name.length - 2 ? name.slice(at + 2) : name
}

// HUMAN_ENGAGEMENT_ONLY -> Human engagement only.
export function ruleName(name: string): string {
  return /^[A-Z0-9_]+$/.test(name) ? capitalize(name.toLowerCase().replace(/_/g, ' ')) : name
}

// A rule's explanation without the CLI hint at its end; no added clause the
// server redacted to '?' placeholders.
function ruleText(lines: string[]): string[] {
  return lines
    .map(line => line.replace(/\s*Read the full rule with:.*$/, '').trim())
    .filter(line => line && !/'\?'/.test(line))
}

// The first sentence, for a row's one line.
function firstSentence(text: string): string {
  const m = /^(.+?[.!?])(\s|$)/.exec(text)
  return (m ? m[1] : text).replace(/[.]$/, '')
}

// An open row's panel: a soft grey fill and a hairline edge.
const PANEL_FILL = '#F5F5F7'
const PANEL_BORDER = '#E5E5EA'

// Kinds in the order a reader meets them, each its own section.
const SECTIONS: Array<{ kind: string; title: string }> = [
  { kind: 'Metric', title: 'METRICS' },
  { kind: 'Measure', title: 'MEASURES' },
  { kind: 'Dimension', title: 'DIMENSIONS' },
]

// One section per kind, then the rules: a row is the name and one line of
// what it is; pressing it opens the detail under it.
function drawKbTab(ui: Ui, d: DetailsView, defs: Record<string, KbDef>, act: DetailsActions): unknown {
  const { Box, Text, Button } = ui
  const kinds = [...SECTIONS, ...[...new Set(d.kb.map(x => x.kind))].filter(k => !SECTIONS.some(s => s.kind === k)).map(k => ({ kind: k, title: `${k.toUpperCase()}S` }))]

  // An open row drops its one line: the panel under it says it in full.
  const row = (key: string, isOpen: boolean, label: string, line: string) => (
    <Box key={`${key}-row`} gap={2} alignItems="center">
      <Box minWidth={26} alignItems="center">
        <Button key={`dt-kb-${key}`} label={`${isOpen ? '▾' : '▸'} ${label}`} plain onPress={() => act.toggle(key)} />
      </Box>
      {isOpen ? null : (
        <Text dimColor wrap="truncate-end">
          {line}
        </Text>
      )}
    </Box>
  )
  // What an open row shows, set apart on a soft panel with room inside.
  const panel = (key: string, children: unknown) => (
    <Box
      key={key}
      flexDirection="column"
      gap={1}
      marginLeft={2}
      marginTop={1}
      marginBottom={1}
      paddingX={2}
      paddingY={1}
      borderStyle="round"
      borderColor={PANEL_BORDER}
      backgroundColor={PANEL_FILL}
    >
      {children}
    </Box>
  )
  const fact = (key: string, label: string, value: string, code = false) => (
    <Box key={key} gap={2}>
      <Box minWidth={10}>
        <Text dimColor>{label}</Text>
      </Box>
      {code ? <Text bold>{value}</Text> : <Text>{value}</Text>}
    </Box>
  )

  const asset = (x: KbSelection, i: number) => {
    const key = `${x.kind}:${x.name}`
    const isOpen = d.open.includes(key)
    const def = defs[key]
    const desc = def?.status === 'ok' && def.description ? clean(def.description) : ''
    const line = desc ? firstSentence(desc) : def?.status === 'loading' ? 'Loading…' : x.expansion ? clean(x.expansion) : ''
    const reference = `{{ ${x.kind}('${x.name}') }}`
    const facts: unknown[] = []
    if (isOpen) {
      if (def?.status === 'ok' && def.type) facts.push(fact(`${key}-type`, 'Type', own(KIND_LABEL, def.type) ?? def.type))
      for (const [pi, part] of (def?.parts ?? []).entries()) facts.push(fact(`${key}-p${pi}`, capitalize(part.label), cell(part.value), true))
      if (x.expansion) facts.push(fact(`${key}-sql`, 'Compiles to', clean(x.expansion), true))
      const where = [def?.group, def?.lifecycle].filter(Boolean).join(' · ')
      if (where) facts.push(fact(`${key}-grp`, 'Group', where))
      facts.push(fact(`${key}-ref`, 'In query', `${reference}${x.alias ? ` AS ${x.alias}` : ''}`, true))
    }
    return (
      <Box key={`dk-${i}`} flexDirection="column">
        {row(key, isOpen, shortName(x.name), line)}
        {isOpen
          ? panel(`dk-p-${i}`, [
              desc ? <Text key={`${key}-desc`}>{desc}</Text> : null,
              <Box key={`${key}-facts`} flexDirection="column">
                {facts}
              </Box>,
              <Box key={`${key}-btns`} gap={1}>
                <Button key={`dt-copy-ref-${key}`} label="Copy reference" variant="secondary" onPress={() => act.copy(reference)} />
                {x.expansion ? <Button key={`dt-copy-sql-${key}`} label="Copy SQL" variant="secondary" onPress={() => act.copy(clean(x.expansion))} /> : null}
              </Box>,
            ])
          : null}
      </Box>
    )
  }

  const rule = (r: DetailsView['rules'][number], i: number) => {
    const key = `rule:${i}`
    const isOpen = d.open.includes(key)
    const text = ruleText(r.lines)
    return (
      <Box key={`dr-${i}`} flexDirection="column">
        {row(key, isOpen, ruleName(r.title), text[0] ? firstSentence(text[0]) : r.badge.toLowerCase())}
        {isOpen
          ? panel(`dr-p-${i}`, [
              ...text.map((line, j) => <Text key={`dr-${i}-${j}`}>{line}</Text>),
              fact(`dr-${i}-name`, 'Rule', r.title, true),
            ])
          : null}
      </Box>
    )
  }

  const section = (key: string, title: string, children: unknown[]) =>
    children.length ? (
      <Box key={key} flexDirection="column">
        <Text dimColor bold>{`${title} · ${children.length}`}</Text>
        {children}
      </Box>
    ) : null

  return (
    <Box flexDirection="column" gap={1} paddingX={1}>
      {kbCount(d) === 0 ? <Text dimColor>This query uses no KB assets and no rules changed it.</Text> : null}
      {kinds.map(s => section(`dks-${s.kind}`, s.title, d.kb.map((x, i) => (x.kind === s.kind ? asset(x, i) : null)).filter(Boolean)))}
      {section('dks-rules', 'RULES', d.rules.map(rule))}
    </Box>
  )
}

function kbCount(d: DetailsView): number {
  return d.kb.length + d.rules.length
}
