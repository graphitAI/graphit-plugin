// Feature #1067: Full results - every row and every column of one query in a
// sidebar that opens as wide as the table: search across the columns, sort by
// a column header, copy as TSV or CSV. The table is a window over the rows: it
// draws only what the pane shows, and register.tsx moves the window on the
// person's wheel (ui.scroll), because the host refuses any drawing past
// 100,000 serialized characters however much of it is on screen. Pure:
// register.tsx keeps the view state and supplies the actions.

import { cell } from './result'
import type { QueryResult } from './result'
import type { ResultsView } from './state'

const MAX_COL_CHARS = 28
// The widest sidebar the view asks for; the person can drag it wider.
const MAX_PANE_COLUMNS = 240
const COL_GAP = 3
// The table's edge, its header and footer fill, and every other row's band.
const TABLE_BORDER = '#E5E5EA'
const HEAD_FILL = '#F5F5F7'
const BAND_FILL = '#FAFAFA'
// The window may spend this many serialized characters of the host's 100,000
// per drawing: a cell costs its box, text, rule, keys and styles (about 280
// measured), a row its own box and the row number on top.
const TREE_CHARS = 60000
const CELL_CHARS = 300
const ROW_CHARS = 400
// Pane rows above and around the table: the details tabs, search, status line,
// gaps, and the table's border and header.
const CHROME_ROWS = 10
// The fewest rows a window shows, however short the pane.
const MIN_WINDOW = 8

type Row = Record<string, unknown>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ui = Record<string, any>

export type ResultsActions = {
  search: (query: string) => unknown
  sortBy: (column: string) => unknown
  // Move the window's first row (the ▲ ▼ buttons).
  setTop: (top: number) => unknown
  copy: (text: string) => unknown
}

// The narrowest a column shrinks to when the table must fit the pane.
const MIN_COL = 6

// Column widths that fit `room` cells: the widest are trimmed first, down to a
// shared ceiling, so a short column never pays for a long one.
export function fitWidths(widths: number[], room: number): number[] {
  if (widths.reduce((a, b) => a + b, 0) <= room) return widths
  let ceiling = Math.max(...widths)
  while (ceiling > MIN_COL && widths.reduce((a, w) => a + Math.min(w, ceiling), 0) > room) ceiling -= 1
  return widths.map(w => Math.min(w, ceiling))
}

// How many rows the table draws at once: what the pane's body has room for,
// within the drawing's character budget.
export function windowRows(bodyRows: number | undefined, columns: number): number {
  const fit = Math.max(MIN_WINDOW, (bodyRows ?? 40) - CHROME_ROWS)
  const budget = Math.max(MIN_WINDOW, Math.floor(TREE_CHARS / (ROW_CHARS + CELL_CHARS * columns)))
  return Math.min(fit, budget)
}

// Where the window's first row lands after a wheel move of `by` rows.
export function nextTop(top: number, by: number, total: number, window: number): number {
  return Math.max(0, Math.min(top + by, Math.max(0, total - window)))
}

// The rows the view shows: matching the search (case-insensitive, any column
// the policy did not mask), then sorted - numbers as numbers, empties last.
export function viewRows(rows: Row[], cols: string[], hidden: Set<string>, view: Pick<ResultsView, 'query' | 'sort' | 'desc'>): Row[] {
  const q = view.query.trim().toLowerCase()
  const seen = cols.filter(c => !hidden.has(c))
  const matched = q ? rows.filter(r => seen.some(c => r[c] != null && String(r[c]).toLowerCase().includes(q))) : rows
  if (!view.sort || !cols.includes(view.sort)) return matched
  const dir = view.desc ? -1 : 1
  const key = view.sort
  return [...matched].sort((a, b) => {
    const x = a[key]
    const y = b[key]
    if (x == null || y == null) return x == null ? (y == null ? 0 : 1) : -1
    if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir
    return String(x).localeCompare(String(y), 'en', { numeric: true }) * dir
  })
}

// The rows as text a spreadsheet pastes: masked columns stay empty.
export function delimited(cols: string[], rows: Row[], hidden: Set<string>, sep: '\t' | ','): string {
  const field = (v: unknown): string => {
    const s = v == null ? '' : String(v)
    if (sep === '\t') return s.replace(/[\t\n\r]/g, ' ')
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [cols.map(field).join(sep), ...rows.map(r => cols.map(c => (hidden.has(c) ? '' : field(r[c]))).join(sep))].join('\n')
}

// Every value exactly as the query returned it: no rounding, no thousands
// separators, no date reshaping. The sidebar is where the raw result is read.
const shownText = (v: unknown): string => (typeof v === 'number' ? String(v) : cell(v))

export const columnsOf = (result: QueryResult): string[] => (result.columns?.length ? result.columns : Object.keys(result.rows[0] ?? {})).map(String)

// The sidebar width that shows every column side by side, sized on the first
// rows: the row number, each column at its widest (capped), the gaps, padding.
export function resultsWidth(result: QueryResult): number {
  const sample = result.rows.slice(0, 200)
  const widths = columnsOf(result).map(c => Math.min(MAX_COL_CHARS, Math.max(c.length + 4, ...sample.map(r => shownText(r[c]).length))))
  const total = widths.reduce((sum, w) => sum + w + COL_GAP, String(result.rows.length).length + COL_GAP + 4)
  return Math.min(MAX_PANE_COLUMNS, Math.max(60, total))
}

// `bodyRows` and `bodyColumns`: the pane body's size in cells, as the surface laid it out.
export function drawResultsPane(
  ui: Ui,
  result: QueryResult | undefined,
  view: ResultsView | null,
  act: ResultsActions,
  bodyRows?: number,
  bodyColumns?: number,
): unknown {
  const { Box, Text, Button, Input } = ui
  if (!result || !view) return <Text dimColor>Open Full results on a query result.</Text>
  const cols = columnsOf(result)
  const hidden = new Set((result.hidden_columns ?? []).map(String))
  const rows = viewRows(result.rows, cols, hidden, view)
  // Only the window is drawn; the wheel moves it (register.tsx's ui.scroll hook).
  const win = windowRows(bodyRows, cols.length)
  const top = nextTop(view.top, 0, rows.length, win)
  const shown = rows.slice(top, top + win)
  const n = (x: number) => x.toLocaleString('en-US')

  const parts = [view.query ? `${n(rows.length)} of ${n(result.rows.length)} rows match` : `${n(result.rows.length)} rows`]
  if (view.sort) parts.push(`sorted by ${view.sort} ${view.desc ? 'high to low' : 'low to high'}`)
  if (rows.length > shown.length) parts.push(`showing ${n(top + 1)}-${n(top + shown.length)}`)
  const numWidth = Math.max(3, String(rows.length).length)
  // Each column as wide as its header or widest shown value (capped), then
  // trimmed so every column fits the pane - a cut value ends in "…" - and
  // right-aligned when every value it holds is a number.
  const natural = cols.map(c => Math.min(MAX_COL_CHARS, Math.max(cell(c).length + 3, ...shown.map(r => shownText(r[c]).length))))
  // The pane less its padding, the table's border and padding, the row number, and a rule and gap per column.
  const room = (bodyColumns ?? 120) - 2 - 4 - numWidth - 1 - 3 * cols.length
  const widths = fitWidths(natural, room)
  const atTop = top === 0
  const atEnd = top + shown.length >= rows.length
  const pager =
    rows.length > shown.length ? (
      <Box key="rs-pager" gap={1} alignItems="center">
        <Button key="rs-up" label="▲" variant="secondary" dimColor={atTop} onPress={() => (atTop ? undefined : act.setTop(nextTop(top, -win, rows.length, win)))} />
        <Button key="rs-down" label="▼" variant="secondary" dimColor={atEnd} onPress={() => (atEnd ? undefined : act.setTop(nextTop(top, win, rows.length, win)))} />
      </Box>
    ) : null
  const numeric = cols.map(c => !hidden.has(c) && shown.some(r => typeof r[c] === 'number') && shown.every(r => r[c] == null || typeof r[c] === 'number'))
  // One table row: the row number, then each cell after a dim column rule.
  const tableRow = (key: string, fill: string | undefined, num: unknown, cells: unknown[]) => (
    <Box key={key} backgroundColor={fill} paddingX={1} gap={1}>
      <Box minWidth={numWidth} width={numWidth} flexShrink={0}>
        {num}
      </Box>
      {cells.flatMap((c, ci) => [
        <Text key={`${key}-rule-${ci}`} color={TABLE_BORDER}>
          │
        </Text>,
        c,
      ])}
    </Box>
  )

  return (
    <Box flexDirection="column" gap={1} paddingX={1}>
      {Input ? (
        <Input key="rs-search" label="Search" placeholder="Filter rows by any value" value={view.query} autoFocus onInput={(v: string) => act.search(v)} onSubmit={(v: string) => act.search(v)} />
      ) : null}
      <Box justifyContent="space-between" alignItems="center">
        {/* The arrows lead, so a status that grows or shrinks never moves them. */}
        <Box gap={2} alignItems="center">
          {pager}
          <Text key="rs-status" dimColor>{parts.join(' · ')}</Text>
        </Box>
        <Box gap={1}>
          <Button key="rs-copy-tsv" label="Copy for Sheets" variant="secondary" onPress={() => act.copy(delimited(cols, rows, hidden, '\t'))} />
          <Button key="rs-copy-csv" label="Copy CSV" variant="secondary" onPress={() => act.copy(delimited(cols, rows, hidden, ','))} />
        </Box>
      </Box>
      {rows.length === 0 ? (
        <Text dimColor>{view.query ? `No row matches "${view.query}".` : 'Query returned 0 rows.'}</Text>
      ) : (
        // A real table: a bordered box, a shaded header of sort buttons, a dim
        // rule between every two columns, banded rows, numbers right-aligned.
        <Box key="rs-table" flexDirection="column" borderStyle="round" borderColor={TABLE_BORDER}>
          {tableRow('rs-head', HEAD_FILL, <Text dimColor>#</Text>, cols.map((c, ci) => {
            const masked = hidden.has(c)
            const arrow = view.sort === c ? (view.desc ? ' ↓' : ' ↑') : ''
            return (
              <Box key={`rs-h-${c}`} width={widths[ci]} flexShrink={0} justifyContent={numeric[ci] ? 'flex-end' : 'flex-start'}>
                <Button key={`rs-sort-${c}`} label={`${cell(c)}${masked ? ' ⊘' : ''}${arrow}`} plain dimColor={view.sort !== c} onPress={() => act.sortBy(c)} />
              </Box>
            )
          }))}
          {shown.map((r, wi) => {
            // Keys and banding follow the row's place in the whole result, so a
            // row keeps its key and its shade as the window moves over it.
            const i = top + wi
            return tableRow(`rs-row-${i}`, i % 2 === 1 ? BAND_FILL : undefined, <Text dimColor>{String(i + 1)}</Text>, cols.map((c, ci) => {
              const masked = hidden.has(c)
              return (
                <Box key={`rs-c-${c}-${i}`} width={widths[ci]} flexShrink={0} justifyContent={numeric[ci] ? 'flex-end' : 'flex-start'}>
                  <Text dimColor={masked} wrap="truncate-end">
                    {masked ? '•••' : shownText(r[c]) || ' '}
                  </Text>
                </Box>
              )
            }))
          })}
        </Box>
      )}
      {hidden.size > 0 ? <Text color="gray">⊘ hidden by policy: {[...hidden].map(cell).join(', ')}</Text> : null}
    </Box>
  )
}
