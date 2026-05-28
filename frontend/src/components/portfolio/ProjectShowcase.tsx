import React from 'react';

interface ProjectCardProps {
  title: string;
  description: string;
  features: string[];
  tech: string[];
  icon: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ title, description, features, tech, icon }) => {
  return (
    <div className="group bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2 text-white group-hover:text-blue-400 transition-colors">
        {title}
      </h3>
      <p className="text-slate-400 text-sm mb-4 leading-relaxed">
        {description}
      </p>
      
      <div className="mb-4">
        <p className="text-xs text-slate-500 font-semibold mb-2">KEY FEATURES</p>
        <ul className="space-y-1">
          {features.map((feature, idx) => (
            <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
              <span className="text-blue-400 mt-1">→</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        {tech.map((t, idx) => (
          <span
            key={idx}
            className="text-xs px-2 py-1 bg-blue-500/10 text-blue-300 rounded border border-blue-500/20"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
};

const ProjectShowcase: React.FC = () => {
  const projects = [
    {
      title: 'Account Management',
      description: 'Multi-account system with real-time synchronization and secure credentials storage.',
      features: [
        'Connect multiple bank accounts',
        'Real-time balance updates',
        'Secure API key management',
        'Transaction categorization'
      ],
      tech: ['React', 'TypeScript', 'Axios', 'Context API'],
      icon: '💳'
    },
    {
      title: 'Transaction Analytics',
      description: 'Advanced analytics dashboard for tracking spending patterns and financial insights.',
      features: [
        'Interactive charts and graphs',
        'Spending patterns analysis',
        'Budget tracking',
        'Export functionality'
      ],
      tech: ['Recharts', 'D3.js', 'Tailwind CSS', 'React Query'],
      icon: '📊'
    },
    {
      title: 'AI Insights Engine',
      description: 'Machine learning powered financial recommendations and anomaly detection.',
      features: [
        'Smart recommendations',
        'Anomaly detection',
        'Spending forecasts',
        'Personalized insights'
      ],
      tech: ['FastAPI', 'Python', 'TensorFlow', 'WebSocket'],
      icon: '🤖'
    },
    {
      title: 'Money Transfer',
      description: 'Secure and fast money transfer system with multi-step verification.',
      features: [
        'Multiple payment methods',
        '2FA verification',
        'Transfer history',
        'Receipt generation'
      ],
      tech: ['React', 'Node.js', 'PostgreSQL', 'Stripe API'],
      icon: '💸'
    }
  ];

  return (
    <section id="projects" className="min-h-screen px-6 py-20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16 text-center">
          <h2 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              EzPay Features
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            A comprehensive fintech platform that combines powerful financial tools with elegant user experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {projects.map((project, idx) => (
            <div key={idx} className="animate-fadeIn" style={{ animationDelay: `${idx * 100}ms` }}>
              <ProjectCard {...project} />
            </div>
          ))}
        </div>

        {/* Additional info */}
        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-8">
          <h3 className="text-xl font-bold mb-4 text-white">Project Architecture</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-blue-400 font-semibold mb-2">Frontend</p>
              <p className="text-slate-300 text-sm">React 18 with TypeScript, Tailwind CSS for responsive design</p>
            </div>
            <div>
              <p className="text-cyan-400 font-semibold mb-2">Backend</p>
              <p className="text-slate-300 text-sm">Spring Boot API with PostgreSQL, JWT authentication</p>
            </div>
            <div>
              <p className="text-blue-400 font-semibold mb-2">AI/ML</p>
              <p className="text-slate-300 text-sm">FastAPI with Python, TensorFlow for analytics</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProjectShowcase;
