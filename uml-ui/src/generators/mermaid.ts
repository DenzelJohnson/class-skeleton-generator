import type { ClassDef, ProjectState, RelationshipDef, Visibility } from '../model/types'
import { CONSTRUCTOR_RETURN_TYPE } from '../model/sentinels'

function visSymbol(v: Visibility): string {
  if (v === 'private') return '-'
  if (v === 'public') return '+'
  return '#'
}

function safeId(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return 'Unnamed'
  // Mermaid class identifiers are happier with alphanumerics/underscore.
  // Allow `~` for generics in classDiagram (e.g. Predator~Prey~).
  // NOTE: Mermaid's classDiagram grammar is conservative; keep identifiers ASCII to avoid lexer errors.
  return trimmed.replace(/[^A-Za-z0-9_~]/g, '_')
}

function genericToMermaid(nameOrGeneric: string): string {
  // Mermaid classDiagram generics use `~` instead of `< >`
  // e.g. Predator<Prey> => Predator~Prey~
  const s = nameOrGeneric.trim()
  if (!s) return s
  return s.replaceAll('<', '~').replaceAll('>', '~').replaceAll(',', '~')
}

function classUmlName(c: ClassDef): string {
  const name = c.name.trim() || 'Unnamed'
  const gen = (c.genericParam ?? '').trim()
  const baseRaw = gen ? `${name}<${gen}>` : name
  return safeId(genericToMermaid(baseRaw))
}

function classById(state: ProjectState, id: string): ClassDef | undefined {
  return state.classes.find((c) => c.id === id)
}

function relLine(state: ProjectState, r: RelationshipDef): string | null {
  const from = classById(state, r.fromClassId)
  const to = classById(state, r.toClassId)
  if (!from || !to) return null
  const fromName = classUmlName(from)
  const toName = classUmlName(to)

  if (r.type === 'extends') {
    // Base <|-- Derived
    return `${toName} <|-- ${fromName}`
  }
  if (r.type === 'implements') {
    // Interface <|.. Impl
    return `${toName} <|.. ${fromName}`
  }

  if (r.type === 'composition') {
    // composition: Owner *-- Part
    const mult = r.toMultiplicity ? `"${r.toMultiplicity}"` : ''
    return mult ? `${fromName} *-- ${mult} ${toName}` : `${fromName} *-- ${toName}`
  }

  // aggregation: Owner o-- Part
  // multiplicity appears on the to-side
  const mult = r.toMultiplicity ? `"${r.toMultiplicity}"` : ''
  return mult ? `${fromName} o-- ${mult} ${toName}` : `${fromName} o-- ${toName}`
}

export function generateMermaidClassDiagram(state: ProjectState): string {
  const lines: string[] = []
  lines.push('classDiagram')

  if (state.classes.length === 0) {
    // Mermaid classDiagram cannot be empty; render a tiny placeholder instead.
    lines.push('class StartHere {')
    lines.push('  +AddClasses(): void')
    lines.push('}')
    return lines.join('\n')
  }

  for (const c of state.classes) {
    const name = classUmlName(c)
    lines.push(`class ${name} {`)
    if (c.kind === 'interface') {
      // Mermaid recognizes this stereotype; capitalization here can break parsing.
      lines.push('  <<interface>>')
    }
    if (c.kind === 'abstract_class') {
      lines.push('  <<abstract>>')
    }

    for (const f of c.fields) {
      const sym = visSymbol(f.visibility)
      const fname = f.name.trim() || 'unnamed'
      const ftype = f.type.trim() || 'String'
      lines.push(`  ${sym}${fname}: ${ftype}`)
    }

    for (const m of c.methods) {
      const sym = visSymbol(m.visibility)
      const mname = m.name.trim() || 'unnamed'
      const params = m.params
        .map((p) => {
          const pname = p.name.trim() || 'arg'
          const ptype = p.type.trim() || 'String'
          return `${pname}: ${ptype}`
        })
        .join(', ')
      const ret = m.returnType.trim() || 'void'
      if (ret === CONSTRUCTOR_RETURN_TYPE) {
        const cn = classUmlName(c)
        lines.push(`  ${sym}${cn}(${params})`)
      } else {
        lines.push(`  ${sym}${mname}(${params}): ${ret}`)
      }
    }

    lines.push('}')
  }

  for (const r of state.relationships) {
    const l = relLine(state, r)
    if (l) lines.push(l)
  }

  return lines.join('\n')
}


