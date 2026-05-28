'use client';
import { useEffect, useRef } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// ── Data ─────────────────────────────────────────────────────────────
const INDIA_SERVICES = [
  { icon: '🎬', name: 'Netflix',      price: '₹149/mo' },
  { icon: '📺', name: 'Hotstar',      price: '₹299/mo' },
  { icon: '🎵', name: 'Spotify',      price: '₹119/mo' },
  { icon: '📦', name: 'Prime',        price: '₹1499/yr' },
  { icon: '🎥', name: 'JioCinema',   price: '₹999/yr' },
  { icon: '📱', name: 'ZEE5',         price: '₹999/yr' },
  { icon: '🤖', name: 'ChatGPT',      price: '₹1950/mo' },
  { icon: '🍔', name: 'Swiggy One',   price: '₹299/mo' },
  { icon: '🍕', name: 'Zomato Gold',  price: '₹275/mo' },
  { icon: '🦜', name: 'Duolingo',     price: '₹533/mo' },
  { icon: '☁️', name: 'iCloud',       price: '₹75/mo'  },
  { icon: '📝', name: 'Notion',       price: '₹1000/mo' },
];

const TESTIMONIALS = [
  {
    text: '"Found 4 subscriptions I completely forgot about — ₹2,800/month I was wasting. Cancelled all of them in 10 minutes using the guides."',
    name: 'Priya Sharma',
    loc: 'Mumbai, Maharashtra',
    initial: 'P',
    grad: 'linear-gradient(135deg,#9b78f8,#4f8ef7)',
  },
  {
    text: '"The renewal alerts are a lifesaver. Got an email about my Adobe subscription 5 days before it renewed — cancelled it and saved ₹4,230."',
    name: 'Rahul Mehta',
    loc: 'Bangalore, Karnataka',
    initial: 'R',
    grad: 'linear-gradient(135deg,#00e5a0,#00b4d8)',
  },
  {
    text: '"Finally an app that knows Indian prices. Every other tracker shows dollar amounts. SubTracker just works for India — setup took 30 seconds."',
    name: 'Ananya Patel',
    loc: 'Pune, Maharashtra',
    initial: 'A',
    grad: 'linear-gradient(135deg,#f5a623,#ff5f5f)',
  },
];

export default function Landing() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const revealRefs = useRef([]);

  // Redirect authenticated users straight to dashboard
  useEffect(() => {
    if (status === 'authenticated') router.push('/dashboard');
  }, [status, router]);

  // Scroll-reveal observer
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('lp-visible'); }),
      { threshold: 0.1 }
    );
    revealRefs.current.forEach(el => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const addReveal = (delay = 0) => (el) => {
    if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el);
    if (el) el.style.transitionDelay = `${delay}s`;
  };

  if (status === 'loading' || status === 'authenticated') return null;

  return (
    <div className="lp-root">

      {/* ── NAV ── */}
      <nav className="lp-nav">
        <a href="#" className="lp-nav-logo">
          <div className="lp-logo-mark">📊</div>
          <span className="lp-logo-text">SubTracker</span>
        </a>
        <div className="lp-nav-links">
          <a href="#how"      className="lp-nav-link">How it works</a>
          <a href="#features" className="lp-nav-link">Features</a>
          <a href="#pricing"  className="lp-nav-link">Pricing</a>
          <button className="lp-nav-cta" onClick={() => signIn('google')}>
            Get started free →
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-glow"  aria-hidden />
        <div className="lp-hero-glow2" aria-hidden />

        <div className="lp-hero-badge">🇮🇳 Built for India — UPI, ₹, and Indian apps</div>

        <h1 className="lp-h1">
          Stop paying for<br />
          <span className="lp-accent">subscriptions</span><br />
          <span className="lp-dim">you forgot about.</span>
        </h1>

        <p className="lp-hero-sub">
          SubTracker automatically scans your Gmail, finds every subscription,
          and alerts you before renewals hit. The average user saves <strong>₹3,500/month</strong>.
        </p>

        <div className="lp-hero-actions">
          <button className="lp-btn-primary" onClick={() => signIn('google')}>
            🚀 Start for free — it's instant
          </button>
          <a href="#how" className="lp-btn-secondary">▶ See how it works</a>
        </div>

        <div className="lp-stats">
          {[
            { num: '₹3,500', label: 'avg saved per month' },
            { num: '54%',    label: 'Indians have forgotten subs' },
            { num: '30s',    label: 'setup time' },
            { num: '100%',   label: 'free to start' },
          ].map(s => (
            <div key={s.num} className="lp-stat">
              <div className="lp-stat-num">{s.num}</div>
              <div className="lp-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW ── */}
      <div className="lp-preview-wrap">
        <div className="lp-preview-glow" aria-hidden />
        <div className="lp-preview-frame">
          <div className="lp-titlebar">
            <div className="lp-tb-dot" style={{ background: '#ff5f5f' }} />
            <div className="lp-tb-dot" style={{ background: '#f5a623' }} />
            <div className="lp-tb-dot" style={{ background: '#00e5a0' }} />
            <span className="lp-tb-label">SubTracker Dashboard</span>
          </div>
          <div className="lp-preview-body">
            {/* Mini sidebar */}
            <div className="lp-preview-sidebar">
              <div className="lp-ps-logo">
                <div className="lp-ps-mark">📊</div>
                <span className="lp-ps-text">SubTracker</span>
              </div>
              {['📊 Dashboard','📋 Subscriptions','⏳ Trials','💰 Save Money','📈 Analytics','⚙️ Settings']
                .map((item, i) => (
                  <div key={item} className={`lp-ps-item${i === 0 ? ' lp-ps-active' : ''}`}>{item}</div>
                ))}
            </div>
            {/* Mini content */}
            <div className="lp-preview-main">
              <div className="lp-pm-metrics">
                {[
                  { label: 'Monthly Spend',  val: '₹3,240', sub: 'across 9 services', color: 'var(--accent)' },
                  { label: 'Renewing Soon',   val: '3',      sub: 'in next 5 days',   color: 'var(--amber)'  },
                  { label: 'Annual Total',    val: '₹38,880',sub: 'projected spend',  color: 'var(--blue)'   },
                ].map(m => (
                  <div key={m.label} className="lp-pm-card">
                    <div className="lp-pmc-label">{m.label}</div>
                    <div className="lp-pmc-val" style={{ color: m.color }}>{m.val}</div>
                    <div className="lp-pmc-sub">{m.sub}</div>
                  </div>
                ))}
              </div>
              <div className="lp-pm-rows">
                {[
                  { icon:'🎬', bg:'rgba(229,9,20,.15)',  name:'Netflix',         amt:'₹149',  cycle:'/mo', badge:'Active',          badgeBg:'rgba(0,229,160,.12)', badgeC:'var(--accent)' },
                  { icon:'🎵', bg:'rgba(29,185,84,.15)', name:'Spotify',         amt:'₹119',  cycle:'/mo', badge:'Renews in 3d',    badgeBg:'rgba(245,166,35,.12)',badgeC:'var(--amber)'  },
                  { icon:'📺', bg:'rgba(0,161,225,.15)', name:'Disney+ Hotstar', amt:'₹899',  cycle:'/yr', badge:'Active',          badgeBg:'rgba(0,229,160,.12)', badgeC:'var(--accent)' },
                ].map(r => (
                  <div key={r.name} className="lp-pm-row">
                    <div className="lp-pm-icon" style={{ background: r.bg }}>{r.icon}</div>
                    <div className="lp-pm-name">{r.name}</div>
                    <div className="lp-pm-amt">{r.amt}<span className="lp-pm-cycle">{r.cycle}</span></div>
                    <div className="lp-pm-badge" style={{ background: r.badgeBg, color: r.badgeC }}>{r.badge}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="lp-how">
        <div className="lp-how-inner">
          <div className="lp-section-center">
            <div className="lp-tag">⚡ Simple setup</div>
            <h2 className="lp-h2">Up and running in 30 seconds</h2>
            <p className="lp-section-sub">No bank access needed. No complicated setup. Just sign in with Google and you&apos;re done.</p>
          </div>
          <div className="lp-steps">
            {[
              { num: '1', title: 'Sign in with Google',     desc: "One click. We use Google's secure OAuth — we never see your password. Your data stays safe." },
              { num: '2', title: 'Tap what you pay for',    desc: 'Select from 30+ Indian services. Prices are pre-filled — Netflix ₹149, Spotify ₹119. Confirm and done.' },
              { num: '3', title: 'Get renewal alerts',      desc: 'We email you 5 days before every renewal. Never get surprised by a charge again.' },
            ].map((s, i) => (
              <div key={s.num} className="lp-step-card lp-reveal" ref={addReveal(i * 0.1)}>
                <div className="lp-step-num">{s.num}</div>
                <div className="lp-step-title">{s.title}</div>
                <div className="lp-step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="lp-features-section">
        <div className="lp-features-inner">
          <div className="lp-tag">✨ Everything you need</div>
          <h2 className="lp-h2">Built different.<br />Built for India.</h2>
          <p className="lp-section-sub">Every feature your competitors don&apos;t have — UPI support, Indian pricing, Hindi coming soon.</p>

          <div className="lp-features-grid">
            {[
              { icon:'📧', title:'Gmail Scanner',      desc:'Our 6-layer AI engine scans your Gmail for subscription receipts. Detects amount, billing cycle, and confidence score automatically.', tag:'6-layer detection', color:'green',  delay: 0   },
              { icon:'🔔', title:'Renewal Alerts',     desc:'Email alerts 5 days before any subscription renews. Never get surprised by a charge you forgot about.',                              tag:'Email + in-app',   color:'green',  delay: 0.1 },
              { icon:'🇮🇳', title:'India First',       desc:'30+ Indian services pre-loaded with real ₹ prices. Netflix, Hotstar, Spotify, JioCinema, Swiggy One, Zomato Gold and more.',       tag:'UPI aware',        color:'blue',   delay: 0.2 },
              { icon:'💰', title:'Save Money Mode',    desc:'Step-by-step cancellation guides for every service. Switch to annual and save up to 40%. Find cheaper alternatives automatically.',  tag:'Cancel guides',    color:'blue',   delay: 0   },
              { icon:'⏳', title:'Trial Tracker',      desc:'Track all your free trials in one place. Get alerted before they convert to paid subscriptions so you can cancel in time.',          tag:'Never pay accidentally', color:'amber', delay: 0.1 },
              { icon:'📊', title:'Spending Analytics', desc:'See exactly where your money goes — by category, by month, by service. Monthly trend charts and category breakdowns.',               tag:'Full breakdown',   color:'amber',  delay: 0.2 },
            ].map((f, i) => (
              <div key={f.title} className={`lp-feature-card lp-fc-${f.color} lp-reveal`} ref={addReveal(f.delay)}>
                <div className="lp-feature-icon">{f.icon}</div>
                <div className="lp-feature-title">{f.title}</div>
                <div className="lp-feature-desc">{f.desc}</div>
                <span className={`lp-feature-tag lp-tag-${f.color}`}>{f.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INDIA SECTION ── */}
      <section className="lp-india">
        <div className="lp-india-inner">
          <div className="lp-india-text">
            <div className="lp-tag">🇮🇳 Made for India</div>
            <h2 className="lp-h2">Every Indian app.<br />Real ₹ prices.</h2>
            <p className="lp-section-sub">ReSubs, Tilla, Rocket Money — all US-built. No UPI, no rupees, no Indian apps. SubTracker is the only tracker built from the ground up for Indian users.</p>
            <div className="lp-india-checks">
              {[
                'Pre-filled Indian prices — no typing needed',
                'Monthly and annual billing cycles (Hotstar, Prime)',
                'UPI autopay awareness built in',
                'Hindi language support — coming soon',
              ].map(c => <div key={c} className="lp-india-check"><span>✓</span>{c}</div>)}
            </div>
          </div>
          <div className="lp-india-grid lp-reveal" ref={addReveal(0)}>
            {INDIA_SERVICES.map(s => (
              <div key={s.name} className="lp-india-service">
                <div className="lp-is-icon">{s.icon}</div>
                <div className="lp-is-name">{s.name}</div>
                <div className="lp-is-price">{s.price}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="lp-testimonials">
        <div className="lp-testimonials-inner">
          <div className="lp-section-center">
            <div className="lp-tag">💬 Real users</div>
            <h2 className="lp-h2">People are saving money</h2>
          </div>
          <div className="lp-testi-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={t.name} className="lp-testi-card lp-reveal" ref={addReveal(i * 0.1)}>
                <div className="lp-testi-stars">★★★★★</div>
                <p className="lp-testi-text">{t.text}</p>
                <div className="lp-testi-author">
                  <div className="lp-testi-avatar" style={{ background: t.grad }}>{t.initial}</div>
                  <div>
                    <div className="lp-testi-name">{t.name}</div>
                    <div className="lp-testi-loc">{t.loc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="lp-pricing">
        <div className="lp-pricing-inner">
          <div className="lp-section-center">
            <div className="lp-tag">💎 Simple pricing</div>
            <h2 className="lp-h2">Free to start.<br />Cheap to upgrade.</h2>
            <p className="lp-section-sub">Less than one Netflix subscription to track all your subscriptions.</p>
          </div>
          <div className="lp-pricing-grid">
            {/* Free */}
            <div className="lp-price-card lp-reveal" ref={addReveal(0)}>
              <div className="lp-price-name">Free</div>
              <div className="lp-price-amount">₹0</div>
              <div className="lp-price-cycle">forever free</div>
              <ul className="lp-price-features">
                {['Up to 7 subscriptions','Gmail scanner','Renewal alerts','Cancellation guides'].map(f =>
                  <li key={f}>{f}</li>
                )}
                {['Monthly email reports','CSV bank statement upload','Priority support'].map(f =>
                  <li key={f} className="lp-price-dim">{f}</li>
                )}
              </ul>
              <button className="lp-price-btn lp-price-ghost" onClick={() => signIn('google')}>
                Get started free
              </button>
            </div>
            {/* Premium */}
            <div className="lp-price-card lp-price-featured lp-reveal" ref={addReveal(0.1)}>
              <div className="lp-price-popular">Most popular</div>
              <div className="lp-price-name">Premium</div>
              <div className="lp-price-amount lp-price-accent">₹99</div>
              <div className="lp-price-cycle">per month</div>
              <ul className="lp-price-features">
                {['Unlimited subscriptions','Gmail scanner','Renewal alerts','Cancellation guides','Monthly email reports','CSV bank statement upload','Priority support'].map(f =>
                  <li key={f}>{f}</li>
                )}
              </ul>
              <button className="lp-price-btn lp-price-primary" onClick={() => signIn('google')}>
                Start free trial →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta">
        <div className="lp-cta-box">
          <div className="lp-cta-glow" aria-hidden />
          <h2 className="lp-cta-title">Start saving money<br />today. It's free.</h2>
          <p className="lp-cta-sub">Join thousands of Indians who stopped wasting money on forgotten subscriptions. Setup takes 30 seconds.</p>
          <button className="lp-btn-primary lp-cta-btn" onClick={() => signIn('google')}>
            🚀 Get started — it's free
          </button>
          <p className="lp-cta-note">No credit card. No bank access. Just Google sign-in.</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-left">
          <div className="lp-logo-mark" style={{ width: 28, height: 28, fontSize: 14 }}>📊</div>
          <span className="lp-footer-copy">© 2026 SubTracker. Made with ❤️ in India.</span>
        </div>
        <div className="lp-footer-links">
          <a href="/privacy" className="lp-footer-link">Privacy Policy</a>
          <a href="/terms"   className="lp-footer-link">Terms of Service</a>
          <a href="mailto:hello@subtracker.app" className="lp-footer-link">Contact</a>
        </div>
      </footer>

    </div>
  );
}
