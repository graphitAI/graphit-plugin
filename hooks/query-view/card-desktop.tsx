// The card on the desktop: one frosted SVG - header row, tab band, the panel,
// a status bar - with native Buttons laid over its bands. An SVG draws as an
// image (no clicks reach the mod), so every control is a Button placed with
// `position: "absolute"`, in character cells (about 8 x 18 px).

import type { CardModel, Ui } from './card'
import { MAX_ROWS, OUTCOME_BADGE, REF_KIND, TIER_COLOR, TIER_LABEL, cell, clean, fmtNumber, marksFor, own } from './result'
import { templateColor } from './spans'
import { formatLines, lineText } from './sql'
import type { DetailsTab, TabId } from './state'
import { BAR_TABS_LEFT, bodyHeightFor, codeLinesFor, columnWidths, fitColumns, renderCardSvg } from './svgcard'
import type { SvgPanel } from './svgcard'

// Bands the SVG leaves empty for the native tabs and the footer controls,
// sized so a row laid 4 cells down sits on the tab band's center line.
const TOOLBAR_PX = 46
const FOOTER_PX = 56
export function drawDesktopCard(ui: Ui, m: CardModel): unknown {
  const { Box, Text, Button, Svg } = ui
  const { active, result, injections, kbRefs, kbCount, hidden, cols, shown, upstream, layers } = m

  // Right-aligned only when the page holds a number; an all-null (masked) column stays left.
  const numeric = cols.map(c => !hidden.has(c) && shown.some(r => typeof r[c] === 'number') && shown.every(r => typeof r[c] === 'number' || r[c] === null))
  // Columns page like rows: the ones that fit the card, then the next set.
  const cellRows = shown.map(r => cols.map(c => (typeof r[c] === 'number' ? fmtNumber(r[c] as number) : cell(r[c]))))
  const widths = columnWidths(cols, cellRows, hidden)
  const colStarts: number[] = []
  for (let at = 0; at < cols.length; at += fitColumns(widths, at)) colStarts.push(at)
  const colPage = Math.min(Math.max(m.colPage, 0), Math.max(colStarts.length - 1, 0))
  const cStart = colStarts[colPage] ?? 0
  const cEnd = cStart + fitColumns(widths, cStart)
  const goCols = (n: number) => m.act.goCols(n, colStarts.length)

  const sqlPanel = (kind: 'base' | 'runtime', text: string | undefined): SvgPanel => ({
    kind: 'code',
    lines: formatLines(clean(text ?? '')).map(line => {
      const marks = marksFor(line, kind, injections, m.expansions)
      const notes = [...new Set(marks.map(mk => mk.note).filter(Boolean))]
      return { tokens: line, mark: marks[0] ? { glyph: marks[0].marker, color: marks[0].color, note: notes.join(', ') } : undefined }
    }),
    maxLines: sqlLines,
    // The count of lines past the card is said in the footer, beside Open full SQL.
    moreNote: false,
  })
  const panels: Record<TabId, () => SvgPanel> = {
    results: () => ({
      kind: 'table',
      columns: cols.slice(cStart, cEnd),
      rows: cellRows.map(r => r.slice(cStart, cEnd)),
      hidden,
      numeric: numeric.slice(cStart, cEnd),
      note: hidden.size > 0 ? `⊘ hidden by policy: ${[...hidden].join(', ')}` : undefined,
    }),
    chart: () => ({ kind: 'chart', spec: m.chart }),
    lineage: () => ({ kind: 'layers', spec: layers }),
    base: () => sqlPanel('base', m.baseSql),
    runtime: () => sqlPanel('runtime', m.runSql),
    // The KB tab holds the semantic references and, after them, the rules that
    // changed the query: one tab, so the top bar keeps room for the meta.
    kb: () => ({
      kind: 'list',
      items: [...kbItems(), ...ruleItems()],
    }),
    governance: () => ({ kind: 'list', items: [...kbItems(), ...ruleItems()] }),
  }
  function kbItems() {
    return kbRefs.map(ref => {
        const kindName = own(REF_KIND, ref.kind) ?? 'Metric'
        const x = m.expansionFor(kindName, ref.name ?? '')
        return {
          title: cell(ref.name),
          badge: { text: kindName.toUpperCase(), color: templateColor(kindName) },
          lines: [`{{ ${kindName}('${cell(ref.name)}') }}`, ...(x.expr ? [`${x.expr === x.alias ? 'Column' : 'Compiles to'}  ${x.expr}`] : [])],
        }
      })
  }
  function ruleItems() {
    return injections.map(inj => {
        const outcome = own(OUTCOME_BADGE, inj.outcome) ?? { label: clean(inj.outcome ?? 'applied').toUpperCase(), color: '#6b7280' }
        return {
          title: cell(inj.rule_name ?? inj.source_id ?? 'rule'),
          badge: { text: outcome.label, color: outcome.color },
          lines: [
            ...(inj.why ? [clean(inj.why)] : []),
            ...(inj.added_clauses ?? []).map(cl => `+ ${clean(cl)}`),
            ...(inj.transformations ?? []).filter(t => t.column).map(t => `~ ${cell(t.column)} returned as NULL`),
          ],
        }
      })
  }

  // Sized by the first page, so paging to a short last page keeps the height.
  const bodyH = bodyHeightFor(Math.min(result.rows.length, MAX_ROWS), hidden.size > 0)
  // The card shows this many SQL lines; the sidebar shows them all.
  const sqlLines = codeLinesFor(bodyH)

  const isSql = active === 'base' || active === 'runtime'
  const segments: Array<{ id: TabId; label: string; on: boolean; go: TabId }> = [
    { id: 'results', label: 'Results', on: active === 'results', go: 'results' },
    { id: 'runtime', label: 'SQL', on: isSql, go: isSql ? active : 'runtime' },
    { id: 'chart', label: 'Graph', on: active === 'chart', go: 'chart' },
    { id: 'lineage', label: 'Lineage', on: active === 'lineage', go: 'lineage' },
    { id: 'kb', label: `KB (${kbCount + injections.length})`, on: active === 'kb' || active === 'governance', go: 'kb' },
  ]
  const segment = (key: string, label: string, on: boolean, press: () => unknown) => (
    // Every tab is an outlined button (the active one filled), so tabs read as
    // controls and the plain text beside them reads as information.
    <Button key={key} label={label} variant={on ? 'primary' : 'secondary'} onPress={press} />
  )
  const sqlText = clean((active === 'base' ? m.baseSql : m.runSql) ?? '')
  // Feature #1067: every footer reads from the left - the desktop sizes the
  // laid-over controls a little wider than the card's own cells, so a row
  // anchored to the right edge runs past it.
  const n = (x: number) => x.toLocaleString('en-US')
  // The lineage status reads in the native footer, after its buttons.
  const status =
    active === 'lineage'
      ? upstream?.status === 'ok'
        ? upstream.notFound
          ? `${upstream.notFound} isn't in your Graphit org - showing the query only`
          : `Warehouse to result, read from Graphit at ${upstream.loadedAt ?? ''}`
        : upstream?.status === 'loading'
          ? 'Reading the warehouse, data source and KB definitions…'
          : upstream?.status === 'error'
            ? `Upstream not read: ${upstream.error ?? 'unknown error'}`
            : 'Showing the query only; load the upstream for the full chain'
      : undefined
  const card = renderCardSvg({
    logoInner: m.logoInner,
    // Governed is the expected case and goes unsaid; Verified and Ad hoc keep their pill.
    tierLabel: m.tier === 'governed' ? '' : (own(TIER_LABEL, m.tier) ?? clean(m.tier)),
    tierColor: own(TIER_COLOR, m.tier) ?? TIER_COLOR.ad_hoc,
    meta: m.meta.join(' · '),
    source: m.sourceName ? cell(m.sourceName) : undefined,
    panel: panels[active](),
    toolbar: TOOLBAR_PX,
    // Feature #1067: every tab keeps the footer band and the body height, so
    // switching tabs never changes the card's height.
    footer: FOOTER_PX,
    body: bodyH,
    compactHeader: true,
  })
  // The one way into the sidebar: every tab's footer starts with Details, which
  // opens the Query details sidebar on the matching tab.
  const detailsTab: DetailsTab = isSql ? 'sql' : active === 'lineage' ? 'lineage' : active === 'kb' || active === 'governance' ? 'kb' : 'results'
  const details = (
    <Button
      key={`details-${m.rowKey}`}
      label="Details ↗"
      variant="secondary"
      onPress={() =>
        m.act.openDetails({
          tab: detailsTab,
          sqlKind: active === 'base' ? 'base' : 'runtime',
          kb: kbRefs.map(ref => {
            const kind = own(REF_KIND, ref.kind) ?? 'Metric'
            const x = m.expansionFor(kind, ref.name ?? '')
            // The full name: the sidebar reads the definition by it and shortens it itself.
            return { kind, name: clean(ref.name ?? ''), alias: x.alias, expansion: x.expr }
          }),
          rules: ruleItems().map(r => ({ title: r.title, badge: r.badge.text, color: r.badge.color, lines: r.lines })),
        })
      }
    />
  )
  const extras = active === 'results' && shown.length > 0 ? (
    <Box justifyContent="flex-start" alignItems="center" gap={3}>
      <Box alignItems="center" gap={2}>
        <Box alignItems="center" gap={1}>
          {m.pageCount > 2 ? <Button key={`pg-first-${m.rowKey}`} label="«" plain dimColor={m.page === 0} onPress={() => m.act.goTo(0)} /> : null}
          {m.pageCount > 1 ? <Button key={`pg-prev-${m.rowKey}`} label="❮" variant="secondary" dimColor={m.page === 0} onPress={() => m.act.goTo(m.page - 1)} /> : null}
          <Text dimColor>{`Rows ${n(m.first + 1)}-${n(m.first + shown.length)} of ${n(result.rows.length)}`}</Text>
          {m.pageCount > 1 ? <Button key={`pg-next-${m.rowKey}`} label="❯" variant="secondary" dimColor={m.page === m.pageCount - 1} onPress={() => m.act.goTo(m.page + 1)} /> : null}
          {m.pageCount > 2 ? <Button key={`pg-last-${m.rowKey}`} label="»" plain dimColor={m.page === m.pageCount - 1} onPress={() => m.act.goTo(m.pageCount - 1)} /> : null}
        </Box>
        {colStarts.length > 1 ? (
          <Box alignItems="center" gap={1}>
            <Button key={`col-prev-${m.rowKey}`} label="❮" variant="secondary" dimColor={colPage === 0} onPress={() => goCols(colPage - 1)} />
            <Text dimColor>{`Columns ${cStart + 1}-${cEnd} of ${cols.length}`}</Text>
            <Button key={`col-next-${m.rowKey}`} label="❯" variant="secondary" dimColor={colPage === colStarts.length - 1} onPress={() => goCols(colPage + 1)} />
          </Box>
        ) : null}
      </Box>
    </Box>
  ) : active === 'lineage' ? (
    <Box justifyContent="flex-start" alignItems="center" gap={1}>
      <Button
        key={`up-load-${m.rowKey}`}
        label={upstream?.status === 'ok' ? 'Reload' : upstream?.status === 'loading' ? 'Loading…' : 'Load upstream'}
        variant="secondary"
        dimColor={upstream?.status === 'loading'}
        onPress={() => m.act.loadUpstream()}
      />
      {status ? <Text dimColor wrap="truncate-end">{status}</Text> : null}
    </Box>
  ) : isSql ? (
    <Box justifyContent="flex-start" alignItems="center" gap={3}>
      {/* Which SQL the panel shows, as a highlighted toggle on the left. */}
      <Box alignItems="center" gap={1}>
        {(['base', 'runtime'] as const).map(kind => (
          <Button
            key={`sql-${kind === 'base' ? 'base' : 'run'}-${m.id}`}
            label={kind === 'base' ? 'As written' : 'As run'}
            variant={active === kind ? 'primary' : 'secondary'}
            onPress={() => m.act.setTab(kind)}
          />
        ))}
      </Box>
      <Box alignItems="center" gap={1}>
      {sqlText ? (
        <Button key={`sql-copy-${m.id}`} label="Copy" plain onPress={() => m.act.copy(formatLines(sqlText).map(lineText).join('\n'))} />
      ) : null}
      {card.more > 0 ? <Text dimColor>{`+${card.more} more line${card.more === 1 ? '' : 's'}`}</Text> : null}
      </Box>
    </Box>
  ) : null
  const footer = (
    <Box justifyContent="flex-start" alignItems="center" gap={3}>
      {details}
      {extras}
    </Box>
  )

  return (
    <Box flexDirection="column" marginTop={1} alignSelf="flex-start">
      {/* Feature #1067: the lineage tab draws interactive, so a node's <title> shows its full name on hover. */}
      <Svg key="card" source={card.svg} alt={`Graphit query result: ${m.meta.join(', ')}`} width={card.width} height={card.height} isInteractive={active === 'lineage' || undefined} />
      {/* The one top bar after the mark: tabs on the left; the tier (unless governed) and meta on the
          right, native text so they share the tabs' font and baseline. */}
      {/* Flows left to right, never anchored to the right edge: native cells are
          wider than the picture's pixels assume, so a right anchor lands past the card. */}
      <Box position="absolute" top={1} left={BAR_TABS_LEFT} alignItems="center" gap={1}>
        <Box alignItems="center" gap={1}>
          {segments.map(t =>
            segment(`tab-${t.id}`, t.label, t.on, async () => {
              await m.act.setTab(t.go)
              if (t.go === 'lineage' && !upstream) await m.act.loadUpstream()
            }),
          )}
        </Box>
        <Box alignItems="center" gap={1} flexShrink={1} marginLeft={1}>
          {/* The divider between the tabs and the meta, mirroring the one after the mark. */}
          <Text dimColor>│</Text>
          {m.tier !== 'governed' ? <Text color={own(TIER_COLOR, m.tier) ?? TIER_COLOR.ad_hoc}>{`● ${own(TIER_LABEL, m.tier) ?? clean(m.tier)}`}</Text> : null}
          <Text dimColor wrap="truncate-end">{m.meta.join(' · ')}</Text>
          {/* cell() cuts a long name to 24 characters with "…", so the bar stays inside the card. */}
          {m.sourceName ? <Text dimColor wrap="truncate-end">{cell(m.sourceName)}</Text> : null}
        </Box>
      </Box>
      {/* The footer: the tab's controls, then the query switcher (a carousel's), flowing from the
          left like the top bar so nothing lands past the card's right edge. */}
      {footer || m.nav ? (
        <Box position="absolute" bottom={2} left={2} alignItems="center" gap={3}>
          {m.nav}
          {footer}
        </Box>
      ) : null}
    </Box>
  )
}
