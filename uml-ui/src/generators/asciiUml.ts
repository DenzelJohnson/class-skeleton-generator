import type { ClassDef, ProjectState, RelationshipDef, Visibility } from '../model/types'
import { CONSTRUCTOR_RETURN_TYPE } from '../model/sentinels'

function toMathItalic(s: string): string {
  const out: string[] = []
  for (const ch of s) {
    const code = ch.codePointAt(0) ?? 0
    if (code >= 0x41 && code <= 0x5a) out.push(String.fromCodePoint(0x1d434 + (code - 0x41)))
    else if (code >= 0x61 && code <= 0x7a) out.push(String.fromCodePoint(0x1d44e + (code - 0x61)))
    else out.push(ch)
  }
  return out.join('')
}

function visSymbol(v: Visibility): string {
  if (v === 'private') return '-'
  if (v === 'public') return '+'
  return '#'
}

function classTitle(c: ClassDef): string {
  const nameRaw = c.name.trim() || 'Unnamed'
  const gen = (c.genericParam ?? '').trim()
  const raw = gen ? `${nameRaw}<${gen}>` : nameRaw
  const name = c.kind === 'abstract_class' ? toMathItalic(raw) : raw
  if (c.kind === 'interface') return `«interface» ${raw}`
  return name
}

function fieldLine(c: ClassDef): string[] {
  if (c.fields.length === 0) return []
  return c.fields.map((f) => {
    const sym = visSymbol(f.visibility)
    const name = f.name.trim() || 'unnamed'
    const type = f.type.trim() || 'String'
    return `${sym}${name}: ${type}`
  })
}

function methodLine(c: ClassDef): string[] {
  if (c.methods.length === 0) return []
  return c.methods.map((m) => {
    const sym = visSymbol(m.visibility)
    const raw = m.name.trim() || 'unnamed'
    const name = m.kind === 'abstract' ? toMathItalic(raw) : raw
    const params = m.params
      .map((p) => {
        const pname = p.name.trim() || 'arg'
        const ptype = p.type.trim() || 'String'
        return `${pname}: ${ptype}`
      })
      .join(', ')
    const ret = m.returnType.trim() || 'void'
    if (ret === CONSTRUCTOR_RETURN_TYPE) {
      const cnRaw = c.name.trim() || 'Unnamed'
      const cn = c.kind === 'abstract_class' ? toMathItalic(cnRaw) : cnRaw
      return `${sym}${cn}(${params})`
    }
    return `${sym}${name}(${params}): ${ret}`
  })
}

function padRight(s: string, width: number): string {
  const missing = Math.max(0, width - s.length)
  return s + ' '.repeat(missing)
}

function center(s: string, width: number): string {
  const missing = Math.max(0, width - s.length)
  const left = Math.floor(missing / 2)
  const right = missing - left
  return ' '.repeat(left) + s + ' '.repeat(right)
}

function box(lines: string[], width: number): string[] {
  // No "+" corners: use only "|" and "-" to mimic UML boxes in plain text.
  const top = '|' + '-'.repeat(width + 2) + '|'
  const out: string[] = [top]
  for (const l of lines) {
    out.push(`| ${padRight(l, width)} |`)
  }
  out.push(top)
  return out
}

function classBox(c: ClassDef): string {
  const title = classTitle(c)
  const fields = fieldLine(c)
  const methods = methodLine(c)
  const body: string[] = []

  // compute width from all content
  const all = [title, ...fields, ...methods]
  const width = Math.max(12, ...all.map((x) => x.length))

  // Title row
  body.push(center(title, width))

  // Separator
  const sep = '-' + '-'.repeat(width) + '-'
  body.push(sep)

  // Fields compartment
  if (fields.length > 0) {
    for (const f of fields) body.push(f)
  } else {
    body.push('(no variables)')
  }

  // Separator
  body.push(sep)

  // Methods compartment
  if (methods.length > 0) {
    for (const m of methods) body.push(m)
  } else {
    body.push('(no methods)')
  }

  return box(body, width).join('\n')
}

function relLine(state: ProjectState, r: RelationshipDef): string | null {
  const from = state.classes.find((c) => c.id === r.fromClassId)
  const to = state.classes.find((c) => c.id === r.toClassId)
  if (!from || !to) return null

  const fromBase = from.name.trim() || 'Unnamed'
  const fromGen = (from.genericParam ?? '').trim()
  const fromName = fromGen ? `${fromBase}<${fromGen}>` : fromBase

  const toBase = to.name.trim() || 'Unnamed'
  const toGen = (to.genericParam ?? '').trim()
  const toName = toGen ? `${toBase}<${toGen}>` : toBase

  if (r.type === 'extends') return `${fromName} --|> ${toName}`
  if (r.type === 'implements') return `${fromName} ..|> ${toName}`
  if (r.type === 'composition') {
    const mult = r.toMultiplicity ? ` (${r.toMultiplicity})` : ''
    return `${fromName} *--${mult} ${toName}`
  }
  const mult = r.toMultiplicity ? ` (${r.toMultiplicity})` : ''
  return `${fromName} o--${mult} ${toName}`
}

export function generateAsciiUml(state: ProjectState): string {
  if (state.classes.length === 0) {
    const placeholder: ClassDef = { id: 'x', name: 'StartHere', kind: 'class', genericParam: '', fields: [], methods: [] }
    return classBox(placeholder)
  }

  const parts: string[] = []
  for (const c of state.classes) {
    parts.push(classBox(c))
  }

  const rels = state.relationships.map((r) => relLine(state, r)).filter(Boolean) as string[]
  if (rels.length > 0) {
    parts.push('Relationships:')
    parts.push(...rels.map((r) => `- ${r}`))
  }

  return parts.join('\n\n')
}


