import type { ClassDef, ProjectState, Visibility } from '../model/types'
import { CONSTRUCTOR_RETURN_TYPE } from '../model/sentinels'

function vis(v: Visibility): string {
  if (v === 'private') return 'private'
  if (v === 'protected') return 'protected'
  return 'public'
}

function javaParams(m: ClassDef['methods'][number]): string {
  return m.params
    .map((p) => {
      const pname = p.name.trim() || 'arg'
      const ptype = p.type.trim() || 'String'
      return `${ptype} ${pname}`
    })
    .join(', ')
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
      const params = javaParams(m)

      // For interface methods and abstract methods, output a template: `return name(params){};`
      if (c.kind === 'interface') {
        // No visibility modifier for interface methods (implicit public).
        // Constructors are not meaningful in interfaces; fall back to `void` template.
        const rr = ret === CONSTRUCTOR_RETURN_TYPE ? 'void' : ret
        out.push(`\t${rr} ${name}(${params});`)
      } else if (m.kind === 'abstract') {
        // Keep selected visibility, but render as a signature (per request).
        const rr = ret === CONSTRUCTOR_RETURN_TYPE ? 'void' : ret
        out.push(`\t${vis(m.visibility)} ${rr} ${name}(${params});`)
      } else {
        if (ret === CONSTRUCTOR_RETURN_TYPE) {
          const cn = (c.name.trim() || 'Unnamed')
          out.push(`\t${vis(m.visibility)} ${cn}(${params}) {`)
        } else {
          const baseSig = `${vis(m.visibility)} ${ret} ${name}(${params})`
          out.push(`\t${baseSig} {`)
        }
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


