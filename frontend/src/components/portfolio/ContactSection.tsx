import React, { useState } from 'react';

const ContactSection: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', message: '' });
    }, 3000);
  };

  const socialLinks = [
    { name: 'GitHub', url: 'https://github.com', icon: '💻' },
    { name: 'LinkedIn', url: 'https://linkedin.com', icon: '🔗' },
    { name: 'Email', url: 'mailto:contact@ezpay.com', icon: '✉️' },
    { name: 'Twitter', url: 'https://twitter.com', icon: '𝕏' }
  ];

  return (
    <section id="contact" className="min-h-screen px-6 py-20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Let&apos;s Connect
            </span>
          </h2>
          <p className="text-slate-400 text-lg">
            I&apos;m always interested in hearing about new projects and opportunities.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-8">
            <h3 className="text-xl font-bold mb-6 text-white">Send me a message</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none"
                  placeholder="Tell me about your project or opportunity..."
                />
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 mt-6"
              >
                {submitted ? '✓ Message sent!' : 'Send Message'}
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            {/* Quick Info */}
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 text-white">Get in touch</h3>
              <p className="text-slate-300 leading-relaxed">
                I&apos;m actively looking for new opportunities and collaboration. 
                Feel free to reach out through any of the channels below.
              </p>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-white">Connect with me</h3>
              <div className="grid grid-cols-2 gap-4">
                {socialLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-slate-900/50 border border-slate-700/50 rounded-lg hover:border-blue-500/50 hover:bg-slate-800/50 transition-all duration-300 group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">{link.icon}</span>
                    <span className="text-slate-300 group-hover:text-blue-400 transition-colors">{link.name}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-6">
              <p className="text-slate-300 mb-4">
                <span className="font-semibold text-white">Ready to work together?</span>
                <br />
                Let&apos;s build something amazing.
              </p>
              <a
                href="mailto:contact@ezpay.com"
                className="inline-block px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300"
              >
                Start a conversation
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-700/50 text-center text-slate-400">
          <p>© 2024 Frontend Portfolio. Built with React, TypeScript & Tailwind CSS</p>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
