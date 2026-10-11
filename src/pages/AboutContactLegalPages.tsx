import React, { useState } from 'react';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle2, 
  ShieldCheck, 
  HelpCircle, 
  ChevronDown,
  ChevronUp,
  Inbox
} from 'lucide-react';
import { storage } from '../services/storage';

interface AboutPageProps {
  onNavigate: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Who can apply to research projects on CollabX?',
      a: 'All enrolled undergraduate and graduate students at Port City International University (and partnering institutions) can create a student profile and apply directly to open faculty-supervised projects.'
    },
    {
      q: 'How does the Recommendation Engine calculate match percentages?',
      a: 'The algorithm evaluates 40% research area & tags overlap, 35% verified technical skill coverage, 10% academic level alignment, 10% past behavioral activity, and 5% deadline proximity, generating personalized match percentages up to 99%.'
    },
    {
      q: 'Can students publish research papers on CollabX?',
      a: 'Yes! Both students and faculty can upload manuscripts and preprints in PDF format, complete with DOI registration, author lists, and in-browser reading.'
    },
    {
      q: 'What is the role of the AI Paper Writer?',
      a: 'The AI Paper Writer assists scholars in outlining, drafting sections, and verifying citations against real Crossref and OpenAlex DOIs. AI-assisted drafts are labeled transparently.'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-12 animate-fade-in">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#DCE6FB] text-[#0B6BE6]">
          About CollabX
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B2A55] tracking-tight">
          Research Ideas · Connect People · Build the Future
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          Developed for DBMS Sessional (CSE 222) at Port City International University. CollabX brings together students, researchers, and supervisors to discover research areas, collaborate on thesis projects, publish papers, and exchange ideas.
        </p>
      </div>

      {/* Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-[#E3EAF3] space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#DDF5EA] text-[#0E9F6E] flex items-center justify-center font-bold">
            01
          </div>
          <h3 className="font-bold text-base text-[#0B2A55]">Centralized Research Hub</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Eliminates siloed department research notices by compiling all faculty laboratories, funded research grants, and open undergraduate thesis seats into one real-time registry.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E3EAF3] space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#DEEBFB] text-[#0B6BE6] flex items-center justify-center font-bold">
            02
          </div>
          <h3 className="font-bold text-base text-[#0B2A55]">Intelligent Matching</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Multi-factor recommendation algorithms match students' verified programming proficiencies and research interests with suitable faculty supervisors.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E3EAF3] space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#FFE9DC] text-[#F05A28] flex items-center justify-center font-bold">
            03
          </div>
          <h3 className="font-bold text-base text-[#0B2A55]">Collaborative Workspaces</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Integrated milestone checklists, file exchanges, team discussion messaging, and an AI Paper Writer streamline scientific work from inception to defense.
          </p>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="bg-white rounded-3xl border border-[#E3EAF3] p-8 space-y-6 shadow-xs">
        <h2 className="text-xl font-bold text-[#0B2A55]">Frequently Asked Questions</h2>
        <div className="divide-y divide-gray-100">
          {faqs.map((faq, i) => (
            <div key={i} className="py-4">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between text-left font-bold text-sm text-[#0B2A55] hover:text-[#0B6BE6] cursor-pointer"
              >
                <span>{faq.q}</span>
                {openFaq === i ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {openFaq === i && (
                <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    storage.addContactMessage({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim() || 'General Inquiry',
      category,
      message: message.trim()
    });

    setSubmitted(true);
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-12 animate-fade-in">
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <h1 className="text-3xl font-extrabold text-[#0B2A55] tracking-tight">Contact Us</h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Have inquiries regarding project supervision, account verification, or system feedback? We are here to assist.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Contact Form */}
        <div className="bg-white rounded-3xl border border-[#E3EAF3] p-6 sm:p-8 space-y-4 shadow-xs">
          <h3 className="font-bold text-base text-[#0B2A55]">Send a Message</h3>

          {submitted && (
            <div className="p-4 bg-[#DDF5EA] border border-[#A7F3D0] rounded-2xl text-xs font-bold text-[#0E9F6E] flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Your inquiry has been submitted to the portal administrator!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-gray-700 block">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tanvir Ahmed"
                className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700 block">Academic Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tanvir@pciu.edu.bd"
                className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700 block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55]"
              >
                <option value="General Inquiry">General Inquiry</option>
                <option value="Account Verification">Account Verification (Faculty Badge)</option>
                <option value="Report a Problem">Report a Problem / Technical Bug</option>
                <option value="Research Sponsorship">Research Sponsorship</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700 block">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief topic of your inquiry"
                className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700 block">Message *</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Provide detailed description..."
                className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl p-3 text-[#0B2A55]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#0B6BE6] hover:bg-[#0956b8] text-white rounded-xl font-bold transition-colors cursor-pointer"
            >
              Submit Inquiry
            </button>
          </form>
        </div>

        {/* Institutional Contact Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-[#E3EAF3] p-6 sm:p-8 space-y-5 shadow-xs">
            <h3 className="font-bold text-base text-[#0B2A55]">Port City International University</h3>

            <div className="space-y-4 text-xs text-gray-600">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#0B6BE6] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#0B2A55] block">Main Campus</strong>
                  <span>7-14, Nikunja Housing Society, South Khulshi, Chattogram, Bangladesh</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#0E9F6E] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#0B2A55] block">Department Email</strong>
                  <span>cse.collabx@pciu.edu.bd / info@portcity.edu.bd</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#F05A28] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#0B2A55] block">Telephone</strong>
                  <span>+880 31-2869877, +880 31-2869899</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#5C54E5] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#0B2A55] block">Lab Advisory Office Hours</strong>
                  <span>Sunday – Thursday: 9:00 AM – 5:00 PM (BST)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LegalPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10 animate-fade-in text-xs sm:text-sm text-gray-700 leading-relaxed">
      <div>
        <h1 className="text-3xl font-extrabold text-[#0B2A55]">Policies & Institutional Guidelines</h1>
        <p className="text-xs text-gray-500 mt-1">Port City International University · CSE 222 Research Portal</p>
      </div>

      <div className="bg-white rounded-3xl border border-[#E3EAF3] p-8 space-y-4 shadow-xs">
        <h2 className="text-lg font-bold text-[#0B2A55]">1. Academic Integrity & Ethics Policy</h2>
        <p>
          Scholars submitting project applications, uploading code repositories, or publishing manuscripts must adhere strictly to academic anti-plagiarism standards. All research contributions must represent original intellectual work with appropriate citations.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-[#E3EAF3] p-8 space-y-4 shadow-xs">
        <h2 className="text-lg font-bold text-[#0B2A55]">2. Ethical AI Assistance Standards</h2>
        <p>
          Students utilizing the CollabX AI Paper Writer must disclose generative text assistance in accordance with faculty course guidelines. Verification of real DOIs and factual accuracy remains the sole responsibility of the submitting authors.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-[#E3EAF3] p-8 space-y-4 shadow-xs">
        <h2 className="text-lg font-bold text-[#0B2A55]">3. Privacy Policy & Data Protection</h2>
        <p>
          CollabX respects researcher data confidentiality. Academic contact information is visible only to verified institutional members. Student CV uploads are restricted strictly to the relevant project supervisor.
        </p>
      </div>
    </div>
  );
};
