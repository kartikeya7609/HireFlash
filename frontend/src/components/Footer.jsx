import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, ShieldCheck } from 'lucide-react';
import { BrandLogo, BRAND_NAME } from './BrandLogo';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="hidden md:block w-full bg-slate-900 text-slate-300 font-sans border-t border-slate-800">

      {/* Action Segment: Back to Top */}
      <button
        onClick={scrollToTop}
        className="w-full py-3.5 bg-slate-800 hover:bg-slate-700/80 text-center text-xs font-bold uppercase tracking-widest text-slate-200 transition-colors duration-200 border-b border-slate-700/40"
      >
        Back to top
      </button>

      {/* Main Structural Directories Matrix */}
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 items-start">

          {/* Corporate Brand Identity */}
          <div className="space-y-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-lg font-black tracking-tight text-white transition-opacity hover:opacity-90"
            >
              <BrandLogo size={22} />
              <span>{BRAND_NAME}</span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              HireFlash is an enterprise digital marketplace connecting background-vetted specialists with commercial and residential demand pipelines. Complete infrastructure transparency enforced globally.
            </p>
          </div>

          {/* Directory Column 1: Core Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Get to Know Us</h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-400">
              <li>
                <Link to="/" className="hover:text-amber-400 hover:underline transition-all">Home Interface</Link>
              </li>
              <li>
                <Link to="/workers" className="hover:text-amber-400 hover:underline transition-all">Specialist Directory</Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-amber-400 hover:underline transition-all">Partner Registration</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-amber-400 hover:underline transition-all">Account Hub</Link>
              </li>
            </ul>
          </div>

          {/* Directory Column 2: System Sectors */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Core Disciplines</h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-400">
              <li>
                <Link to="/workers?category=Plumbing" className="hover:text-amber-400 hover:underline transition-all">Fluid Logistics & Plumbing</Link>
              </li>
              <li>
                <Link to="/workers?category=Electrical" className="hover:text-amber-400 hover:underline transition-all">Electrical Systems Engineering</Link>
              </li>
              <li>
                <Link to="/workers?category=Cleaning" className="hover:text-amber-400 hover:underline transition-all">Sanitation & Deep Cleaning</Link>
              </li>
              <li>
                <Link to="/workers?category=Carpentry" className="hover:text-amber-400 hover:underline transition-all">Structural Woodwork & Carpentry</Link>
              </li>
            </ul>
          </div>

          {/* Directory Column 3: Help & Logistics */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Let Us Help You</h4>
            <div className="text-xs text-slate-400 space-y-2 font-normal leading-relaxed">
              <p>
                <span className="font-bold text-slate-300 block">Helpdesk Terminal:</span>
                support@fashire.com
              </p>
              <p>
                <span className="font-bold text-slate-300 block">Corporate Dispatch:</span>
                +1 (800) 555-HIRE
              </p>
              <p>
                <span className="font-bold text-slate-300 block">Operations Frequency:</span>
                24/7 Monitoring Desk Active
              </p>
            </div>
          </div>

        </div>

        {/* Global Infrastructure Indicators */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-6 text-xs text-slate-500 font-bold uppercase tracking-widest">
          <div className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-800 rounded-lg bg-slate-950/40">
            <Globe size={13} className="text-slate-400" />
            <span>English (USD)</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-800 rounded-lg bg-slate-950/40">
            <ShieldCheck size={13} className="text-amber-400" />
            <span>MERN Stack Scaled</span>
          </div>
        </div>
      </div>

      {/* Deep Footer Bottom Bar */}
      <div className="w-full bg-slate-950 py-5 text-center text-[10px] text-slate-500 font-medium uppercase tracking-wider px-4 border-t border-slate-900">
        <p className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          <span>&copy; {new Date().getFullYear()} HireFlash Marketplace Inc. All rights reserved.</span>
          <span className="hidden sm:inline text-slate-800">•</span>
          <span className="hover:text-slate-400 cursor-pointer transition-colors">Conditions of Use</span>
          <span className="hidden sm:inline text-slate-800">•</span>
          <span className="hover:text-slate-400 cursor-pointer transition-colors">Privacy Notice</span>
          <span className="hidden sm:inline text-slate-800">•</span>
          <span>Encrypted Node Gateway</span>
        </p>
      </div>

    </footer>
  );
};

export default Footer;