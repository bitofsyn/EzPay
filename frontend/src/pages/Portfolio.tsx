import React, { useState } from 'react';
import HeroSection from '../components/portfolio/HeroSection';
import ProjectShowcase from '../components/portfolio/ProjectShowcase';
import SkillsSection from '../components/portfolio/SkillsSection';
import ContactSection from '../components/portfolio/ContactSection';

const Portfolio: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'about' | 'projects' | 'skills'>('about');

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            EzPay
          </div>
          <div className="flex gap-6">
            <button
              onClick={() => setActiveSection('about')}
              className={`text-sm font-medium transition-colors ${
                activeSection === 'about'
                  ? 'text-blue-400 border-b border-blue-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              About
            </button>
            <button
              onClick={() => setActiveSection('projects')}
              className={`text-sm font-medium transition-colors ${
                activeSection === 'projects'
                  ? 'text-blue-400 border-b border-blue-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Projects
            </button>
            <button
              onClick={() => setActiveSection('skills')}
              className={`text-sm font-medium transition-colors ${
                activeSection === 'skills'
                  ? 'text-blue-400 border-b border-blue-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Skills
            </button>
          </div>
        </div>
      </nav>

      <div className="pt-20">
        {/* Hero Section */}
        {activeSection === 'about' && <HeroSection />}

        {/* Project Showcase */}
        {activeSection === 'projects' && <ProjectShowcase />}

        {/* Skills Section */}
        {activeSection === 'skills' && <SkillsSection />}

        {/* Contact Section */}
        <ContactSection />
      </div>
    </div>
  );
};

export default Portfolio;
