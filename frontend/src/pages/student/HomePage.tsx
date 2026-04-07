import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { ChefHat, ArrowRight, Wallet, Pizza, ChevronRight, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#Fdfbf7] font-sans overflow-x-hidden selection:bg-orange-400 selection:text-white">
      {/* Decorative Background Elements */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-200/30 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-200/30 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Navigation */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-700 transform ${isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'} bg-white/80 backdrop-blur-xl border-b border-orange-50 shadow-sm`}>
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center shadow-lg shadow-orange-300/30">
              <ChefHat className="text-white w-5 h-5" />
            </div>
            <span className="text-2xl font-extrabold text-slate-700 tracking-tight">Campus<span className="text-orange-500">Bites</span></span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm font-bold text-slate-500 hover:text-orange-500 transition-colors hidden sm:block">
              Log in
            </Link>
            <Link
              to={isAuthenticated ? '/dashboard' : '/register'}
              className="group flex items-center gap-2 rounded-full bg-orange-50 px-6 py-2.5 text-sm font-bold text-orange-600 border border-orange-200 transition-all hover:bg-orange-500 hover:text-white shadow-md shadow-orange-100 hover:shadow-orange-400/30 hover:-translate-y-0.5">
              {isAuthenticated ? 'My Dashboard' : 'Join Now'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 lg:pb-32 px-6 lg:px-8 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        
        {/* Left Content */}
        <div className={`flex-1 text-center lg:text-left transition-all duration-1000 delay-100 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-orange-100 text-orange-600 text-sm font-bold mb-8 shadow-sm">
            <Pizza className="w-4 h-4" />
            <span>Smarter University Dining</span>
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-extrabold text-slate-800 tracking-tight leading-[1.1] mb-6">
            Master your meals. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-400">
              Fuel your grades.
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-500 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
            The ultimate food management OS for students. Pre-order meals, skip the cafeteria lines, track your budget, and eat healthier all across campus.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link
              to={isAuthenticated ? '/dashboard' : '/register'}
              className="flex items-center justify-center gap-2 rounded-full bg-orange-500 px-8 py-4 text-lg font-bold text-white transition-all hover:bg-orange-600 hover:scale-105 shadow-xl shadow-orange-500/20"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Get Started Free'}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#features"
              className="flex items-center justify-center gap-2 rounded-full bg-white border border-slate-200 px-8 py-4 text-lg font-bold text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300 shadow-sm"
            >
              See how it works
            </a>
          </div>
        </div>

        {/* Right Interactive Graphics / Popups */}
        <div className="flex-1 relative w-full h-[600px] hidden lg:block">
          {/* Main appetizing background image */}
          <div className={`absolute top-4 right-4 w-[85%] h-[85%] rounded-[2.5rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(249,115,22,0.2)] transition-all duration-1000 delay-300 transform ${isLoaded ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'}`}>
            <img 
              src="https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&q=80&w=800" 
              alt="Delicious campus food" 
              className="w-full h-full object-cover transition-transform duration-[10s] hover:scale-110" 
            />
            {/* Subtle Gradient Overlay mapped to lighter orange */}
            <div className="absolute inset-0 bg-gradient-to-t from-orange-950/70 via-orange-950/10 to-transparent"></div>
            
            {/* Overlay Text inside the hero image */}
            <div className="absolute bottom-8 left-8 text-white">
              <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold mb-3 border border-white/30 shadow-sm">Today's Special</div>
              <h3 className="text-3xl font-bold mb-1 drop-shadow-md">Spicy Chicken Bowl</h3>
              <p className="text-white/90 font-medium drop-shadow-md">Available at Main Cafeteria</p>
            </div>
          </div>

          {/* Floating UI Card - Order Ready notification */}
          <div className={`absolute top-16 -left-6 bg-white/95 backdrop-blur-xl p-4 rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center gap-4 transition-all duration-700 delay-700 transform hover:-translate-y-2 cursor-pointer ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <img 
              src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=150" 
              alt="Pizza slice" 
              className="w-16 h-16 rounded-2xl object-cover shadow-sm" 
            />
            <div>
              <p className="text-sm font-bold text-slate-700 flex items-center gap-2">Order Ready! <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-200"></span></p>
              <p className="text-xs text-slate-500 font-medium">Pick up Kottu at Counter 2</p>
            </div>
          </div>
        </div>

      </section>

      {/* New Moving Image Bar / Marquee Section */}
      <section className="relative py-10 bg-white border-y border-slate-100 overflow-hidden shadow-[inset_0_10px_20px_-15px_rgba(0,0,0,0.05)]">
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-scroll {
            animation: scroll 40s linear infinite;
          }
          .animate-scroll:hover {
            animation-play-state: paused;
          }
        `}} />
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10"></div>
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10"></div>
        
        <div className="flex animate-scroll w-[200%] items-center gap-8 px-4">
          {/* Double array to create seamless loop effect */}
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-8">
              {[
                { url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=300", alt: "Pizza" },
                { url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=300", alt: "Burger" },
                { url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300", alt: "Healthy Bowl" },
                { url: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=300", alt: "Burger Combo" },
                { url: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&q=80&w=300", alt: "Sandwich" },
                { url: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&q=80&w=300", alt: "Pancakes" }
              ].map((img, idx) => (
                <div key={idx} className="relative group overflow-hidden rounded-2xl w-64 h-40 flex-shrink-0 shadow-lg cursor-pointer">
                  <img 
                    src={img.url} 
                    alt={img.alt} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors duration-500"></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-[#Fdfbf7] relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-800 mb-4">Designed for Campus Life</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Everything you need to eat well, save time between lectures, and manage your dining budget in one place.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Skip the Lines', desc: 'Order 15-30 minutes in advance. Just walk up, show your digital receipt, and grab your food.', icon: <Clock className="w-8 h-8 text-orange-500" />, bg: 'bg-white', border: 'border-orange-100 shadow-sm shadow-orange-100/30' },
              { title: 'Smart Budgeting', desc: 'Track your spending. Top up your RFID card securely using LankaQR or PayPal via our portal.', icon: <Wallet className="w-8 h-8 text-sky-500" />, bg: 'bg-white', border: 'border-sky-100 shadow-sm shadow-sky-100/30' },
              { title: 'AI Meal Assistant', desc: 'Need food ideas? Our dedicated AI chatbot knows every cafeteria menu and suggests the best meals for you.', icon: <ChefHat className="w-8 h-8 text-emerald-500" />, bg: 'bg-white', border: 'border-emerald-100 shadow-sm shadow-emerald-100/30' }
            ].map((feature, idx) => (
              <div key={idx} className={`p-8 rounded-3xl ${feature.bg} border ${feature.border} hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 hover:-translate-y-2 group bg-opacity-70 backdrop-blur-sm`}>
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 border border-slate-100">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-700 mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed mb-6 font-medium">{feature.desc}</p>
                <div className="flex items-center text-sm font-bold text-slate-500 group-hover:text-orange-500 transition-colors">
                  Explore Feature <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white text-slate-500 py-16 border-t border-orange-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100/40 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-100/40 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2"></div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center shadow-md shadow-orange-300/30">
              <ChefHat className="text-white w-5 h-5" />
            </div>
            <span className="text-2xl font-extrabold text-slate-700 tracking-tight">Campus<span className="text-orange-500">Bites</span></span>
          </div>
          <p className="text-slate-500 max-w-sm mb-12 text-lg font-medium">
            Streamlining university dining. Eat better, budget smarter, and never wait in a cafeteria line again.
          </p>
          <div className="pt-8 border-t border-slate-100 text-sm flex flex-col md:flex-row justify-between items-center text-slate-400 gap-4 font-semibold">
            <p>© {new Date().getFullYear()} CampusBites. Built for University Students.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-orange-500 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-orange-500 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-orange-500 transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
