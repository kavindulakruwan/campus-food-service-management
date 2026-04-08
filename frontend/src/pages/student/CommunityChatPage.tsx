import CommunityChat from '../../components/ui/CommunityChat'

const CommunityChatPage = () => {
  return (
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-3xl border border-cyan-100 bg-[radial-gradient(circle_at_10%_20%,#dcfce7_0%,#ecfeff_45%,#ffffff_100%)] p-7 shadow-[0_18px_45px_-35px_rgba(14,116,144,0.6)]">
        <div className="absolute -right-12 -top-14 h-44 w-44 rounded-full bg-emerald-200/30 blur-2xl" />
        <div className="absolute -bottom-12 left-1/3 h-36 w-36 rounded-full bg-cyan-200/30 blur-2xl" />

        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Student Community Hub</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-800 md:text-4xl">Community Chat</h1>
          <p className="mt-3 max-w-3xl text-slate-600 text-base md:text-lg">
            Connect with other students, exchange meal ideas, discuss nutrition goals, and solve
            daily campus food planning challenges together.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
        <CommunityChat />

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-500">Chat Tips</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>Ask specific questions for better meal suggestions.</li>
              <li>Share affordable and healthy meal combinations.</li>
              <li>Mention allergies and dietary restrictions clearly.</li>
              <li>Keep messages short and easy to follow.</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-linear-to-b from-emerald-50 to-white p-5 shadow-sm">
            <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-emerald-700">Community Rules</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>Be respectful to every student.</li>
              <li>No spam, ads, or unrelated content.</li>
              <li>Avoid sharing private personal information.</li>
              <li>Report harmful messages to admins.</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default CommunityChatPage
