import './App.css'
import { useReducer } from 'react'
import { ClassEditor } from './components/ClassEditor'
import { RelationshipsEditor } from './components/RelationshipsEditor'
import { Outputs } from './components/Outputs'
import { createInitialState, reducer } from './model/store'

function App() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState)

  return (
    <div className="appShell">
      <header className="topBar">
        <div>
          <div className="title">UML → Skeleton</div>
          <div className="subtitle">Define classes, then generate a UML diagram and code skeletons.</div>
        </div>

        <div className="row">
          <label className="field fieldTight">
            <div className="label">Language</div>
            <select
              className="select"
              value={state.language}
              onChange={(e) => dispatch({ type: 'project.setLanguage', language: e.target.value as typeof state.language })}
            >
              <option value="java">Java</option>
              <option value="c">C</option>
            </select>
          </label>
        </div>
      </header>

      <main className="mainGrid">
        <div className="stack">
          <ClassEditor classes={state.classes} language={state.language} dispatch={dispatch} />
          <RelationshipsEditor classes={state.classes} relationships={state.relationships} dispatch={dispatch} />
        </div>

        <Outputs state={state} />
      </main>
    </div>
  )
}

export default App
