import type { ClassDef, FieldDef, MethodDef, ParamDef, ProjectState, RelationshipDef } from './types'
import { makeClass, makeField, makeInitialState, makeMethod, makeParam, makeRelationship } from './factory'

export type Action =
  | { type: 'project.setLanguage'; language: ProjectState['language'] }
  | { type: 'class.add' }
  | { type: 'class.delete'; classId: string }
  | { type: 'class.patch'; classId: string; patch: Partial<Pick<ClassDef, 'name' | 'kind' | 'genericParam'>> }
  | { type: 'field.add'; classId: string }
  | { type: 'field.delete'; classId: string; fieldId: string }
  | { type: 'field.patch'; classId: string; fieldId: string; patch: Partial<Pick<FieldDef, 'name' | 'type' | 'visibility'>> }
  | { type: 'method.add'; classId: string }
  | { type: 'method.delete'; classId: string; methodId: string }
  | {
      type: 'method.patch'
      classId: string
      methodId: string
      patch: Partial<Pick<MethodDef, 'name' | 'returnType' | 'visibility' | 'kind'>>
    }
  | { type: 'param.add'; classId: string; methodId: string }
  | { type: 'param.delete'; classId: string; methodId: string; paramId: string }
  | {
      type: 'param.patch'
      classId: string
      methodId: string
      paramId: string
      patch: Partial<Pick<ParamDef, 'name' | 'type'>>
    }
  | { type: 'rel.add'; fromClassId?: string; toClassId?: string }
  | { type: 'rel.delete'; relId: string }
  | { type: 'rel.patch'; relId: string; patch: Partial<Omit<RelationshipDef, 'id'>> }

function mapClass(state: ProjectState, classId: string, fn: (c: ClassDef) => ClassDef): ProjectState {
  return { ...state, classes: state.classes.map((c) => (c.id === classId ? fn(c) : c)) }
}

export function reducer(state: ProjectState, action: Action): ProjectState {
  switch (action.type) {
    case 'project.setLanguage':
      return { ...state, language: action.language }

    case 'class.add':
      return { ...state, classes: [...state.classes, makeClass()] }

    case 'class.delete': {
      const classes = state.classes.filter((c) => c.id !== action.classId)
      const relationships = state.relationships.filter(
        (r) => r.fromClassId !== action.classId && r.toClassId !== action.classId,
      )
      return { ...state, classes, relationships }
    }

    case 'class.patch':
      return mapClass(state, action.classId, (c) => ({ ...c, ...action.patch }))

    case 'field.add':
      return mapClass(state, action.classId, (c) => ({
        ...c,
        fields: [...c.fields, makeField({ type: state.language === 'c' ? 'char*' : 'String' })],
      }))

    case 'field.delete':
      return mapClass(state, action.classId, (c) => ({ ...c, fields: c.fields.filter((f) => f.id !== action.fieldId) }))

    case 'field.patch':
      return mapClass(state, action.classId, (c) => ({
        ...c,
        fields: c.fields.map((f) => (f.id === action.fieldId ? { ...f, ...action.patch } : f)),
      }))

    case 'method.add':
      return mapClass(state, action.classId, (c) => ({ ...c, methods: [...c.methods, makeMethod()] }))

    case 'method.delete':
      return mapClass(state, action.classId, (c) => ({
        ...c,
        methods: c.methods.filter((m) => m.id !== action.methodId),
      }))

    case 'method.patch':
      return mapClass(state, action.classId, (c) => ({
        ...c,
        methods: c.methods.map((m) => (m.id === action.methodId ? { ...m, ...action.patch } : m)),
      }))

    case 'param.add':
      return mapClass(state, action.classId, (c) => ({
        ...c,
        methods: c.methods.map((m) =>
          m.id === action.methodId
            ? { ...m, params: [...m.params, makeParam({ type: state.language === 'c' ? 'char*' : 'String' })] }
            : m,
        ),
      }))

    case 'param.delete':
      return mapClass(state, action.classId, (c) => ({
        ...c,
        methods: c.methods.map((m) =>
          m.id === action.methodId ? { ...m, params: m.params.filter((p) => p.id !== action.paramId) } : m,
        ),
      }))

    case 'param.patch':
      return mapClass(state, action.classId, (c) => ({
        ...c,
        methods: c.methods.map((m) =>
          m.id === action.methodId
            ? { ...m, params: m.params.map((p) => (p.id === action.paramId ? { ...p, ...action.patch } : p)) }
            : m,
        ),
      }))

    case 'rel.add': {
      const fromClassId = action.fromClassId ?? state.classes[0]?.id ?? ''
      const toClassId = action.toClassId ?? state.classes[1]?.id ?? state.classes[0]?.id ?? ''
      if (!fromClassId || !toClassId) return state
      return { ...state, relationships: [...state.relationships, makeRelationship(fromClassId, toClassId)] }
    }

    case 'rel.delete':
      return { ...state, relationships: state.relationships.filter((r) => r.id !== action.relId) }

    case 'rel.patch':
      return {
        ...state,
        relationships: state.relationships.map((r) => (r.id === action.relId ? { ...r, ...action.patch } : r)),
      }

    default:
      return state
  }
}

export function createInitialState(): ProjectState {
  return makeInitialState()
}


