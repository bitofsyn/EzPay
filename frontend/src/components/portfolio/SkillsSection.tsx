import React from 'react';

interface SkillCategory {
  category: string;
  skills: string[];
  icon: string;
}

const SkillCard: React.FC<SkillCategory> = ({ category, skills, icon }) => {
  return (
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{icon}</span>
        <h3 className="text-lg font-bold text-white">{category}</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, idx) => (
          <span
            key={idx}
            className="text-sm px-3 py-1 bg-cyan-500/10 text-cyan-300 rounded-full border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
};

const SkillsSection: React.FC = () => {
  const skillCategories: SkillCategory[] = [
    {
      category: 'Frontend',
      icon: '⚛️',
      skills: ['React', 'TypeScript', 'Tailwind CSS', 'Redux', 'React Query', 'Next.js']
    },
    {
      category: 'Backend',
      icon: '🔧',
      skills: ['Spring Boot', 'Node.js', 'PostgreSQL', 'JWT', 'REST API', 'Microservices']
    },
    {
      category: 'AI & Data',
      icon: '🤖',
      skills: ['FastAPI', 'TensorFlow', 'Python', 'Data Analysis', 'Machine Learning', 'Kafka']
    },
    {
      category: 'DevOps & Tools',
      icon: '🚀',
      skills: ['Docker', 'Git', 'GitHub', 'AWS', 'Linux', 'CI/CD']
    },
    {
      category: 'Design & UX',
      icon: '🎨',
      skills: ['Figma', 'UI Design', 'Responsive Design', 'Accessibility', 'Animation', 'Prototyping']
    },
    {
      category: 'Soft Skills',
      icon: '💡',
      skills: ['Problem Solving', 'Communication', 'Leadership', 'Agile', 'Code Review', 'Mentoring']
    }
  ];

  return (
    <section id="skills" className="min-h-screen px-6 py-20 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16 text-center">
          <h2 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Skills & Tech Stack
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            A diverse toolkit for building modern, scalable applications
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {skillCategories.map((category, idx) => (
            <div key={idx} className="animate-fadeIn" style={{ animationDelay: `${idx * 50}ms` }}>
              <SkillCard {...category} />
            </div>
          ))}
        </div>

        {/* Experience Timeline */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-8">
          <h3 className="text-2xl font-bold mb-8 text-white">Experience & Expertise</h3>
          <div className="space-y-6">
            <div className="border-l-2 border-cyan-400 pl-6">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-lg font-bold text-cyan-400">Frontend Development</h4>
                <span className="text-sm text-slate-400">2+ years</span>
              </div>
              <p className="text-slate-300">
                Specialized in building responsive, accessible UIs with React and modern CSS. 
                Experienced in state management, performance optimization, and component design.
              </p>
            </div>

            <div className="border-l-2 border-blue-400 pl-6">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-lg font-bold text-blue-400">Full Stack Development</h4>
                <span className="text-sm text-slate-400">2+ years</span>
              </div>
              <p className="text-slate-300">
                Building end-to-end applications with Spring Boot backend and React frontend. 
                Proficient in database design, API development, and cloud deployment.
              </p>
            </div>

            <div className="border-l-2 border-cyan-400 pl-6">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-lg font-bold text-cyan-400">Fintech Solutions</h4>
                <span className="text-sm text-slate-400">Current</span>
              </div>
              <p className="text-slate-300">
                Currently focused on building EzPay - a comprehensive fintech platform with 
                advanced analytics, AI insights, and secure transaction handling.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;
