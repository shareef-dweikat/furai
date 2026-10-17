import { useEffect, useState, type FormEvent } from 'react'
import { useAppStore } from './stores/use-app-store.ts'

function App() {
  const [title, setTitle] = useState('')
  const health = useAppStore((state) => state.health)
  const items = useAppStore((state) => state.items)
  const loading = useAppStore((state) => state.loading)
  const submitting = useAppStore((state) => state.submitting)
  const error = useAppStore((state) => state.error)
  const refresh = useAppStore((state) => state.refresh)
  const addItem = useAppStore((state) => state.addItem)

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextTitle = title.trim()
    if (!nextTitle) {
      return
    }

    try {
      await addItem(nextTitle)
      setTitle('')
    } catch {
      // The store records the message shown above the list.
    }
  }

  return (
    <main className="shell">
      <header className="masthead">
        <div>
          <p className="eyebrow">Furai</p>
          <h1>Notes</h1>
        </div>
        <p className={`status ${health ? 'status-ok' : ''}`}>
          {health ? 'API connected' : 'API offline'}
        </p>
      </header>

      <form className="composer" onSubmit={onSubmit}>
        <label htmlFor="title">New note</label>
        <div className="composer-row">
          <input
            id="title"
            name="title"
            value={title}
            maxLength={120}
            placeholder="What needs remembering?"
            onChange={(event) => setTitle(event.target.value)}
          />
          <button type="submit" disabled={submitting || title.trim().length === 0}>
            {submitting ? 'Saving' : 'Add'}
          </button>
        </div>
      </form>

      {error ? (
        <p className="banner" role="alert">
          {error}
        </p>
      ) : null}

      <section className="list" aria-live="polite">
        {loading && items.length === 0 ? <p className="muted">Loading notes…</p> : null}
        {!loading && items.length === 0 ? (
          <p className="muted">No notes yet. Add the first one.</p>
        ) : null}
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <p>{item.title}</p>
              <time dateTime={item.createdAt}>
                {new Date(item.createdAt).toLocaleString()}
              </time>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

export default App
