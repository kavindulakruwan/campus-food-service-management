const AdminHomePage = () => {
  return (
    <section className="space-y-4">
      <p className="text-xs uppercase tracking-widest text-orange-600">Admin Space</p>
      <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard Scaffold</h1>
      <p className="text-slate-600">
        This page is ready for admin-only features such as user management, reports, and moderation workflows.
      </p>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        Suggested next step: protect this route by role after auth middleware is added on backend and frontend.
      </div>
    </section>
  )
}

export default AdminHomePage
