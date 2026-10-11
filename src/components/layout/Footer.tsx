import React, { useState } from 'react';
import { 
  ArrowUp, 
  Send, 
  Check, 
  Mail, 
  MapPin, 
  Phone, 
  Clock, 
  Github, 
  Linkedin, 
  Facebook, 
  Twitter, 
  Youtube,
  ShieldCheck
} from 'lucide-react';
import { storage } from '../../services/storage';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [newsletterError, setNewsletterError] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      setNewsletterError('Please enter a valid academic email address.');
      return;
    }

    const success = storage.subscribeNewsletter(newsletterEmail);
    if (success) {
      setSubscribed(true);
      setNewsletterError('');
      setNewsletterEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    } else {
      setNewsletterError('This email is already subscribed to updates.');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#0B2A55] text-white pt-14 pb-8 border-t border-[#0A1F44]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main 4-column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* Column 1: Brand & Tagline */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={() => onNavigate('/')}>
              <div className="relative w-8 h-8 rounded-full bg-white p-0.5 shadow-sm flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle cx="50" cy="50" r="48" fill="#0B2A55" />
                  <path d="M2 50 A48 48 0 0 1 98 50 Z" fill="#E53935" />
                  <path d="M2 50 A48 48 0 0 0 98 50 Z" fill="#FFFFFF" />
                  <line x1="2" y1="50" x2="98" y2="50" stroke="#0B2A55" strokeWidth="8" />
                  <circle cx="50" cy="50" r="18" fill="#0B2A55" />
                  <circle cx="50" cy="50" r="12" fill="#FFFFFF" />
                  <circle cx="50" cy="50" r="6" fill="#FFC83D" />
                </svg>
              </div>
              <div className="flex items-baseline font-heading tracking-tight">
                <span className="text-2xl font-extrabold text-white">Collab</span>
                <span className="text-2xl font-black text-[#FFC83D]">X</span>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              CollabX brings students, researchers and supervisors into one place to discover, connect and collaborate. Research Ideas · Connect People · Build the Future.
            </p>

            <div className="pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Connect With Us</span>
              <div className="flex items-center gap-3">
                <a href="https://github.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#0B6BE6] flex items-center justify-center transition-colors">
                  <Github className="w-4 h-4 text-white" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#0B6BE6] flex items-center justify-center transition-colors">
                  <Linkedin className="w-4 h-4 text-white" />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#0B6BE6] flex items-center justify-center transition-colors">
                  <Facebook className="w-4 h-4 text-white" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#0B6BE6] flex items-center justify-center transition-colors">
                  <Twitter className="w-4 h-4 text-white" />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#E53935] flex items-center justify-center transition-colors">
                  <Youtube className="w-4 h-4 text-white" />
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#FFC83D]">Quick Navigation</h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li>
                <button onClick={() => onNavigate('/')} className="hover:text-white hover:underline cursor-pointer">
                  Home / Overview
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/research-areas')} className="hover:text-white hover:underline cursor-pointer">
                  Explore Research Areas
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/projects')} className="hover:text-white hover:underline cursor-pointer">
                  Browse Active Projects
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/papers')} className="hover:text-white hover:underline cursor-pointer">
                  Research Papers Library
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/ai-writer')} className="hover:text-white hover:underline cursor-pointer flex items-center gap-1">
                  <span>AI Paper Writer</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-[#FFC83D] text-[#0B2A55] rounded font-bold">New</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/about')} className="hover:text-white hover:underline cursor-pointer">
                  About CollabX Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Support & Legal */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#FFC83D]">Support & Policies</h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li>
                <button onClick={() => onNavigate('/about')} className="hover:text-white hover:underline cursor-pointer">
                  Help Center / FAQ
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/contact')} className="hover:text-white hover:underline cursor-pointer">
                  Contact Us & Inquiry
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/contact')} className="hover:text-white hover:underline cursor-pointer">
                  Report a Problem
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/legal')} className="hover:text-white hover:underline cursor-pointer">
                  Academic Integrity Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/legal')} className="hover:text-white hover:underline cursor-pointer">
                  Privacy Policy & Data Security
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/legal')} className="hover:text-white hover:underline cursor-pointer">
                  Terms of Use & Code of Conduct
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Newsletter */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#FFC83D]">Institutional Contact</h4>
            <div className="space-y-2 text-xs text-gray-300">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#FFC83D] shrink-0 mt-0.5" />
                <span>Port City International University, Chattogram, Bangladesh</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#FFC83D] shrink-0" />
                <span>support.collabx@pciu.edu.bd</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#FFC83D] shrink-0" />
                <span>+880 31-2869877</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#FFC83D] shrink-0" />
                <span>Sun – Thu: 9:00 AM – 5:00 PM (BST)</span>
              </div>
            </div>

            {/* Newsletter Form */}
            <div className="pt-2">
              <span className="text-xs font-semibold text-white block mb-1.5">
                Subscribe for Research Calls
              </span>
              <form onSubmit={handleSubscribe} className="space-y-1.5">
                <div className="flex gap-1.5">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="student@pciu.edu.bd"
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-hidden focus:border-[#0B6BE6]"
                  />
                  <button
                    type="submit"
                    className="bg-[#0E9F6E] hover:bg-[#0b8259] px-3 py-1.5 rounded-xl text-white font-bold text-xs transition-colors flex items-center justify-center cursor-pointer shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                {subscribed && (
                  <p className="text-[11px] text-[#0E9F6E] flex items-center gap-1 font-semibold">
                    <Check className="w-3 h-3" /> Subscribed successfully!
                  </p>
                )}
                {newsletterError && (
                  <p className="text-[11px] text-[#F87171]">{newsletterError}</p>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>
            © {new Date().getFullYear()} CollabX · Built for DBMS Sessional (CSE 222), Port City International University
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-gray-300">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0E9F6E]" />
              Institutional Research Platform
            </span>
            <button
              onClick={scrollToTop}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1"
              title="Back to top"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Top</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
