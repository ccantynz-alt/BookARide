import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain,
  Globe,
  Shield,
  Zap,
  FileText,
  TrendingUp,
  ArrowRight,
  Check,
  ChevronRight,
  BarChart3,
  Lock,
  RefreshCw,
  Star,
  CreditCard,
  Building2,
  Users,
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI Auto-Categorization',
    description:
      'Machine learning categorizes transactions with 98%+ accuracy. The more you use it, the smarter it gets.',
  },
  {
    icon: Globe,
    title: 'Tax Treaty Optimization',
    description:
      'Automatically identifies applicable tax treaties between jurisdictions to minimize withholding taxes.',
  },
  {
    icon: Shield,
    title: 'Multi-Jurisdiction Compliance',
    description:
      'Stay compliant across NZ, AU, UK, and US with automated GST, BAS, VAT, and sales tax filings.',
  },
  {
    icon: RefreshCw,
    title: 'Real-Time Bank Feeds',
    description:
      'Connect your bank accounts for automatic transaction imports and instant reconciliation.',
  },
  {
    icon: FileText,
    title: 'Smart Invoicing',
    description:
      'Generate professional invoices with auto-populated tax codes, multi-currency support, and payment tracking.',
  },
  {
    icon: TrendingUp,
    title: 'Financial Forecasting',
    description:
      'AI-driven cash flow projections and budget analysis to help you make data-driven decisions.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Connect',
    description:
      'Link your bank accounts, import historical data, and set up your organization in minutes.',
    icon: Zap,
  },
  {
    number: '02',
    title: 'AI Analyzes',
    description:
      'Our AI categorizes transactions, identifies tax savings, and ensures compliance across all jurisdictions.',
    icon: Brain,
  },
  {
    number: '03',
    title: 'You Save',
    description:
      'Save hours on bookkeeping, reduce tax liability, and gain real-time financial clarity.',
    icon: BarChart3,
  },
];

const jurisdictions = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
];

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for freelancers getting started',
    features: [
      'Up to 50 transactions/month',
      'Basic categorization',
      '1 bank connection',
      'Standard invoicing',
      'Single jurisdiction',
    ],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    name: 'Starter',
    price: '$29',
    period: '/mo',
    description: 'For small businesses with growing needs',
    features: [
      'Up to 500 transactions/month',
      'AI auto-categorization',
      '3 bank connections',
      'Smart invoicing with automation',
      'Up to 2 jurisdictions',
      'Basic reporting',
      'Email support',
    ],
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '$79',
    period: '/mo',
    description: 'For businesses operating across borders',
    features: [
      'Unlimited transactions',
      'Advanced AI categorization',
      'Unlimited bank connections',
      'Tax treaty optimization',
      'All 4 jurisdictions',
      'Full report suite',
      'AI Assistant',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations with complex needs',
    features: [
      'Everything in Professional',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantee',
      'On-premise deployment option',
      'Custom compliance modules',
      'API access',
      'Training & onboarding',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export default function Landing() {
  const [billingCycle, setBillingCycle] = useState('monthly');

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-navy-700 rounded-lg flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg, #14b8a6, #1e3a5f)' }}>
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">AI Ledger</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 text-sm font-medium">How It Works</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Pricing</a>
              <Link to="/login" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Sign In</Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                style={{ backgroundColor: '#14b8a6' }}
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #134e4a 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-teal-400 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-teal-300 text-sm font-medium mb-6">
              <Brain className="w-4 h-4" />
              Powered by Advanced AI
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
              AI-Powered Accounting That{' '}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #14b8a6, #5eead4)' }}>
                Thinks Globally
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed">
              Automated cross-border tax treaty management, intelligent transaction categorization,
              and multi-jurisdiction compliance — all in one platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-lg text-white font-semibold text-lg flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ backgroundColor: '#14b8a6' }}
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto px-8 py-3.5 rounded-lg text-white font-semibold text-lg flex items-center justify-center gap-2 border border-white/30 hover:bg-white/10 transition-all"
              >
                See How It Works
              </a>
            </div>
            <div className="mt-12 flex items-center justify-center gap-8 text-gray-400 text-sm">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-400" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-400" />
                14-day free trial
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-400" />
                Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Jurisdiction Badges */}
      <section className="py-12 bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 mb-6 font-medium uppercase tracking-wider">
            Built for global compliance
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {jurisdictions.map((j) => (
              <div
                key={j.code}
                className="flex items-center gap-3 px-5 py-3 bg-white rounded-xl shadow-sm border border-gray-200"
              >
                <span className="text-2xl">{j.flag}</span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{j.name}</p>
                  <p className="text-xs text-gray-500">{j.code} Tax Compliant</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to manage finances globally
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From AI-powered categorization to cross-border tax optimization, we handle the
              complexity so you can focus on growing your business.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-2xl border border-gray-200 hover:border-teal-200 hover:shadow-lg transition-all group"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: '#f0fdfa' }}
                >
                  <feature.icon className="w-6 h-6" style={{ color: '#14b8a6' }} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24" style={{ backgroundColor: '#f8fafc' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get up and running in minutes, not days.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={step.number} className="relative text-center">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] border-t-2 border-dashed border-gray-300" />
                )}
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 relative z-10"
                  style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}
                >
                  <step.icon className="w-10 h-10 text-teal-400" />
                </div>
                <div className="text-xs font-bold text-teal-600 tracking-widest mb-2">
                  STEP {step.number}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Start free and scale as you grow. All plans include a 14-day trial.
            </p>
            <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white shadow text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingCycle === 'annual'
                    ? 'bg-white shadow text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Annual (Save 20%)
              </button>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-6 flex flex-col ${
                  plan.highlighted
                    ? 'ring-2 shadow-xl relative'
                    : 'border border-gray-200'
                }`}
                style={plan.highlighted ? { ringColor: '#14b8a6', borderColor: '#14b8a6' } : {}}
              >
                {plan.highlighted && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-white text-xs font-bold"
                    style={{ backgroundColor: '#14b8a6' }}
                  >
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-4 mb-2">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price === 'Custom'
                      ? 'Custom'
                      : billingCycle === 'annual' && plan.price !== '$0'
                      ? `$${Math.round(parseInt(plan.price.slice(1)) * 0.8)}`
                      : plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-gray-500 text-sm">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#14b8a6' }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`w-full py-2.5 rounded-lg text-center font-medium text-sm transition-all ${
                    plan.highlighted
                      ? 'text-white hover:opacity-90'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  style={plan.highlighted ? { backgroundColor: '#14b8a6' } : {}}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Trusted and Secure</h2>
            <p className="text-gray-600">Enterprise-grade security for your financial data</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
              <Lock className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">256-bit SSL Encryption</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
              <Shield className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">SOC 2 Compliant</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
              <Building2 className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">IRD Approved Software</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
              <CreditCard className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">PCI DSS Level 1</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
              <Users className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">GDPR Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24" style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to simplify your global accounting?
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Join thousands of businesses using AI Ledger to save time, reduce tax liability, and
            stay compliant across borders.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg text-white font-semibold text-lg transition-all hover:opacity-90"
            style={{ backgroundColor: '#14b8a6' }}
          >
            Start Your Free Trial
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #14b8a6, #1e3a5f)' }}>
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">AI Ledger</span>
              </div>
              <p className="text-sm leading-relaxed">AI-powered accounting for modern global businesses.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} AI Ledger. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
