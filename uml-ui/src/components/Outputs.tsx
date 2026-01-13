import { useEffect, useMemo, useState } from 'react'
import mermaid from 'mermaid'
import type { ProjectState } from '../model/types'
import { generateMermaidClassDiagram } from '../generators/mermaid'
import { generateJava } from '../generators/java'
import { generateCHeader, generateCSource } from '../generators/c'
import { generateAsciiUml } from '../generators/asciiUml'
import { copyToClipboard, downloadText } from '../utils/export'

let mermaidInitialized = false

function MermaidPreview({ code }: { code: string }) {
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (!mermaidInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'dark',
      })
      mermaidInitialized = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setError('')
    setSvg('')

    const id = `mmd-${Math.random().toString(16).slice(2)}`
    mermaid
      .render(id, code)
      .then((res) => {
        if (cancelled) return
        setSvg(res.svg)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : String(e))
      })

    return () => {
      cancelled = true
    }
  }, [code])

  return (
    <div className="umlPreview">
      {error ? <div className="errorBox">Mermaid render error: {error}</div> : null}
      <div className="svgBox" dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  )
}

export function Outputs({ state }: { state: ProjectState }) {
  const mermaidText = useMemo(() => generateMermaidClassDiagram(state), [state])
  const asciiUmlText = useMemo(() => generateAsciiUml(state), [state])
  const javaText = useMemo(() => generateJava(state), [state])
  const cHeaderText = useMemo(() => generateCHeader(state), [state])
  const cSourceText = useMemo(() => generateCSource(state), [state])
  const [toast, setToast] = useState<string>('')

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(''), 1600)
    return () => window.clearTimeout(t)
  }, [toast])

  return (
    <section className="panel">
      <header className="panelHeader">
        <h2>Outputs</h2>
        <div className="hint">UML is live-rendered from your inputs.</div>
      </header>

      <div className="stack">
        <div className="card">
          <div className="subHeader">
            <h3>UML Diagram</h3>
            <div className="hint">Mermaid classDiagram</div>
          </div>
          <MermaidPreview code={mermaidText} />
        </div>

        <div className="card">
          <div className="subHeader">
            <h3>UML Text</h3>
            <div className="row">
              <button
                className="btn btnSmall"
                onClick={async () =>
                  setToast((await copyToClipboard(asciiUmlText)) ? 'Copied UML text' : 'Copy failed')
                }
              >
                Copy
              </button>
              <button className="btn btnSmall" onClick={() => downloadText('diagram.txt', asciiUmlText)}>
                Download .txt
              </button>
              <button className="btn btnSmall" onClick={() => downloadText('diagram.mmd', mermaidText)}>
                Download .mmd
              </button>
            </div>
          </div>
          <textarea className="textarea" value={asciiUmlText} readOnly spellCheck={false} />
        </div>

        {state.language === 'java' ? (
          <div className="card">
            <div className="subHeader">
              <h3>Java Skeleton</h3>
              <div className="row">
                <button
                  className="btn btnSmall"
                  onClick={async () => setToast((await copyToClipboard(javaText)) ? 'Copied Java' : 'Copy failed')}
                >
                  Copy
                </button>
                <button className="btn btnSmall" onClick={() => downloadText('Generated.java', javaText)}>
                  Download
                </button>
              </div>
            </div>
            <textarea className="textarea" value={javaText} readOnly spellCheck={false} />
          </div>
        ) : (
          <div className="card">
            <div className="subHeader">
              <h3>C Skeleton</h3>
              <div className="row">
                <button
                  className="btn btnSmall"
                  onClick={async () =>
                    setToast(
                      (await copyToClipboard(cHeaderText + '\n\n' + cSourceText)) ? 'Copied C (.h + .c)' : 'Copy failed',
                    )
                  }
                >
                  Copy both
                </button>
                <button className="btn btnSmall" onClick={() => downloadText('generated.h', cHeaderText)}>
                  Download .h
                </button>
                <button className="btn btnSmall" onClick={() => downloadText('generated.c', cSourceText)}>
                  Download .c
                </button>
              </div>
            </div>
            <div className="stack">
              <div>
                <div className="hint" style={{ marginBottom: 6 }}>
                  generated.h
                </div>
                <textarea className="textarea" value={cHeaderText} readOnly spellCheck={false} />
              </div>
              <div>
                <div className="hint" style={{ marginBottom: 6 }}>
                  generated.c
                </div>
                <textarea className="textarea" value={cSourceText} readOnly spellCheck={false} />
              </div>
            </div>
          </div>
        )}

        {toast ? <div className="toast">{toast}</div> : null}
      </div>
    </section>
  )
}


