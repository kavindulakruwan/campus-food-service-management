import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { Sparkles, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  
  const [errorLocal, setErrorLocal] = useState('');
  const [loadingLocal, setLoadingLocal] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingLocal(true);
    setErrorLocal('');
    try {
      await registerUser(formData);
      navigate('/login');
    } catch (err: any) {
        if (err?.response?.data?.errors?.length > 0) {
          const firstError = err.response.data.errors[0];
          setErrorLocal(`${firstError.field === 'password' ? 'Password' : firstError.field}: ${firstError.message}`);
        } else {
          setErrorLocal(err?.response?.data?.message || 'Failed to register');
        }
    } finally {
        setLoadingLocal(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(90deg,#dff2ee_0%,#f8fbfb_50%,#dff2ee_100%)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8 group">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-orange-400 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <span className="text-2xl font-extrabold text-slate-800 tracking-tight">Campus<span className="text-orange-500">Bites</span></span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Create an account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-orange-600 underline decoration-orange-300 underline-offset-4 transition hover:text-orange-700 hover:decoration-orange-500"
          >
            Sign in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-300/30 sm:rounded-2xl sm:px-10 border border-slate-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
             {errorLocal && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-center">
                {errorLocal}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                Full Name
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="focus:ring-orange-400 focus:border-orange-400 block w-full pl-10 sm:text-sm border-slate-300 rounded-xl bg-slate-50 py-3 transition-colors hover:bg-white"
                  placeholder="Jane Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="focus:ring-orange-400 focus:border-orange-400 block w-full pl-10 sm:text-sm border-slate-300 rounded-xl bg-slate-50 py-3 transition-colors hover:bg-white"
                  placeholder="you@university.edu"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  minLength={8}
                  className="focus:ring-orange-400 focus:border-orange-400 block w-full pl-10 sm:text-sm border-slate-300 rounded-xl bg-slate-50 py-3 transition-colors hover:bg-white"
                  placeholder="••••••••"
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Must be at least 8 characters, and contain at least 1 uppercase letter and 1 number.
              </p>
            </div>

            <div>
               <button
                type="submit"
                disabled={loadingLocal}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loadingLocal ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Create account <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
