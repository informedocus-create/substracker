// components/Onboarding.jsx
// 3-screen onboarding flow: Welcome → Service Picker → Confirm Amounts
// Props:
//   onComplete  — called when user finishes or skips
//   addSub      — the existing addSub() from useSubs() context

'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { INDIAN_SERVICES, getCategories, getByCategory, CATEGORY_ICONS } from '@/lib/indianServices'
import { supabase } from '@/lib/supabase'

// ─── STEP INDICATOR ──────────────────────────────────────────────────────────

function StepDots({ current }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 32 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: i === current ? 24 : 8,
          height: 8,
          borderRadius: 4,
          background: i === current ? '#FF6B35' : '#E5E0D8',
          transition: 'all 0.3s ease',
        }} />
      ))}
    </div>
  )
}

// ─── SCREEN 1: WELCOME ───────────────────────────────────────────────────────

function WelcomeScreen({ onStart, onSkip, userName }) {
  return (
    <div style={styles.screenWrap}>
      <div style={styles.card}>
        <div style={styles.welcomeEmoji}>👋</div>
        <h1 style={styles.welcomeTitle}>
          Welcome{userName ? `, ${userName.split(' ')[0]}` : ''}!
        </h1>
        <p style={styles.welcomeSub}>
          Let's set up your dashboard in <strong>30 seconds</strong>.<br />
          Tap the services you're currently paying for.
        </p>

        <div style={styles.benefitList}>
          {[
            { icon: '⚡', text: 'Pre-filled Indian prices — no typing needed' },
            { icon: '📊', text: 'Instant dashboard with your monthly total' },
            { icon: '🔔', text: 'Renewal alerts before you get charged' },
          ].map((b, i) => (
            <div key={i} style={styles.benefitRow}>
              <span style={styles.benefitIcon}>{b.icon}</span>
              <span style={styles.benefitText}>{b.text}</span>
            </div>
          ))}
        </div>

        <button onClick={onStart} style={styles.btnPrimary}>
          Let's go →
        </button>
        <button onClick={onSkip} style={styles.btnGhost}>
          Skip — I'll add manually
        </button>
      </div>
    </div>
  )
}

// ─── SCREEN 2: LOGO GRID ─────────────────────────────────────────────────────

function LogoGrid({ selected, onToggle, onContinue, onBack }) {
  const categories = getCategories()

  return (
    <div style={styles.screenWrap}>
      <div style={{ ...styles.card, maxWidth: 680 }}>
        <h2 style={styles.gridTitle}>What are you paying for?</h2>
        <p style={styles.gridSub}>Tap to select. We'll pre-fill the prices.</p>

        <div style={styles.scrollArea}>
          {categories.map(cat => {
            const services = getByCategory(cat)
            return (
              <div key={cat} style={{ marginBottom: 24 }}>
                <div style={styles.catLabel}>
                  <span>{CATEGORY_ICONS[cat]}</span>
                  <span>{cat}</span>
                </div>
                <div style={styles.logoGrid}>
                  {services.map(service => {
                    const isSelected = selected.includes(service.id)
                    return (
                      <button
                        key={service.id}
                        onClick={() => onToggle(service.id)}
                        style={{
                          ...styles.logoBtn,
                          background: isSelected ? '#FFF5F0' : '#FFFFFF',
                          border: isSelected ? '2px solid #FF6B35' : '1.5px solid #E5E0D8',
                          transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                        }}
                      >
                        {/* Logo image with color-dot fallback */}
                        <img
                          src={service.logo}
                          alt={service.name}
                          style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'contain' }}
                          onError={e => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                        <div style={{
                          ...styles.logoDot,
                          background: service.color,
                          display: 'none',
                        }} />
                        <span style={{
                          ...styles.logoName,
                          color: isSelected ? '#FF6B35' : '#1A1814',
                          fontWeight: isSelected ? 600 : 400,
                        }}>
                          {service.name}
                        </span>
                        {isSelected && (
                          <div style={styles.checkBadge}>✓</div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div style={styles.bottomBar}>
          <button onClick={onBack} style={styles.btnBack}>← Back</button>
          <button
            onClick={onContinue}
            disabled={selected.length === 0}
            style={{
              ...styles.btnPrimary,
              opacity: selected.length === 0 ? 0.4 : 1,
              cursor: selected.length === 0 ? 'not-allowed' : 'pointer',
              margin: 0,
            }}
          >
            Continue with {selected.length} selected →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── SCREEN 3: CONFIRM AMOUNTS ───────────────────────────────────────────────

function ConfirmAmounts({ selected, onSave, onBack, loading }) {
  // Build initial state from selected service IDs
  const initialData = selected.map(id => {
    const service = INDIAN_SERVICES.find(s => s.id === id)
    const defaultPlan = service.plans[service.defaultPlan]
    return {
      id: service.id,
      name: service.name,
      color: service.color,
      category: service.category,
      plans: service.plans,
      selectedPlanIndex: service.defaultPlan,
      amount: defaultPlan.amount,
      cycle: defaultPlan.cycle,
      payVia: 'upi',
    }
  })

  const [items, setItems] = useState(initialData)

  function updateItem(id, field, value) {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item
      if (field === 'selectedPlanIndex') {
        const plan = item.plans[value]
        return { ...item, selectedPlanIndex: value, amount: plan.amount, cycle: plan.cycle }
      }
      return { ...item, [field]: value }
    }))
  }

  const totalMonthly = items.reduce((sum, item) => {
    if (item.cycle === 'monthly')   return sum + item.amount
    if (item.cycle === 'yearly')    return sum + Math.round(item.amount / 12)
    if (item.cycle === 'quarterly') return sum + Math.round(item.amount / 3)
    return sum + item.amount
  }, 0)

  return (
    <div style={styles.screenWrap}>
      <div style={{ ...styles.card, maxWidth: 600 }}>
        <h2 style={styles.gridTitle}>Confirm your plans</h2>
        <p style={styles.gridSub}>
          We've pre-filled Indian prices. Edit anything that's different for you.
        </p>

        <div style={styles.scrollArea}>
          {items.map(item => (
            <div key={item.id} style={styles.confirmCard}>
              <div style={styles.confirmHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                      src={`/logos/${item.id}.png`}
                      alt={item.name}
                      style={{ width: 28, height: 28, objectFit: 'contain' }}
                      onError={e => { e.target.style.display = 'none' }}
                    />
                  </div>
                  <div>
                    <div style={styles.confirmName}>{item.name}</div>
                    <div style={styles.confirmCat}>{CATEGORY_ICONS[item.category]} {item.category}</div>
                  </div>
                </div>
                <div style={styles.confirmAmount}>
                  ₹{item.amount.toLocaleString('en-IN')}
                  <span style={styles.confirmCycle}>/{item.cycle === 'yearly' ? 'yr' : item.cycle === 'quarterly' ? 'qtr' : 'mo'}</span>
                </div>
              </div>

              <div style={styles.confirmFields}>
                {/* Plan selector */}
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>Plan</label>
                  <select
                    value={item.selectedPlanIndex}
                    onChange={e => updateItem(item.id, 'selectedPlanIndex', Number(e.target.value))}
                    style={styles.select}
                  >
                    {item.plans.map((plan, i) => (
                      <option key={i} value={i}>
                        {plan.name} — ₹{plan.amount}/{plan.cycle === 'yearly' ? 'yr' : plan.cycle === 'quarterly' ? 'qtr' : 'mo'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom amount override */}
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>Amount (₹)</label>
                  <input
                    type="number"
                    value={item.amount}
                    onChange={e => updateItem(item.id, 'amount', Number(e.target.value))}
                    style={styles.input}
                  />
                </div>

                {/* Pay via */}
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>Pay via</label>
                  <div style={styles.payRow}>
                    {['upi', 'card', 'netbanking', 'other'].map(method => (
                      <button
                        key={method}
                        onClick={() => updateItem(item.id, 'payVia', method)}
                        style={{
                          ...styles.payBtn,
                          background: item.payVia === method ? '#FF6B35' : '#F7F5F0',
                          color: item.payVia === method ? '#fff' : '#8A8478',
                          border: item.payVia === method ? '1.5px solid #FF6B35' : '1.5px solid #E5E0D8',
                        }}
                      >
                        {method === 'upi' ? 'UPI' : method === 'card' ? 'Card' : method === 'netbanking' ? 'Net Banking' : 'Other'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Total bar */}
          <div style={styles.totalBar}>
            <span style={styles.totalLabel}>Estimated monthly total</span>
            <span style={styles.totalAmount}>₹{totalMonthly.toLocaleString('en-IN')}/mo</span>
          </div>
        </div>

        <div style={styles.bottomBar}>
          <button onClick={onBack} style={styles.btnBack}>← Back</button>
          <button
            onClick={() => onSave(items)}
            disabled={loading}
            style={{ ...styles.btnPrimary, margin: 0 }}
          >
            {loading ? 'Saving...' : `Save ${items.length} subscription${items.length !== 1 ? 's' : ''} →`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN ONBOARDING COMPONENT ───────────────────────────────────────────────

export default function Onboarding({ onComplete, addSub }) {
  const { data: session } = useSession()
  const [screen, setScreen] = useState(0)   // 0=welcome, 1=grid, 2=confirm
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)

  function toggleService(id) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  // Compute a default renewal date 30 days from today
  function defaultRenewalDate() {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().split('T')[0]
  }

  async function handleSave(items) {
    setLoading(true)
    try {
      for (const item of items) {
        // addSub() uses: name, amount, cycle, cat, status, date, currency
        await addSub({
          name:     item.name,
          amount:   item.amount,
          currency: 'INR',
          cycle:    item.cycle,
          cat:      item.category,      // ← the app uses "cat" not "category"
          status:   'active',
          date:     defaultRenewalDate(),
          // paymentMethod stored as extra context — addSub ignores unknown fields safely
          paymentMethod: item.payVia,
          source: 'onboarding_picker',
        })
      }

      // Mark user as onboarded in Supabase (guests are handled by localStorage in dashboard)
      if (session?.user?.id) {
        await supabase
          .from('profiles')
          .upsert({ id: session.user.id, onboarded: true })
      }

      onComplete()
    } catch (err) {
      console.error('Onboarding save failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.overlay}>
      <StepDots current={screen} />

      {screen === 0 && (
        <WelcomeScreen
          userName={session?.user?.name}
          onStart={() => setScreen(1)}
          onSkip={onComplete}
        />
      )}
      {screen === 1 && (
        <LogoGrid
          selected={selected}
          onToggle={toggleService}
          onContinue={() => setScreen(2)}
          onBack={() => setScreen(0)}
        />
      )}
      {screen === 2 && (
        <ConfirmAmounts
          selected={selected}
          onSave={handleSave}
          onBack={() => setScreen(1)}
          loading={loading}
        />
      )}
    </div>
  )
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: '#F7F5F0',
    zIndex: 1000,
    overflowY: 'auto',
    padding: '40px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  screenWrap: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  card: {
    background: '#FFFFFF',
    border: '1px solid #E5E0D8',
    borderRadius: 20,
    padding: '40px 36px',
    width: '100%',
    maxWidth: 480,
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
  },

  // Welcome screen
  welcomeEmoji: { fontSize: 48, marginBottom: 16, textAlign: 'center' },
  welcomeTitle: {
    fontFamily: 'system-ui, sans-serif',
    fontSize: 28,
    fontWeight: 700,
    textAlign: 'center',
    color: '#1A1814',
    marginBottom: 10,
    letterSpacing: '-0.02em',
  },
  welcomeSub: {
    fontSize: 15,
    color: '#8A8478',
    textAlign: 'center',
    lineHeight: 1.6,
    marginBottom: 28,
  },
  benefitList: {
    background: '#F7F5F0',
    borderRadius: 12,
    padding: '16px 20px',
    marginBottom: 28,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  benefitRow: { display: 'flex', alignItems: 'center', gap: 12 },
  benefitIcon: { fontSize: 18, flexShrink: 0 },
  benefitText: { fontSize: 14, color: '#1A1814' },

  // Grid screen
  gridTitle: {
    fontFamily: 'system-ui, sans-serif',
    fontSize: 22,
    fontWeight: 700,
    color: '#1A1814',
    marginBottom: 6,
    letterSpacing: '-0.01em',
  },
  gridSub: { fontSize: 14, color: '#8A8478', marginBottom: 24 },
  scrollArea: { maxHeight: 420, overflowY: 'auto', marginBottom: 20, paddingRight: 4 },
  catLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#8A8478',
    marginBottom: 10,
  },
  logoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: 8,
  },
  logoBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    padding: '12px 8px',
    borderRadius: 12,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    position: 'relative',
  },
  logoDot: {
    width: 36,
    height: 36,
    borderRadius: 10,
    flexShrink: 0,
  },
  logoName: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 1.3,
  },
  checkBadge: {
    position: 'absolute',
    top: 6, right: 6,
    width: 16, height: 16,
    borderRadius: '50%',
    background: '#FF6B35',
    color: '#fff',
    fontSize: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
  },

  // Confirm screen
  confirmCard: {
    border: '1px solid #E5E0D8',
    borderRadius: 14,
    padding: '16px',
    marginBottom: 12,
    background: '#FAFAF8',
  },
  confirmHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  confirmName: { fontSize: 15, fontWeight: 600, color: '#1A1814' },
  confirmCat: { fontSize: 11, color: '#8A8478', marginTop: 2 },
  confirmAmount: { fontSize: 20, fontWeight: 700, color: '#FF6B35', fontFamily: 'system-ui' },
  confirmCycle: { fontSize: 12, color: '#8A8478', fontWeight: 400 },
  confirmFields: { display: 'flex', flexDirection: 'column', gap: 10 },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 4 },
  fieldLabel: { fontSize: 11, fontWeight: 600, color: '#8A8478', textTransform: 'uppercase', letterSpacing: '0.08em' },
  select: {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1.5px solid #E5E0D8',
    background: '#fff',
    fontSize: 13,
    color: '#1A1814',
    cursor: 'pointer',
  },
  input: {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1.5px solid #E5E0D8',
    background: '#fff',
    fontSize: 14,
    color: '#1A1814',
    fontWeight: 600,
    width: 120,
  },
  payRow: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  payBtn: {
    padding: '5px 12px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },

  // Total bar
  totalBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#1A1814',
    borderRadius: 12,
    padding: '14px 18px',
    marginTop: 8,
  },
  totalLabel: { fontSize: 13, color: 'rgba(247,245,240,0.6)' },
  totalAmount: { fontSize: 20, fontWeight: 700, color: '#FF6B35', fontFamily: 'system-ui' },

  // Buttons
  btnPrimary: {
    display: 'block',
    width: '100%',
    padding: '14px 24px',
    background: '#FF6B35',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: 10,
    transition: 'opacity 0.15s',
  },
  btnGhost: {
    display: 'block',
    width: '100%',
    padding: '12px 24px',
    background: 'transparent',
    color: '#8A8478',
    border: '1.5px solid #E5E0D8',
    borderRadius: 12,
    fontSize: 14,
    cursor: 'pointer',
  },
  btnBack: {
    padding: '10px 18px',
    background: 'transparent',
    color: '#8A8478',
    border: '1.5px solid #E5E0D8',
    borderRadius: 10,
    fontSize: 14,
    cursor: 'pointer',
  },
  bottomBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
}
