import CommunityChat from '../../components/ui/CommunityChat'

const CommunityChatPage = () => {
  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <header className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 shadow-sm">
        <div className="absolute -right-12 -top-14 h-44 w-44 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="absolute -bottom-12 left-1/4 h-36 w-36 rounded-full bg-purple-200/40 blur-3xl" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
            Student Hub
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">Community Chat</h1>
          <p className="mt-4 max-w-2xl text-base text-slate-600 md:text-lg leading-relaxed">
            Connect with peers, share your favorite meal hacks, and discover what's good at the campus dining halls today. Your campus food network starts here.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <div className="order-2 xl:order-1">
          <CommunityChat />
        </div>

        <aside className="order-1 flex flex-col gap-6 xl:order-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">Chat Tips</h2>
            </div>
            <ul className="mt-5 space-y-3">
              {[
                'Ask specific questions for better meal suggestions.',
                'Share affordable and healthy meal combinations.',
                'Mention allergies and dietary restrictions clearly.',
                'Keep messages short and easy to follow.'
              ].map((tip, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-600">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                    {i + 1}
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-indigo-100 bg-gradient-to-b from-indigo-50/50 to-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-900">Community Rules</h2>
            </div>
            <ul className="mt-5 space-y-3">
              {[
                'Be respectful to every student.',
                'No spam, ads, or unrelated content.',
                'Avoid sharing private personal information.',
                'Report harmful messages to admins.'
              ].map((rule, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default CommunityChatPage
