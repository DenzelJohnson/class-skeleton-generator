import type { Dispatch } from 'react'
import type { Action } from '../model/store'
import type { ClassDef, Language, MethodKind, Visibility } from '../model/types'
import { TypeSelect } from './TypeSelect'
import { CONSTRUCTOR_RETURN_TYPE } from '../model/sentinels'

const VISIBILITIES: Visibility[] = ['private', 'public', 'protected']
const METHOD_KINDS: MethodKind[] = ['concrete', 'abstract']

function visibilityLabel(v: Visibility): string {
  if (v === 'private') return 'private (-)'
  if (v === 'public') return 'public (+)'
  return 'protected (#)'
}

function methodKindLabel(k: MethodKind): string {
  return k === 'abstract' ? 'Abstract' : 'Concrete'
}

export function ClassEditor({
  classes,
  language,
  dispatch,
}: {
  classes: ClassDef[]
  language: Language
  dispatch: Dispatch<Action>
}) {
  return (
    <section className="panel">
      <header className="panelHeader">
        <h2>Classes</h2>
        <button className="btn" onClick={() => dispatch({ type: 'class.add' })}>
          + Add class
        </button>
      </header>

      {classes.length === 0 ? (
        <div className="emptyState">
          Add your first class to begin. You can mark it as an interface and add fields/methods below.
        </div>
      ) : null}

      <div className="stack">
        {classes.map((c) => (
          <div key={c.id} className="card classCard">
            <div className="cardHeader">
              <div className="row rowWrap">
                <label className="field">
                  <div className="label">Class name</div>
                  <input
                    className="input"
                    value={c.name}
                    placeholder="e.g. RiverArray"
                    onChange={(e) =>
                      dispatch({
                        type: 'class.patch',
                        classId: c.id,
                        patch: { name: e.target.value },
                      })
                    }
                  />
                </label>

                <label className="field">
                  <div className="label">Kind</div>
                  <select
                    className="select"
                    value={c.kind}
                    onChange={(e) =>
                      dispatch({
                        type: 'class.patch',
                        classId: c.id,
                        patch: { kind: e.target.value as ClassDef['kind'] },
                      })
                    }
                  >
                    <option value="class">class</option>
                    <option value="abstract_class">abstract class</option>
                    <option value="interface">interface</option>
                  </select>
                </label>

                <label className="field">
                  <div className="label">Generic parameter (optional)</div>
                  <div className="genericField">
                    <span className="genericAffix">&lt;</span>
                    <input
                      className="input genericInput"
                      value={c.genericParam ?? ''}
                      placeholder="Type param"
                      onChange={(e) =>
                        dispatch({
                          type: 'class.patch',
                          classId: c.id,
                          patch: { genericParam: e.target.value },
                        })
                      }
                    />
                    <span className="genericAffix">&gt;</span>
                  </div>
                </label>
              </div>

              <button className="btn btnDanger" onClick={() => dispatch({ type: 'class.delete', classId: c.id })}>
                Delete
              </button>
            </div>

            <div className="subSection">
              <div className="subHeader">
                <h3>Variables</h3>
                <button className="btn btnSmall" onClick={() => dispatch({ type: 'field.add', classId: c.id })}>
                  + Add variable
                </button>
              </div>
              {c.fields.length === 0 ? <div className="hint">No variables yet.</div> : null}
              <div className="stack">
                {c.fields.map((f) => (
                  <div key={f.id} className="row rowWrap">
                    <label className="field fieldTight">
                      <div className="label">Visibility</div>
                      <select
                        className="select"
                        value={f.visibility}
                        onChange={(e) =>
                          dispatch({
                            type: 'field.patch',
                            classId: c.id,
                            fieldId: f.id,
                            patch: { visibility: e.target.value as Visibility },
                          })
                        }
                      >
                        {VISIBILITIES.map((v) => (
                          <option key={v} value={v}>
                            {visibilityLabel(v)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="field">
                      <div className="label">Name</div>
                      <input
                        className="input"
                        value={f.name}
                        placeholder="e.g. randomizer"
                        onChange={(e) =>
                          dispatch({
                            type: 'field.patch',
                            classId: c.id,
                            fieldId: f.id,
                            patch: { name: e.target.value },
                          })
                        }
                      />
                    </label>

                    <label className="field">
                      <div className="label">Type</div>
                      <TypeSelect
                        language={language}
                        value={f.type}
                        includeVoid={false}
                        onChange={(next) =>
                          dispatch({
                            type: 'field.patch',
                            classId: c.id,
                            fieldId: f.id,
                            patch: { type: next },
                          })
                        }
                      />
                    </label>

                    <button
                      className="btn btnSmall btnDanger"
                      onClick={() => dispatch({ type: 'field.delete', classId: c.id, fieldId: f.id })}
                      aria-label="Delete variable"
                      title="Delete variable"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="subSection">
              <div className="subHeader">
                <h3>Methods</h3>
                <button className="btn btnSmall" onClick={() => dispatch({ type: 'method.add', classId: c.id })}>
                  + Add method
                </button>
              </div>
              {c.methods.length === 0 ? <div className="hint">No methods yet.</div> : null}

              <div className="stack">
                {c.methods.map((m) => (
                  <div key={m.id} className="methodCard">
                    <div className="row rowWrap">
                      <label className="field fieldTight">
                        <div className="label">Visibility</div>
                        <select
                          className="select"
                          value={m.visibility}
                          disabled={c.kind === 'interface'}
                          onChange={(e) =>
                            dispatch({
                              type: 'method.patch',
                              classId: c.id,
                              methodId: m.id,
                              patch: { visibility: e.target.value as Visibility },
                            })
                          }
                        >
                          {(c.kind === 'interface' ? (['public'] as Visibility[]) : VISIBILITIES).map((v) => (
                            <option key={v} value={v}>
                              {c.kind === 'interface' ? 'public (implicit)' : visibilityLabel(v)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="field">
                        <div className="label">Name</div>
                        <input
                          className="input"
                          value={m.returnType === CONSTRUCTOR_RETURN_TYPE ? c.name : m.name}
                          placeholder="e.g. flow"
                          disabled={m.returnType === CONSTRUCTOR_RETURN_TYPE}
                          onChange={(e) =>
                            dispatch({
                              type: 'method.patch',
                              classId: c.id,
                              methodId: m.id,
                              patch: { name: e.target.value },
                            })
                          }
                        />
                      </label>

                      <label className="field">
                        <div className="label">Return type</div>
                        <TypeSelect
                          language={language}
                          value={m.returnType}
                          includeVoid={true}
                          onChange={(next) =>
                            dispatch({
                              type: 'method.patch',
                              classId: c.id,
                              methodId: m.id,
                              patch: next === CONSTRUCTOR_RETURN_TYPE ? { returnType: next, kind: 'concrete' } : { returnType: next },
                            })
                          }
                        />
                      </label>

                      <label className="field fieldTight">
                        <div className="label">Kind</div>
                        <select
                          className="select"
                          value={m.kind}
                          disabled={m.returnType === CONSTRUCTOR_RETURN_TYPE}
                          onChange={(e) =>
                            dispatch({
                              type: 'method.patch',
                              classId: c.id,
                              methodId: m.id,
                              patch: { kind: e.target.value as MethodKind },
                            })
                          }
                        >
                          {METHOD_KINDS.map((k) => (
                            <option key={k} value={k}>
                              {methodKindLabel(k)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <button
                        className="btn btnSmall btnDanger"
                        onClick={() => dispatch({ type: 'method.delete', classId: c.id, methodId: m.id })}
                      >
                        Delete
                      </button>
                    </div>

                    <div className="params">
                      <div className="subHeader">
                        <h4>Parameters</h4>
                        <button
                          className="btn btnSmall"
                          onClick={() => dispatch({ type: 'param.add', classId: c.id, methodId: m.id })}
                        >
                          + Add parameter
                        </button>
                      </div>

                      {m.params.length === 0 ? <div className="hint">No parameters.</div> : null}

                      <div className="stack">
                        {m.params.map((p) => (
                          <div key={p.id} className="row rowWrap">
                            <label className="field">
                              <div className="label">Name</div>
                              <input
                                className="input"
                                value={p.name}
                                placeholder="e.g. seed"
                                onChange={(e) =>
                                  dispatch({
                                    type: 'param.patch',
                                    classId: c.id,
                                    methodId: m.id,
                                    paramId: p.id,
                                    patch: { name: e.target.value },
                                  })
                                }
                              />
                            </label>

                            <label className="field">
                              <div className="label">Type</div>
                              <TypeSelect
                                language={language}
                                value={p.type}
                                includeVoid={false}
                                onChange={(next) =>
                                  dispatch({
                                    type: 'param.patch',
                                    classId: c.id,
                                    methodId: m.id,
                                    paramId: p.id,
                                    patch: { type: next },
                                  })
                                }
                              />
                            </label>

                            <button
                              className="btn btnSmall btnDanger"
                              onClick={() =>
                                dispatch({
                                  type: 'param.delete',
                                  classId: c.id,
                                  methodId: m.id,
                                  paramId: p.id,
                                })
                              }
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}


