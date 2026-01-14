import type { ClassDef, ProjectState, Visibility } from '../model/types'
import { CONSTRUCTOR_RETURN_TYPE } from '../model/sentinels'

function cType(t: string): string {
  const s = t.trim()
  if (!s) return 'void'
  if (s === 'String') return 'char*'
  if (s === 'boolean' || s === 'Boolean' || s === 'bool') return 'bool'
  return s
}

function visComment(v: Visibility): string {
  if (v === 'private') return '/* private */'
  if (v === 'protected') return '/* protected */'
  return '/* public */'
}

function methodName(c: ClassDef, mName: string): string {
  const cn = (c.name.trim() || 'Unnamed').replace(/[^A-Za-z0-9_]/g, '_')
  const mn = (mName.trim() || 'unnamed').replace(/[^A-Za-z0-9_]/g, '_')
  return `${cn}_${mn}`
}

function needsStdBool(state: ProjectState): boolean {
  for (const c of state.classes) {
    for (const f of c.fields) if (cType(f.type) === 'bool') return true
    for (const m of c.methods) {
      if (cType(m.returnType) === 'bool') return true
      for (const p of m.params) if (cType(p.type) === 'bool') return true
    }
  }
  return false
}

function defaultReturnExpr(ret: string): string | null {
  const r = cType(ret)
  if (r === 'void') return null
  if (r === 'bool') return 'false'
  if (r.endsWith('*')) return 'NULL'
  return '0'
}

function structName(c: ClassDef): string {
  const n = (c.name.trim() || 'Unnamed').replace(/[^A-Za-z0-9_]/g, '_')
  return n || 'Unnamed'
}

function headerForClass(c: ClassDef): string[] {
  const out: string[] = []
  const sn = structName(c)
  if (c.kind === 'interface') {
    out.push(`// interface ${sn}`)
    out.push(`typedef struct ${sn} ${sn};`)
    return out
  }

  out.push(`typedef struct ${sn} {`)
  for (const f of c.fields) {
    const name = (f.name.trim() || 'unnamed').replace(/[^A-Za-z0-9_]/g, '_')
    const type = cType(f.type)
    out.push(`\t${type} ${name}; ${visComment(f.visibility)}`)
  }
  out.push(`} ${sn};`)
  return out
}

function prototypesForClass(c: ClassDef): string[] {
  const out: string[] = []
  const sn = structName(c)

  for (const m of c.methods) {
    const isCtor = m.returnType.trim() === CONSTRUCTOR_RETURN_TYPE
    const ret = isCtor ? 'void' : cType(m.returnType)
    const fn = isCtor ? `${sn}_init` : methodName(c, m.name)
    const params = [
      `${sn}* self`,
      ...m.params.map((p) => {
        const pname = (p.name.trim() || 'arg').replace(/[^A-Za-z0-9_]/g, '_')
        const ptype = cType(p.type)
        return `${ptype} ${pname}`
      }),
    ].join(', ')
    out.push(`${ret} ${fn}(${params}); ${visComment(m.visibility)}`)
  }
  return out
}

function stubsForClass(c: ClassDef): string[] {
  const out: string[] = []
  const sn = structName(c)

  for (const m of c.methods) {
    const isCtor = m.returnType.trim() === CONSTRUCTOR_RETURN_TYPE
    const ret = isCtor ? 'void' : cType(m.returnType)
    const fn = isCtor ? `${sn}_init` : methodName(c, m.name)
    const params = [
      `${sn}* self`,
      ...m.params.map((p) => {
        const pname = (p.name.trim() || 'arg').replace(/[^A-Za-z0-9_]/g, '_')
        const ptype = cType(p.type)
        return `${ptype} ${pname}`
      }),
    ].join(', ')
    out.push(`${ret} ${fn}(${params}) {`)
    out.push('\t(void)self;')
    const expr = defaultReturnExpr(ret)
    if (expr) out.push(`\treturn ${expr};`)
    out.push('}')
    out.push('')
  }

  if (out[out.length - 1] === '') out.pop()
  return out
}

export function generateCHeader(state: ProjectState): string {
  const out: string[] = []
  out.push('#pragma once')
  out.push('')
  out.push('#include <stddef.h>')
  if (needsStdBool(state)) out.push('#include <stdbool.h>')
  out.push('')

  for (const c of state.classes) {
    out.push(...headerForClass(c))
    out.push('')
    out.push(...prototypesForClass(c))
    out.push('')
  }

  if (out[out.length - 1] === '') out.pop()
  return out.join('\n')
}

export function generateCSource(state: ProjectState, headerName = 'generated.h'): string {
  const out: string[] = []
  out.push(`#include "${headerName}"`)
  out.push('#include <stddef.h>')
  if (needsStdBool(state)) out.push('#include <stdbool.h>')
  out.push('')

  for (const c of state.classes) {
    if (c.methods.length === 0) continue
    out.push(`// ${c.kind} ${structName(c)}`)
    out.push(...stubsForClass(c))
    out.push('')
  }

  if (out[out.length - 1] === '') out.pop()
  return out.join('\n')
}


