import type { ClassDef, ProjectState, Visibility } from '../model/types'

function vis(v: Visibility): string {
  if (v === 'private') return 'private'
  if (v === 'protected') return 'protected'
  return 'public'
}

function classDecl(c: ClassDef, state: ProjectState): string {
  const name = (c.name || 'Unnamed').trim() || 'Unnamed'
  const genericParam = (c.genericParam ?? '').trim()
  const className = genericParam ? `${name}<${genericParam}>` : name

  const extendsRel = state.relationships.find((r) => r.type === 'extends' && r.fromClassId === c.id)
  const implementsRels = state.relationships.filter((r) => r.type === 'implements' && r.fromClassId === c.id)

  const extendsClause = extendsRel
    ? (() => {
        const base = state.classes.find((x) => x.id === extendsRel.toClassId)
        if (!base) return ''
        const baseName = base.name.trim() || 'Unnamed'
        const baseGen = (base.genericParam ?? '').trim()
        const full = baseGen ? `${baseName}<${baseGen}>` : baseName
        return ` extends ${full}`
      })()
    : ''

  const implementsClause =
    implementsRels.length > 0
      ? (() => {
          const names = implementsRels
            .map((r) => state.classes.find((x) => x.id === r.toClassId))
            .filter(Boolean)
            .map((x) => {
              const n = x!.name.trim() || 'Unnamed'
              const g = (x!.genericParam ?? '').trim()
              return g ? `${n}<${g}>` : n
            })
          return names.length ? ` implements ${names.join(', ')}` : ''
        })()
      : ''

  if (c.kind === 'interface') return `public interface ${className} {`
  if (c.kind === 'abstract_class') return `public abstract class ${className}${extendsClause}${implementsClause} {`
  return `public class ${className}${extendsClause}${implementsClause} {`
}

export function generateJava(state: ProjectState): string {
  const out: string[] = []

  for (const c of state.classes) {
    // Add a leading blank line before each class/interface for readability (as requested).
    out.push('')
    out.push(classDecl(c, state))
    // Add a blank line between the class line and the first member.
    out.push('')

    for (const f of c.fields) {
      const name = f.name.trim() || 'unnamed'
      const type = f.type.trim() || 'String'
      out.push(`\t${vis(f.visibility)} ${type} ${name};`)
    }

    if (c.fields.length && c.methods.length) out.push('')

    for (const m of c.methods) {
      const name = m.name.trim() || 'unnamed'
      const ret = m.returnType.trim() || 'void'
      const params = m.params
        .map((p) => {
          const pname = p.name.trim() || 'arg'
          const ptype = p.type.trim() || 'String'
          return `${ptype} ${pname}`
        })
        .join(', ')

      const baseSig = `${vis(m.visibility)} ${ret} ${name}(${params})`
      if (c.kind === 'interface' || m.kind === 'abstract') {
        // No body for interface or abstract methods.
        const sig = c.kind === 'interface' ? baseSig : `${vis(m.visibility)} abstract ${ret} ${name}(${params})`
        out.push(`\t${sig};`)
      } else {
        out.push(`\t${baseSig} {`)
        // Blank line inside method body, indented with a full tab (per request).
        out.push('\t\t')
        out.push('\t}')
      }
      out.push('')
    }

    if (out[out.length - 1] === '') out.pop()
    out.push('}')
    out.push('')
  }

  if (out[out.length - 1] === '') out.pop()
  return out.join('\n')
}


