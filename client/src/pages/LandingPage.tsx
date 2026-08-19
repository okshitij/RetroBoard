import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Set document title
    document.title = 'RetroBoard — Digital Curation for Teams';

    // Unconstrain #root layout on landing page
    const rootEl = document.getElementById('root');
    let originalWidth = '';
    let originalMaxWidth = '';
    let originalMargin = '';
    let originalBorder = '';
    let originalPadding = '';

    if (rootEl) {
      originalWidth = rootEl.style.width;
      originalMaxWidth = rootEl.style.maxWidth;
      originalMargin = rootEl.style.margin;
      originalBorder = rootEl.style.borderInline;
      originalPadding = rootEl.style.padding;

      rootEl.style.width = '100%';
      rootEl.style.maxWidth = '100%';
      rootEl.style.margin = '0';
      rootEl.style.borderInline = 'none';
      rootEl.style.padding = '0';
    }

    // Scroll parallax effect and scroll progress indicator
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const floatBadge = document.querySelector('.editorial-shadow.glass-nav') as HTMLElement;
      if (floatBadge) {
        floatBadge.style.transform = `translateY(${scrolled * -0.05}px)`;
      }

      // Calculate scroll progress percentage
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolledPercent = height > 0 ? (winScroll / height) * 100 : 0;
      const progressBar = document.getElementById('scroll-progress') as HTMLElement;
      if (progressBar) {
        progressBar.style.width = `${scrolledPercent}%`;
      }
    };
    window.addEventListener('scroll', handleScroll);

    // Apply dark class to documentElement
    const htmlEl = document.documentElement;
    const isDark = htmlEl.classList.contains('dark');
    htmlEl.classList.add('dark');

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (!isDark) {
        htmlEl.classList.remove('dark');
      }
      if (rootEl) {
        rootEl.style.width = originalWidth;
        rootEl.style.maxWidth = originalMaxWidth;
        rootEl.style.margin = originalMargin;
        rootEl.style.borderInline = originalBorder;
        rootEl.style.padding = originalPadding;
      }
    };
  }, []);

  return (
    <div className="landing-page-container bg-surface text-on-surface selection:bg-primary-container selection:text-on-primary-container min-h-screen flex flex-col font-body">
      {/* Scroll Progress Bar */}
      <div 
        id="scroll-progress" 
        className="fixed top-0 left-0 h-[3px] bg-[#3366cc] z-[60] transition-all duration-75 ease-out"
        style={{ width: '0%' }}
      ></div>

      {/* TopNavBar */}
      <header className="fixed top-0 left-0 w-full z-50 pt-6 px-4">
        <nav className="max-w-5xl mx-auto flex items-center justify-between bg-black/60 backdrop-blur-xl border border-white/10 rounded-[9999px] px-6 py-3 shadow-2xl">
          <Link to="/" className="flex items-center gap-2 text-white hover:opacity-90 transition-opacity text-decoration-none">
            <div className="w-5 h-5 bg-[#3366cc] rounded-sm rotate-45"></div>
            <span className="text-lg font-bold font-manrope tracking-tight">RetroBoard</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" id="nav-features-link" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors text-decoration-none">Features</a>
            <a href="#how-it-works" id="nav-how-it-works-link" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors text-decoration-none">How it Works</a>
            <a href="#testimonials" id="nav-testimonials-link" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors text-decoration-none">Testimonials</a>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/dashboard" id="nav-dashboard-link" className="hidden md:block text-sm font-medium text-zinc-300 hover:text-white text-decoration-none">
                  Dashboard
                </Link>
                <Link to="/dashboard" id="nav-get-access-btn" className="group relative inline-flex items-center justify-center overflow-hidden rounded-[9999px] bg-white/5 px-6 py-2 transition-transform active:scale-95 text-decoration-none text-white">
                  <span className="absolute inset-0 border border-white/10 rounded-[9999px]"></span>
                  <span className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_75%,#3366cc_100%)] opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  <span className="absolute inset-[1px] rounded-[9999px] bg-black"></span>
                  <span className="relative z-10 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                    Go to App {React.createElement('iconify-icon', {
                      icon: 'lucide:arrow-right',
                      class: 'w-3 h-3 group-hover:translate-x-0.5 transition-transform'
                    })}
                  </span>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" id="nav-login-link" className="hidden md:block text-sm font-medium text-zinc-300 hover:text-white text-decoration-none">
                  Log In
                </Link>
                <Link to="/register" id="nav-get-access-btn" className="group relative inline-flex items-center justify-center overflow-hidden rounded-[9999px] bg-white/5 px-6 py-2 transition-transform active:scale-95 text-decoration-none text-white">
                  <span className="absolute inset-0 border border-white/10 rounded-[9999px]"></span>
                  <span className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_75%,#3366cc_100%)] opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  <span className="absolute inset-[1px] rounded-[9999px] bg-black"></span>
                  <span className="relative z-10 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                    Get Access {React.createElement('iconify-icon', {
                      icon: 'lucide:arrow-right',
                      class: 'w-3 h-3 group-hover:translate-x-0.5 transition-transform'
                    })}
                  </span>
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-6">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[9999px] bg-white/5 border border-white/10 backdrop-blur-md mb-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-[9999px] bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-[9999px] h-2 w-2 bg-[#3366cc]"></span>
              </span>
              <span className="text-xs font-medium text-blue-100/90 tracking-wide font-manrope">
                RetroBoard is now live
              </span>
              {React.createElement('iconify-icon', {
                icon: 'lucide:arrow-right',
                class: 'w-3 h-3 text-blue-400'
              })}
            </div>
            
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tighter font-manrope leading-[1.1] mb-8 animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40">Make Agile Retrospectives</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40">
                impactful <span className="text-[#3366cc] inline-block relative">
                  again
                  <svg className="absolute w-full h-3 -bottom-2 left-0 text-[#3366cc] opacity-60" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                </span>
              </span>
            </h1>

            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-up" style={{ animationDelay: '0.3s' }}>
              Turn team feedback into actionable momentum without the chaotic spreadsheets.
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6 animate-fade-up" style={{ animationDelay: '0.4s' }}>
              {user ? (
                <Link to="/dashboard" id="hero-cta-btn" className="shiny-cta group text-decoration-none inline-flex items-center justify-center px-8 py-4">
                  <span className="relative z-10 flex items-center gap-2 text-white font-medium">
                    Go to Dashboard {React.createElement('iconify-icon', {
                      icon: 'lucide:arrow-right',
                      class: 'transition-transform group-hover:translate-x-1'
                    })}
                  </span>
                </Link>
              ) : (
                <Link to="/register" id="hero-cta-btn" className="shiny-cta group text-decoration-none inline-flex items-center justify-center px-8 py-4">
                  <span className="relative z-10 flex items-center gap-2 text-white font-medium">
                    Start Retrospecting {React.createElement('iconify-icon', {
                      icon: 'lucide:arrow-right',
                      class: 'transition-transform group-hover:translate-x-1'
                    })}
                  </span>
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="bg-surface-container-low/50 py-8 border-y border-outline-variant/20">
          <div className="max-w-4xl mx-auto px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center md:text-left">
                <p className="font-manrope text-2xl font-bold text-primary mb-0.5">100+</p>
                <p className="font-inter text-[10px] uppercase tracking-widest text-on-surface-variant">Active BOARDS</p>
              </div>
              <div className="text-center md:text-left">
                <p className="font-manrope text-2xl font-bold text-primary mb-0.5">99.9%</p>
                <p className="font-inter text-[10px] uppercase tracking-widest text-on-surface-variant">Uptime SLA</p>
              </div>
              <div className="text-center md:text-left">
                <p className="font-manrope text-2xl font-bold text-primary mb-0.5">24/7</p>
                <p className="font-inter text-[10px] uppercase tracking-widest text-on-surface-variant">CHAOS SUPPORT</p>
              </div>
              <div className="text-center md:text-left">
                <p className="font-manrope text-2xl font-bold text-primary mb-0.5">0</p>
                <p className="font-inter text-[10px] uppercase tracking-widest text-on-surface-variant">EXCUSES MADE</p>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-32 max-w-7xl mx-auto px-8 p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center p-10">
            <div className="lg:col-span-6">
              <div className="overflow-hidden bg-transparent">
                <img alt="Illustration of a stressed CTO" className="w-full h-auto object-cover opacity-90 mix-blend-screen" src="/stressed_cto.jpg" />
              </div>
            </div>
            <div className="lg:col-span-6 -mt-8">
                <h2 className="text-4xl md:text-5xl font-semibold text-white tracking-tight font-manrope mb-6">
                  You're a tech lead and you have a <br />
                  <span className="text-[#3366cc]">problem.</span>
                </h2>
              <p className="font-body text-lg text-on-surface-variant max-w-xl leading-relaxed mb-12">
                Traditional retrospectives are broken. We've identified the three biggest friction points that kill team momentum.
              </p>
              <div className="space-y-8">
                {/* Problem Card 1 */}
                <div className="relative bg-surface-container-low border border-outline-variant p-4 rounded-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] flex items-center gap-4 max-w-xl">
                  <div className="w-12 h-12 rounded-lg bg-tertiary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-on-tertiary-fixed text-2xl">warning</span>
                  </div>
                  <div>
                    <h3 className="font-manrope text-xl font-bold text-on-surface mb-0.5 text-left">Sprint fatigue is real</h3>
                    <p className="font-body text-xs text-on-surface-variant text-left">Retrospectives feel like a chore rather than a catalyst for improvement.</p>
                  </div>
                </div>
                {/* Problem Card 2 */}
                <div className="relative bg-surface-container-low border border-outline-variant p-4 rounded-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] flex items-center gap-4 max-w-xl ml-8">
                  <div className="w-12 h-12 rounded-lg bg-primary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-inverse-primary text-2xl">visibility_off</span>
                  </div>
                  <div>
                    <h3 className="font-manrope text-xl font-bold text-on-surface mb-0.5 text-left">Quiet voices get lost</h3>
                    <p className="font-body text-xs text-on-surface-variant text-left">Only the loudest team members drive the conversation and outcomes.</p>
                  </div>
                </div>
                {/* Problem Card 3 */}
                <div className="relative bg-surface-container-low border border-outline-variant p-4 rounded-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] flex items-center gap-4 max-w-xl ml-16">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-on-surface text-2xl">trending_down</span>
                  </div>
                  <div>
                    <h3 className="font-manrope text-xl font-bold text-on-surface mb-0.5 text-left">Action items vanish</h3>
                    <p className="font-body text-xs text-on-surface-variant text-left">Brilliant ideas discussed are forgotten by the next sprint planning.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="features" className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-20 text-center max-w-3xl mx-auto animate-fade-up">
              <h2 className="text-4xl md:text-5xl font-semibold text-white tracking-tight font-manrope mb-6">
                You connect with Retroboard.<br />
                <span className="text-[#3366cc]">We listen, learn, and collaborate.</span>
              </h2>
              <p className="text-lg text-zinc-400 font-light">
                Replace your fragmented toolset and chaotic spreadsheets with one cohesive real-time platform.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-auto lg:h-[700px]">
              {/* Main Feature Card */}
              <div className="lg:col-span-2 lg:row-span-2 group relative overflow-hidden p-8 border border-white/10 bg-gradient-to-b from-zinc-900/50 to-black hover:border-white/20 transition-all rounded-xl">
                <div className="relative z-10 h-full flex flex-col">
                  <div className="mb-6 inline-flex p-3 rounded-lg bg-white/5 border border-white/10 text-[#3366cc] self-start">
                    {React.createElement('iconify-icon', {
                      icon: 'lucide:refresh-cw',
                      class: 'w-6 h-6'
                    })}
                  </div>
                  <h3 className="text-3xl font-semibold text-white font-manrope mb-4 tracking-tight">Real-time Sync</h3>
                  <p className="text-zinc-400 text-lg leading-relaxed">Experience instant collaboration. Watch cursors dance across the board and ideas pop instantly as your distributed team works together.</p>
                  <div className="mt-auto flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                    <span className="text-xs font-mono text-[#3366cc]">EXPLORE FEATURE</span>
                    {React.createElement('iconify-icon', {
                      icon: 'lucide:arrow-right',
                      class: 'w-4 h-4 text-[#3366cc]'
                    })}
                  </div>
                </div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" style={{ background: 'radial-gradient(circle at top right, #3366cc, transparent 70%)' }}></div>
              </div>

              {/* Feature 2 */}
              <div className="lg:col-span-2 group relative overflow-hidden p-8 border border-white/10 bg-black hover:border-white/20 transition-all rounded-xl">
                <div className="relative z-10 flex flex-col h-full">
                  <div className="mb-4 inline-flex p-3 rounded-lg bg-white/5 border border-white/10 text-blue-400 self-start">
                    {React.createElement('iconify-icon', {
                      icon: 'lucide:file-text',
                      class: 'w-6 h-6'
                    })}
                  </div>
                  <h3 className="text-2xl font-semibold text-white font-manrope mb-2">Instant PDF Reports</h3>
                  <p className="text-zinc-400">Document your outcomes. Export completed boards directly to high-quality PDF files for simple sharing across the organization with zero friction.</p>
                </div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" style={{ background: 'radial-gradient(circle at top right, #3b82f6, transparent 70%)' }}></div>
              </div>

              {/* Feature 3 */}
              <div className="group relative overflow-hidden p-8 border border-white/10 bg-black hover:border-white/20 transition-all rounded-xl">
                <div className="relative z-10">
                  <div className="mb-4 inline-flex p-3 rounded-lg bg-white/5 border border-white/10 text-yellow-400">
                    {React.createElement('iconify-icon', {
                      icon: 'lucide:eye-off',
                      class: 'w-6 h-6'
                    })}
                  </div>
                  <h3 className="text-xl font-semibold text-white font-manrope mb-2">Anonymous Mode</h3>
                  <p className="text-sm text-zinc-400">Encourage honest feedback with incognito voting and card submission. Ensure every voice is heard without bias.</p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="group relative overflow-hidden p-8 border border-white/10 bg-black hover:border-white/20 transition-all rounded-xl">
                <div className="relative z-10">
                  <div className="mb-4 inline-flex p-3 rounded-lg bg-white/5 border border-white/10 text-purple-400">
                    {React.createElement('iconify-icon', {
                      icon: 'lucide:timer',
                      class: 'w-6 h-6'
                    })}
                  </div>
                  <h3 className="text-xl font-semibold text-white font-manrope mb-2">Timeboxing</h3>
                  <p className="text-sm text-zinc-400">Keep discussions on track. Run time-boxed sessions with a synchronous timer visible to all collaborators.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-32 bg-surface-container-low/30 border-y border-white/5 p-10">
          <div className="max-w-7xl mx-auto px-8 p-10">
            <div className="text-center mb-24 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-semibold text-white tracking-tight font-manrope mb-6">How it works</h2>
              <p className="font-body text-xl text-on-surface-variant max-w-2xl mx-auto">Collaborate on sprint retrospectives in four simple steps.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24 gap-y-32">
              {/* Step 1 */}
              <div className="flex flex-col gap-8">
                <div className="flex items-center gap-6">
                  <span className="w-12 h-12 rounded-full bg-tertiary-container flex items-center justify-center font-headline text-xl font-bold text-tertiary">1</span>
                  <h3 className="font-headline text-3xl text-on-surface">Create a new board</h3>
                </div>
                <p className="font-body text-lg text-on-surface-variant leading-relaxed">Name your retrospective, choose column layouts, and set up your workspace in seconds.</p>
                <div className="aspect-video bg-surface-container-low rounded-2xl border border-white/5 editorial-shadow flex items-center justify-center">
                  <span className="material-symbols-outlined text-6xl text-outline-variant">grid_view</span>
                </div>
              </div>
              {/* Step 2 */}
              <div className="flex flex-col gap-8 md:mt-24">
                <div className="flex items-center gap-6">
                  <span className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center font-headline text-xl font-bold text-primary">2</span>
                  <h3 className="font-headline text-3xl text-on-surface">Invite your agile team</h3>
                </div>
                <p className="font-body text-lg text-on-surface-variant leading-relaxed">Share the secure board link with teammates. They can jump in instantly as registered users or guests.</p>
                <div className="aspect-video bg-surface-container-low rounded-2xl border border-white/5 editorial-shadow flex items-center justify-center">
                  <span className="material-symbols-outlined text-6xl text-outline-variant">group_add</span>
                </div>
              </div>
              {/* Step 3 */}
              <div className="flex flex-col gap-8">
                <div className="flex items-center gap-6">
                  <span className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center font-headline text-xl font-bold text-on-surface">3</span>
                  <h3 className="font-headline text-3xl text-on-surface">Brainstorm &amp; Upvote</h3>
                </div>
                <p className="font-body text-lg text-on-surface-variant leading-relaxed">Add virtual sticky notes for feedback, organize items, and vote to surface key discussion points.</p>
                <div className="aspect-video bg-surface-container-low rounded-2xl border border-white/5 editorial-shadow flex items-center justify-center">
                  <span className="material-symbols-outlined text-6xl text-outline-variant">bolt</span>
                </div>
              </div>
              {/* Step 4 */}
              <div className="flex flex-col gap-8 md:mt-24">
                <div className="flex items-center gap-6">
                  <span className="w-12 h-12 rounded-full bg-tertiary-container flex items-center justify-center font-headline text-xl font-bold text-tertiary">4</span>
                  <h3 className="font-headline text-3xl text-on-surface">Track Action Items</h3>
                </div>
                <p className="font-body text-lg text-on-surface-variant leading-relaxed">Create clear accountability with action items, assign tasks, and download PDF logs for storage.</p>
                <div className="aspect-video bg-surface-container-low rounded-2xl border border-white/5 editorial-shadow flex items-center justify-center">
                  <span className="material-symbols-outlined text-6xl text-outline-variant">assignment_turned_in</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="bg-surface-container-lowest py-32 p-10">
          <div className="max-w-7xl mx-auto px-8 p-10">
            <div className="text-center mb-20">
              <span className="font-label text-tertiary uppercase tracking-widest text-xs font-bold mb-4 block">Proven Resonance</span>
              <h2 className="text-4xl md:text-5xl font-semibold text-white tracking-tight font-manrope mb-6">Trusted by high-performing teams</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Yellow Sticky Note */}
              <div className="bg-[#2a2718] p-10 rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] relative hover:-translate-y-2 transition-all duration-500 border border-tertiary/20 flex flex-col justify-between">
                <div>
                  <div className="flex gap-1 mb-6 justify-center">
                    <span className="material-symbols-outlined text-sm text-tertiary">star</span>
                    <span className="material-symbols-outlined text-sm text-tertiary">star</span>
                    <span className="material-symbols-outlined text-sm text-tertiary">star</span>
                    <span className="material-symbols-outlined text-sm text-tertiary">star</span>
                    <span className="material-symbols-outlined text-sm text-tertiary">star</span>
                  </div>
                  <p className="font-headline italic text-xl text-[#fdf2a7] mb-12 leading-relaxed text-center">
                    "The first tool that respects the cognitive load of a modern creative. It’s like having a digital curator for my thoughts."
                  </p>
                </div>
                <div className="flex flex-col items-center gap-3 mt-auto">
                  <div className="w-10 h-10 rounded-full border border-tertiary/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl text-tertiary">person</span>
                  </div>
                  <div className="text-center">
                    <p className="font-label font-bold text-sm text-on-surface mb-0.5">Julian Thorne</p>
                    <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-wider">Design Lead, Studio Monolith</p>
                  </div>
                </div>
              </div>
              {/* Green Sticky Note */}
              <div className="bg-[#1b2513] p-10 rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] relative hover:-translate-y-2 transition-all duration-500 border border-[#c9f29f]/20 flex flex-col justify-between">
                <div>
                  <div className="flex gap-1 mb-6 justify-center">
                    <span className="material-symbols-outlined text-sm text-[#c9f29f]">star</span>
                    <span className="material-symbols-outlined text-sm text-[#c9f29f]">star</span>
                    <span className="material-symbols-outlined text-sm text-[#c9f29f]">star</span>
                    <span className="material-symbols-outlined text-sm text-[#c9f29f]">star</span>
                    <span className="material-symbols-outlined text-sm text-[#c9f29f]">star</span>
                  </div>
                  <p className="font-headline italic text-xl text-[#c9f29f] mb-12 leading-relaxed text-center">
                    "Finally, a retrospection tool that doesn't feel like a toy. It brings an intellectual rigour to our weekly sprints."
                  </p>
                </div>
                <div className="flex flex-col items-center gap-3 mt-auto">
                  <div className="w-10 h-10 rounded-full border border-[#c9f29f]/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl text-[#c9f29f]">person</span>
                  </div>
                  <div className="text-center">
                    <p className="font-label font-bold text-sm text-on-surface mb-0.5">Elena Vance</p>
                    <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-wider">VP of Engineering, Flux Systems</p>
                  </div>
                </div>
              </div>
              {/* Purple Sticky Note */}
              <div className="bg-[#1f1a26] p-10 rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] relative hover:-translate-y-2 transition-all duration-500 border border-[#e1d5f5]/20 flex flex-col justify-between">
                <div>
                  <div className="flex gap-1 mb-6 justify-center">
                    <span className="material-symbols-outlined text-sm text-[#e1d5f5]">star</span>
                    <span className="material-symbols-outlined text-sm text-[#e1d5f5]">star</span>
                    <span className="material-symbols-outlined text-sm text-[#e1d5f5]">star</span>
                    <span className="material-symbols-outlined text-sm text-[#e1d5f5]">star</span>
                    <span className="material-symbols-outlined text-sm text-[#e1d5f5]">star</span>
                  </div>
                  <p className="font-headline italic text-xl text-[#e1d5f5] mb-12 leading-relaxed text-center">
                    "The typography, the spacing, the rhythm—RetroBoard is as much a piece of art as it is a productivity platform."
                  </p>
                </div>
                <div className="flex flex-col items-center gap-3 mt-auto">
                  <div className="w-10 h-10 rounded-full border border-[#e1d5f5]/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl text-[#e1d5f5]">person</span>
                  </div>
                  <div className="text-center">
                    <p className="font-label font-bold text-sm text-on-surface mb-0.5">Marcus Chen</p>
                    <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-wider">Founding Partner, Linear Arch</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-7xl mx-auto px-8 py-32 text-center p-10">
          <div className="bg-surface-container-low rounded-[40px] p-24 relative overflow-hidden editorial-shadow border border-white/5 p-10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-semibold text-white tracking-tight font-manrope mb-6">
                Chaos solved.<br />
                Projects advanced.<br />
                <span className="text-[#3366cc]">Stakeholders inspired.</span>
              </h2>
              <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
                {user ? (
                  <Link to="/dashboard" className="bg-primary text-on-secondary px-12 py-5 rounded-2xl font-label font-bold text-xl hover:brightness-110 transition-all shadow-xl shadow-primary/20 text-decoration-none">
                    Go to Dashboard
                  </Link>
                ) : (
                  <Link to="/register" className="bg-primary text-on-secondary px-12 py-5 rounded-2xl font-label font-bold text-xl hover:brightness-110 transition-all shadow-xl shadow-primary/20 text-decoration-none">
                    Level up your next Sprint
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest w-full mt-auto border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-12 py-16 max-w-7xl mx-auto">
          <div className="col-span-1">
            <div className="font-headline text-xl font-semibold text-primary mb-6">
              RetroBoard
            </div>
            <p className="font-body text-xs text-on-surface-variant leading-relaxed">
              © {new Date().getFullYear()} RetroBoard. <br />All rights reserved. <br /> Made with ❤️ by <a href="https://github.com/okshitij" target="_blank" rel="noopener noreferrer">Kshitij Kalrao</a>
            </p>
          </div>
          <div>
            <h4 className="font-label font-bold text-xs uppercase tracking-widest text-on-surface mb-6">Product</h4>
            <ul className="space-y-4 list-none p-0 m-0">
              <li><a className="font-body text-xs text-on-surface-variant hover:text-primary transition-all text-decoration-none" href="#features">Templates</a></li>
              <li><a className="font-body text-xs text-on-surface-variant hover:text-primary transition-all text-decoration-none" href="#features">API Docs</a></li>
              <li><a className="font-body text-xs text-on-surface-variant hover:text-primary transition-all text-decoration-none" href="#features">Security</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-label font-bold text-xs uppercase tracking-widest text-on-surface mb-6">Company</h4>
            <ul className="space-y-4 list-none p-0 m-0">
              <li><a className="font-body text-xs text-on-surface-variant hover:text-primary transition-all text-decoration-none" href="#how-it-works">Help Center</a></li>
              <li><a className="font-body text-xs text-on-surface-variant hover:text-primary transition-all text-decoration-none" href="#how-it-works">Contact Sales</a></li>
              <li><a className="font-body text-xs text-on-surface-variant hover:text-primary transition-all text-decoration-none" href="#how-it-works">Privacy Policy</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-label font-bold text-xs uppercase tracking-widest text-on-surface mb-6">Connect</h4>
            <div className="flex gap-4">
              <a className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary hover:bg-primary hover:text-on-secondary transition-all text-decoration-none" href="#connect">
                <span className="material-symbols-outlined text-lg">public</span>
              </a>
              <a className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary hover:bg-primary hover:text-on-secondary transition-all text-decoration-none" href="mailto:support@retroboard.com">
                <span className="material-symbols-outlined text-lg">mail</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
