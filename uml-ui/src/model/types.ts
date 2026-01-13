export type Language = 'java' | 'c'

export type Visibility = 'private' | 'public' | 'protected'

export type ClassKind = 'class' | 'abstract_class' | 'interface'

export type MethodKind = 'concrete' | 'abstract'

export type RelationshipType = 'extends' | 'implements' | 'aggregation' | 'composition'

export type Multiplicity = '' | '1' | '*'

export interface ParamDef {
  id: string
  name: string
  type: string
}

export interface MethodDef {
  id: string
  name: string
  visibility: Visibility
  kind: MethodKind
  returnType: string
  params: ParamDef[]
}

export interface FieldDef {
  id: string
  name: string
  visibility: Visibility
  type: string
}

export interface ClassDef {
  id: string
  name: string
  kind: ClassKind
  /** Generic parameter name (single param for now), e.g. `Prey` in `Predator<Prey>` */
  genericParam?: string
  fields: FieldDef[]
  methods: MethodDef[]
}

export interface RelationshipDef {
  id: string
  type: RelationshipType
  fromClassId: string
  toClassId: string
  /** Multiplicity on the `to` side (e.g. `*`). */
  toMultiplicity: Multiplicity
}

export interface ProjectState {
  language: Language
  classes: ClassDef[]
  relationships: RelationshipDef[]
}


