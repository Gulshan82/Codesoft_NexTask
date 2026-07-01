import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfileState } from '../../features/authSlice';
import api from '../../services/api';
import {
  FolderKanban,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Users,
  TrendingUp,
  Shield,
  Zap,
  Star,
} from 'lucide-react';
import GlassCard from '../../components/UI/GlassCard';

const LandingPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Dynamically load Razorpay Checkout script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleBuySubscription = async (planName) => {
    if (!user) {
      alert('Please sign in to upgrade to Business Pro!');
      navigate('/login');
      return;
    }

    try {
      // Step 1: Create payment order on backend
      const { data: order } = await api.post('/payments/order', { planName });

      // Step 2: Configure Razorpay Checkout Modal
      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'NexTask Project Hub',
        description: `Upgrade workspace to ${planName}`,
        image: 'https://cdn-icons-png.flaticon.com/512/2092/2092075.png',
        order_id: order.id,
        handler: async (response) => {
          try {
            // Step 3: Verify signature on backend
            const { data: verifyData } = await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planName,
              isMock: order.isMock,
            });

            if (verifyData.success) {
              alert(`🎉 Success! Your subscription has been upgraded to ${planName}.`);
              dispatch(updateUserProfileState({ subscriptionPlan: planName }));
              navigate('/');
            }
          } catch (verifyErr) {
            console.error('Signature verification failed:', verifyErr);
            alert(verifyErr.response?.data?.message || 'Payment signature verification failed.');
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: '#6366f1',
        },
      };

      // Mock checkout simulator for offline testing
      if (order.isMock) {
        const proceedMock = window.confirm(
          `[MOCK CHECKOUT MODE ACTIVE]\n\nDo you want to simulate a successful Razorpay checkout for the ${planName} Plan?\n\n(No active keys found in the backend .env file)`
        );
        if (proceedMock) {
          options.handler({
            razorpay_order_id: order.id,
            razorpay_payment_id: `pay_mock_${Date.now()}`,
            razorpay_signature: 'simulated_verification_signature_hash',
          });
        }
        return;
      }

      // Open actual Razorpay standard widget
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (failedResponse) => {
        alert('Payment processing failed: ' + failedResponse.error.description);
      });
      rzp.open();
    } catch (err) {
      console.error('Checkout initialization error:', err);
      alert(err.response?.data?.message || 'Failed to initialize subscription checkout');
    }
  };

  const features = [
    {
      icon: FolderKanban,
      title: 'Interactive Board Views',
      desc: 'Organize, assign, and drag-and-drop tasks across clean, transparent Kanban column channels.',
      color: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
      hoverBorder: 'hover:border-violet-500/40 hover:shadow-violet-950/15 hover:bg-violet-950/5',
    },
    {
      icon: Calendar,
      title: 'Milestones & Calendar',
      desc: 'Set project deadlines and view daily agendas with a split-screen interactive milestone tracker.',
      color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
      hoverBorder: 'hover:border-indigo-500/40 hover:shadow-indigo-950/15 hover:bg-indigo-950/5',
    },
    {
      icon: TrendingUp,
      title: 'Real-time Analytics',
      desc: 'Track completed tasks, analyze weekly progress charts, and monitor project velocity in real-time.',
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      hoverBorder: 'hover:border-emerald-500/40 hover:shadow-emerald-950/15 hover:bg-emerald-950/5',
    },
    {
      icon: Users,
      title: 'Team Directory',
      desc: 'Collaborate with workspace members, assign task owners, and manage project teams efficiently.',
      color: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
      hoverBorder: 'hover:border-sky-500/40 hover:shadow-sky-950/15 hover:bg-sky-950/5',
    },
    {
      icon: Shield,
      title: 'Role-Based Access Control',
      desc: 'System-wide secure permissions allowing Admins to manage user access and project configurations.',
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
      hoverBorder: 'hover:border-rose-500/40 hover:shadow-rose-950/15 hover:bg-rose-950/5',
    },
    {
      icon: Zap,
      title: 'GPU Optimized Transitions',
      desc: 'Experience zero lag with CSS hardware-accelerated transitions for dark-mode switching and animations.',
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      hoverBorder: 'hover:border-amber-500/40 hover:shadow-amber-950/15 hover:bg-amber-950/5',
    },
  ];

  const pricingPlans = [
    {
      name: 'Starter Plan',
      price: '$0',
      period: 'Forever Free',
      desc: 'Great for individuals and small portfolio demo projects.',
      features: ['Up to 3 active projects', 'Standard task list & board view', 'Basic analytics dashboard', 'Up to 5 team members'],
      buttonText: 'Get Started Free',
      isPopular: false,
    },
    {
      name: 'Business Pro',
      price: '$12',
      period: 'per user / month',
      desc: 'Perfect for growing teams requiring deep collaboration and calendar tools.',
      features: ['Unlimited projects & tasks', 'Advanced Milestones Calendar', 'Weekly velocity reports', 'Secure role modifications', 'Priority support channels'],
      buttonText: 'Start Free Trial',
      isPopular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'tailored pricing',
      desc: 'Designed for larger organizations needing absolute governance.',
      features: ['Custom user access rules', 'Global workspace settings', 'SLA uptime guarantee', 'Dedicated account manager', 'Activity log audit trail'],
      buttonText: 'Contact Sales',
      isPopular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 overflow-x-hidden font-sans relative selection:bg-violet-500/30 selection:text-white">
      {/* Decorative background glow rings */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-violet-600/5 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] rounded-full bg-indigo-600/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-[500px] h-[500px] rounded-full bg-sky-600/5 blur-3xl pointer-events-none" />

      {/* Floating Navbar */}
      <header className="sticky top-0 z-50 px-6 py-4 backdrop-blur-xl border-b border-slate-900 bg-slate-950/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20">
              <FolderKanban className="w-5 h-5" />
            </div>
            <span className="font-bold text-base tracking-tight bg-gradient-to-r from-violet-200 to-indigo-200 bg-clip-text text-transparent">
              NexTask
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-400">
            <a href="#features" className="hover:text-violet-400 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-violet-400 transition-colors">Pricing</a>
            <a href="#about" className="hover:text-violet-400 transition-colors">Workspace</a>
          </nav>

          <div className="flex items-center gap-3.5">
            {user ? (
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-gradient-to-tr from-violet-600 to-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-violet-500/10 hover:shadow-violet-500/25 hover:from-violet-500 hover:to-indigo-500 hover:scale-[1.02] hover:-translate-y-[1px] transition-all active:scale-[0.98] duration-200"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="text-xs font-semibold text-slate-350 hover:text-white hover:scale-103 active:scale-95 transition-all duration-150"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-4 py-2 bg-gradient-to-tr from-violet-600 to-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-violet-500/10 hover:shadow-violet-500/25 hover:from-violet-500 hover:to-indigo-500 hover:scale-[1.02] hover:-translate-y-[1px] transition-all active:scale-[0.98] duration-200"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/5 text-[10px] font-bold uppercase tracking-wider text-violet-400">
            <Star className="w-3 h-3 text-violet-400 fill-violet-400/20" /> Introducing NexTask 2.0
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight font-sans">
            The unified workspace <br />
            <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-sky-400 bg-clip-text text-transparent">
              for modern tech teams.
            </span>
          </h1>

          <p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto leading-relaxed font-sans">
            Collaborate in real-time, prioritize backlog tasks with clean Kanban boards, track release milestones, and monitor team velocity in one gorgeous platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-tr from-violet-600 to-indigo-600 text-white text-sm font-bold rounded-xl shadow-xl shadow-violet-600/15 hover:shadow-violet-500/30 hover:from-violet-500 hover:to-indigo-500 hover:scale-[1.03] hover:-translate-y-[1.5px] transition-all active:scale-[0.97] duration-200 group"
            >
              Get Started Free <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-6 py-3.5 border border-slate-800 bg-slate-900/20 text-slate-200 text-sm font-bold rounded-xl hover:bg-violet-600/10 hover:border-violet-500/40 hover:text-white hover:scale-[1.03] hover:-translate-y-[1.5px] transition-all active:scale-[0.97] duration-200"
            >
              Request Live Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-20 px-6 border-t border-slate-900 bg-slate-950/20">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-lg mx-auto space-y-3">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-sans">
              Streamline project workflows
            </h2>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-sans">
              Everything you need to deliver high-quality code releases faster, all beautifully integrated into a dark-theme dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat) => (
              <GlassCard
                key={feat.title}
                hover
                className={`p-6 border-slate-800/80 flex flex-col justify-between group transition-all duration-300 ${feat.hoverBorder}`}
              >
                <div className="space-y-4">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ${feat.color}`}>
                    <feat.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-200 font-sans tracking-wide group-hover:text-white transition-colors duration-200">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed group-hover:text-slate-350 transition-colors duration-200">
                    {feat.desc}
                  </p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 border-t border-slate-900 bg-gradient-to-b from-[#030712] via-[#050915] to-[#030712]">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-lg mx-auto space-y-3">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-sans">
              Flexible pricing for any scale
            </h2>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              No hidden fees. Start free to test your personal templates and scale as your enterprise engineering team grows.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {pricingPlans.map((plan) => (
              <GlassCard
                key={plan.name}
                hover
                className={`p-8 border-slate-850 flex flex-col justify-between relative group transition-all duration-300
                  ${plan.isPopular 
                    ? 'border-violet-500/50 ring-1 ring-violet-500/25 shadow-xl shadow-violet-950/20 hover:border-violet-400 hover:shadow-violet-950/30' 
                    : 'shadow-2xl hover:border-slate-750/80'
                  }
                `}
              >
                {plan.isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-violet-600 text-white text-[9px] font-bold tracking-widest uppercase shadow-md shadow-violet-600/20 group-hover:scale-105 transition-transform duration-200">
                    Most Popular
                  </span>
                )}
                <div>
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider group-hover:text-white transition-colors duration-200">{plan.name}</h3>
                  <div className="flex items-baseline mt-4 mb-2 gap-1.5">
                    <span className="text-4xl font-extrabold text-white font-sans">{plan.price}</span>
                    <span className="text-xs text-slate-500 font-semibold">{plan.period}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6 group-hover:text-slate-350 transition-colors duration-200">{plan.desc}</p>
                  
                  <div className="border-t border-slate-900/60 pt-6 space-y-3.5 mb-8">
                    {plan.features.map((feat) => (
                      <div key={feat} className="flex items-start gap-2.5 text-xs text-slate-350 group-hover:text-slate-200 transition-colors duration-200">
                        <CheckCircle2 className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (plan.name === 'Starter Plan') {
                      navigate('/register');
                    } else if (plan.name === 'Business Pro') {
                      handleBuySubscription('Pro');
                    } else {
                      alert('For Enterprise plan setups, please email sales@nextask.com');
                    }
                  }}
                  className={`w-full py-3 px-4 font-bold rounded-xl text-xs transition-all active:scale-[0.98] hover:scale-[1.02] hover:-translate-y-[1px] duration-200
                    ${plan.isPopular
                      ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/10 hover:shadow-lg hover:shadow-violet-500/25 hover:from-violet-500 hover:to-indigo-500'
                      : 'border border-slate-800 bg-slate-900/20 text-slate-200 hover:bg-violet-600/10 hover:border-violet-500/40 hover:text-white'
                    }
                  `}
                >
                  {plan.buttonText}
                </button>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer id="about" className="py-12 px-6 border-t border-slate-900 bg-slate-950/60 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-850 text-slate-400">
              <FolderKanban className="w-4 h-4" />
            </div>
            <span className="font-semibold text-slate-300">NexTask Project Hub</span>
          </div>

          <div className="flex items-center gap-8 text-[11px]">
            <a href="#features" className="hover:text-slate-300 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-slate-300 transition-colors">Pricing</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-slate-300 transition-colors">Docs</a>
          </div>

          <span>© 2026 NexTask. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
