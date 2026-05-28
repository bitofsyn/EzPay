import React from 'react';

const HeroSection: React.FC = () => {
  return (
    <section className="min-h-screen flex items-center justify-center px-6 py-20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        {/* Left side - Text content */}
        <div className="space-y-8 animate-fadeIn">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Frontend Portfolio
              </span>
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed">
              Building scalable fintech solutions with modern technologies
            </p>
          </div>

          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>
              I&apos;m a frontend developer passionate about creating beautiful and performant user interfaces. 
              With expertise in React, TypeScript, and Tailwind CSS, I build applications that combine 
              elegant design with solid engineering practices.
            </p>
            <p>
              Currently focused on the EzPay project - a comprehensive financial platform that helps users 
              manage their accounts, analyze transactions, and get AI-powered insights.
            </p>
          </div>

          <div className="flex gap-4">
            <a
              href="#projects"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300"
            >
              View Projects
            </a>
            <a
              href="#contact"
              className="px-6 py-3 border border-slate-600 text-white font-medium rounded-lg hover:bg-slate-800/50 transition-all duration-300"
            >
              Get in Touch
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-8">
            <div className="border-l-2 border-blue-400 pl-4">
              <div className="text-2xl font-bold text-blue-400">5+</div>
              <p className="text-sm text-slate-400">Projects</p>
            </div>
            <div className="border-l-2 border-cyan-400 pl-4">
              <div className="text-2xl font-bold text-cyan-400">2+</div>
              <p className="text-sm text-slate-400">Years</p>
            </div>
            <div className="border-l-2 border-blue-400 pl-4">
              <div className="text-2xl font-bold text-blue-400">100%</div>
              <p className="text-sm text-slate-400">Dedication</p>
            </div>
          </div>
        </div>

        {/* Right side - Decorative element */}
        <div className="hidden md:flex items-center justify-center">
          <div className="relative w-full h-96 flex items-center justify-center">
            {/* Animated gradient blob */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl blur-3xl animate-pulse"></div>
            
            {/* Code preview */}
            <div className="relative bg-slate-900/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-md w-4/5">
              <div className="flex gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <pre className="text-sm text-cyan-400 font-mono">
                <code>{`const EzPay = () => {
  return (
    <Dashboard>
      <Analytics />
      <AIInsights />
    </Dashboard>
  );
};`}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
