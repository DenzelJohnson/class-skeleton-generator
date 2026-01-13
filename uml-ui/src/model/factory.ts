import type {
  ClassDef,
  FieldDef,
  Language,
  MethodKind,
  MethodDef,
  ParamDef,
  ProjectState,
  RelationshipDef,
  RelationshipType,
  Visibility,
} from './types'

function id(): string {
  return crypto.randomUUID()
}

export const DEFAULT_LANGUAGE: Language = 'java'
export const DEFAULT_FIELD_VISIBILITY: Visibility = 'private'
export const DEFAULT_FIELD_TYPE = 'String'
export const DEFAULT_METHOD_VISIBILITY: Visibility = 'public'
export const DEFAULT_METHOD_KIND: MethodKind = 'concrete'
export const DEFAULT_METHOD_RETURN_TYPE = 'void'
export const DEFAULT_PARAM_TYPE = 'String'
export const DEFAULT_RELATIONSHIP_TYPE: RelationshipType = 'extends'

export function makeParam(partial?: Partial<ParamDef>): ParamDef {
  return {
    id: id(),
    name: '',
    type: DEFAULT_PARAM_TYPE,
    ...partial,
  }
}

export function makeMethod(partial?: Partial<MethodDef>): MethodDef {
  return {
    id: id(),
    name: '',
    visibility: DEFAULT_METHOD_VISIBILITY,
    kind: DEFAULT_METHOD_KIND,
    returnType: DEFAULT_METHOD_RETURN_TYPE,
    params: [],
    ...partial,
  }
}

export function makeField(partial?: Partial<FieldDef>): FieldDef {
  return {
    id: id(),
    name: '',
    visibility: DEFAULT_FIELD_VISIBILITY,
    type: DEFAULT_FIELD_TYPE,
    ...partial,
  }
}

export function makeClass(partial?: Partial<ClassDef>): ClassDef {
  return {
    id: id(),
    name: '',
    kind: 'class',
    genericParam: '',
    fields: [],
    methods: [],
    ...partial,
  }
}

export function makeRelationship(
  fromClassId: string,
  toClassId: string,
  partial?: Partial<RelationshipDef>,
): RelationshipDef {
  return {
    id: id(),
    type: DEFAULT_RELATIONSHIP_TYPE,
    fromClassId,
    toClassId,
    toMultiplicity: '',
    ...partial,
  }
}

export function makeInitialState(): ProjectState {
  return {
    language: DEFAULT_LANGUAGE,
    classes: [],
    relationships: [],
  }
}


