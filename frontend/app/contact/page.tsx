'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BRAND } from '@/lib/constants';
import Button from '@/components/ui/Button';

/* ── Icons ── */
function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" /><path d="m21.854 2.147-10.94 10.939" />
    </svg>
  );
}

const contactInfo = [
  { icon: MapPinIcon, label: 'Location', value: BRAND.location },
  { icon: PhoneIcon, label: 'Phone', value: BRAND.phone, href: `tel:${BRAND.phone.replace(/\s/g, '')}` },
  { icon: MailIcon, label: 'Email', value: BRAND.email, href: `mailto:${BRAND.email}` },
  { icon: ClockIcon, label: 'Working Hours', value: 'Mon–Sun: 11 AM – 10 PM' },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: connect to backend API
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <>
      {/* Hero */}
      <section className="bg-forest relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-10 w-40 h-40 bg-gold rounded-full blur-3xl" />
        </div>
        <div className="container-main py-10 lg:py-14 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <p className="text-gold text-xs uppercase tracking-[0.2em] font-medium mb-3">Get in Touch</p>
            <h1 className="font-heading font-bold text-3xl lg:text-5xl text-white mb-3">
              Contact <span className="text-gold">Us</span>
            </h1>
            <p className="text-white/60 max-w-lg mx-auto text-sm">
              Have a question, suggestion, or special order request? We&apos;d love to hear from you.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="container-main">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-6">
              {contactInfo.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-11 h-11 rounded-xl bg-forest/5 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-forest" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider mb-1">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="text-sm font-medium text-forest hover:text-gold transition-colors">
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-forest">{item.value}</p>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* WhatsApp CTA */}
              <div className="mt-6 p-4 bg-veg/5 rounded-xl border border-veg/20">
                <p className="text-sm font-medium text-forest mb-1">Order via WhatsApp</p>
                <p className="text-xs text-neutral-500 mb-3">Quick and easy — just text us your order!</p>
                <a
                  href={`https://wa.me/${BRAND.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-veg text-white text-xs font-semibold rounded-lg hover:bg-veg/90 transition-colors"
                >
                  💬 Chat on WhatsApp
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-3"
            >
              <div className="bg-white rounded-2xl shadow-soft p-6 lg:p-8">
                <h2 className="font-heading font-semibold text-xl text-forest mb-6">Send Us a Message</h2>

                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <span className="text-5xl mb-4 block">✅</span>
                    <h3 className="font-heading font-semibold text-lg text-forest mb-2">Message Sent!</h3>
                    <p className="text-sm text-neutral-500">Thank you for reaching out. We&apos;ll get back to you shortly.</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1.5">Your Name *</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          required
                          placeholder="Full name"
                          className="w-full px-4 py-3 text-sm bg-cream border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1.5">Phone *</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          required
                          placeholder="98765 43210"
                          className="w-full px-4 py-3 text-sm bg-cream border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1.5">Email (Optional)</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 text-sm bg-cream border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1.5">Message *</label>
                      <textarea
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        required
                        rows={4}
                        placeholder="How can we help you?"
                        className="w-full px-4 py-3 text-sm bg-cream border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors resize-none"
                      />
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      icon={<SendIcon className="w-4 h-4" />}
                      iconPosition="right"
                    >
                      Send Message
                    </Button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
