import type { ReactNode } from 'react'

interface ModulePlaceholderProps {
  title: string
  owner: string
  summary: string
  crudItems: string[]
  nextSteps: string[]
  children?: ReactNode
}

const ModulePlaceholder = ({
  title,
  owner,
  summary,
  crudItems,
  nextSteps,
  children,
}: ModulePlaceholderProps) => {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm uppercase tracking-widest text-orange-600">Owner: {owner}</p>
        <p className="text-slate-600">{summary}</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-slate-800">CRUD Scope</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            {crudItems.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-slate-800">Next Development Steps</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            {nextSteps.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </article>
      </div>

      {children}
    </section>
  )
}

export default ModulePlaceholder
