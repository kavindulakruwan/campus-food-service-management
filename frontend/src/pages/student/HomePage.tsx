import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { Sparkles, ArrowRight, ShieldCheck, HeartPulse, Clock, ArrowUpRight } from 'lucide-react';

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="min-h-screen bg-slate-50 font-sans overflow-x-hidden">
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-200/40 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-200/30 rounded-full blur-[120px] pointer-events-none"></div>

      <nav className="fixed top-0 inset-x-0 z-50 bg-white/60 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="text-white w-4 h-4" />
            </div>
            <span className="text-xl font-extrabold text-slate-800 tracking-tight">CampusFood</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors hidden sm:block">
              Sign In
            </Link>
            <Link
              to={isAuthenticated ? '/dashboard' : '/register'}
              className="group flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-600 shadow-lg shadow-slate-900/10 hover:shadow-emerald-600/20">
              {isAuthenticated ? 'Open Dashboard' : 'Get Started'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 lg:pb-32 px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/50 text-emerald-700 text-sm font-semibold mb-8 shadow-sm">
          <Sparkles className="w-4 h-4" />
          <span>The Ultimate Student Meal OS</span>
        </div>
        
        <h1 className="text-5xl sm:text-7xl font-extrabold text-slate-900 tracking-tight max-w-4xl leading-[1.1] mb-8">
          Eat better. Save money.
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">
            Master your campus life.
          </span>
        </h1>
        
        <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mb-10 leading-relaxed">
          Join thousands of students managing their meal plans, tracking pantry stock, and splitting groceries effortlessly in one incredible workspace.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            to={isAuthenticated ? '/dashboard' : '/register'}
            className="flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 py-4 text-base font-bold text-white transition-all hover:bg-emerald-700 hover:scale-105 shadow-xl shadow-emerald-600/20"
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Start for free'}
            <ArrowRight className="w-5 h-5 flex-shrink-0" />
          </Link>
          <a
            href="#features"
            className="flex items-center justify-center gap-2 rounded-full bg-white border border-slate-200 px-8 py-4 text-base font-bold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300"
          >
            Explore features
          </a>
        </div>
      </section>

      <section id="features" className="py-24 bg-white relative border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need for campus meals</h2>
            <p className="text-slate-500">Built for the modern student lifestyle.</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Smart Meal Planning', desc: 'Drag, drop, and duplicate weekly meals with ease.', icon: <HeartPulse className="w-6 h-6 text-rose-500" />, bg: 'bg-rose-50' },
              { title: 'Pantry Inventory', desc: 'Never let groceries expire. Get smart alerts directly.', icon: <Clock className="w-6 h-6 text-orange-500" />, bg: 'bg-orange-50' },
              { title: 'Budget Allocation', desc: 'Sync your allowances to your meal schedule automatically.', icon: <ShieldCheck className="w-6 h-6 text-emerald-500" />, bg: 'bg-emerald-50' }
            ].map((i, idx) => (
              <div key={idx} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                <div className={'w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ' + i.bg}>
                  {i.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{i.title}</h3>
                <p className="text-slate-500 leading-relaxed">{i.desc}</p>
                <div className="mt-6 flex items-center text-sm font-semibold text-emerald-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                  Learn more <ArrowUpRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="text-white w-4 h-4" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">CampusFood</span>
          </div>
          <p className="text-sm text-slate-500 max-w-sm">
            The platform for university students to manage their dining balances, pantry stocks, and weekly meal preps together.
          </p>
          <div className="mt-12 pt-8 border-t border-slate-800 text-sm flex justify-between items-center text-slate-500">
            <p>© {new Date().getFullYear()} CampusFood Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
