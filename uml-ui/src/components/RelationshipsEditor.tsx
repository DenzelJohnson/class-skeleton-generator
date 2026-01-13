import type { Dispatch } from 'react'
import type { Action } from '../model/store'
import type { ClassDef, Multiplicity, RelationshipDef, RelationshipType } from '../model/types'

const REL_TYPES: RelationshipType[] = ['extends', 'implements', 'aggregation', 'composition']
const MULTS: Multiplicity[] = ['', '1', '*']

function relLabel(t: RelationshipType): string {
  if (t === 'extends') return 'Inheritance (extends)'
  if (t === 'implements') return 'Interface (implements)'
  if (t === 'composition') return 'Composition'
  return 'Aggregation'
}

function relSentence(t: RelationshipType): string {
  if (t === 'extends') return 'EXTENDS'
  if (t === 'implements') return 'IMPLEMENTS'
  if (t === 'composition') return 'IS RELATED DEPENDENTLY TO'
  return 'IS RELATED INDEPENDENTLY TO'
}

export function RelationshipsEditor({
  classes,
  relationships,
  dispatch,
}: {
  classes: ClassDef[]
  relationships: RelationshipDef[]
  dispatch: Dispatch<Action>
}) {
  const canAdd = classes.length >= 1
  const nameOf = (id: string) => classes.find((c) => c.id === id)?.name || '(unnamed class)'

  return (
    <section className="panel">
      <header className="panelHeader">
        <h2>Relationships</h2>
        <button className="btn" disabled={!canAdd} onClick={() => dispatch({ type: 'rel.add' })}>
          + Add relationship
        </button>
      </header>

      {!canAdd ? <div className="emptyState">Add at least one class to create relationships.</div> : null}
      {canAdd && relationships.length === 0 ? (
        <div className="hint">Use relationships for inheritance, interface implementation, and aggregation.</div>
      ) : null}

      <div className="stack">
        {relationships.map((r) => (
          <div key={r.id} className="card">
            <div className="hint" style={{ marginBottom: 8 }}>
              {nameOf(r.fromClassId)} <strong>{relSentence(r.type)}</strong> {nameOf(r.toClassId)}
            </div>
            <div className="row rowWrap">
              <label className="field">
                <div className="label">Type</div>
                <select
                  className="select"
                  value={r.type}
                  onChange={(e) =>
                    dispatch({
                      type: 'rel.patch',
                      relId: r.id,
                      patch: { type: e.target.value as RelationshipType },
                    })
                  }
                >
                  {REL_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {relLabel(t)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <div className="label">Subject</div>
                <select
                  className="select"
                  value={r.fromClassId}
                  onChange={(e) =>
                    dispatch({
                      type: 'rel.patch',
                      relId: r.id,
                      patch: { fromClassId: e.target.value },
                    })
                  }
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || '(unnamed class)'}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <div className="label">Target</div>
                <select
                  className="select"
                  value={r.toClassId}
                  onChange={(e) =>
                    dispatch({
                      type: 'rel.patch',
                      relId: r.id,
                      patch: { toClassId: e.target.value },
                    })
                  }
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || '(unnamed class)'}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field fieldTight">
                <div className="label">To multiplicity</div>
                <select
                  className="select"
                  value={r.toMultiplicity}
                  onChange={(e) =>
                    dispatch({
                      type: 'rel.patch',
                      relId: r.id,
                      patch: { toMultiplicity: e.target.value as Multiplicity },
                    })
                  }
                >
                  {MULTS.map((m) => (
                    <option key={m || 'blank'} value={m}>
                      {m === '' ? '(none)' : m}
                    </option>
                  ))}
                </select>
              </label>

              <button className="btn btnDanger" onClick={() => dispatch({ type: 'rel.delete', relId: r.id })}>
                Delete
              </button>
            </div>

            <div className="hint" style={{ marginTop: 8 }}>
              {r.type === 'aggregation' || r.type === 'composition'
                ? 'Tip: use multiplicity * for “many” on the right-hand side.'
                : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}


