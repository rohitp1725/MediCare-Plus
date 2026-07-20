import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const QUICK_PROMPTS = [
  'What are my adherence tips?',
  'How to manage high blood pressure?',
  'What foods help control glucose?',
  'When should I see a doctor urgently?',
]

const HEALTH_TIPS = [
  { emoji: '💊', tip: 'Take medicines at the same time each day to build a habit.' },
  { emoji: '🚶', tip: 'A 30-minute walk daily can reduce blood pressure by 5–8 mmHg.' },
  { emoji: '🥗', tip: 'A low-sodium diet helps control hypertension — aim for under 2g/day.' },
  { emoji: '💧', tip: 'Stay hydrated. Drink at least 8 glasses of water daily.' },
  { emoji: '😴', tip: '7–9 hours of sleep helps regulate blood sugar and heart health.' },
  { emoji: '🧘', tip: 'Stress raises blood pressure. Try 5 minutes of deep breathing daily.' },
]

const MOCK_RESPONSES: Record<string, string> = {
  default: `I'm your AI health assistant. I can help you understand your health data, medication schedules, and general wellness tips.

⚠️ **Note**: I provide general health information only — not medical advice. Always consult your doctor for medical decisions.

You can ask me about:
• Medication adherence tips
• Understanding your vitals
• Healthy lifestyle guidance
• When to seek medical attention`,
  adherence: `Here are your top medication adherence tips:

1. **Set daily alarms** — Use your phone to remind you at each scheduled dose time
2. **Use a pill organizer** — Preparing a week's doses makes it easy to check if you've taken them
3. **Link doses to habits** — Take medicines with meals or right after brushing teeth
4. **Don't skip, don't double** — If you miss a dose, skip it and wait for the next one (unless your doctor says otherwise)
5. **Track in the app** — Use the Daily Tracker every morning to stay accountable`,
  bp: `Managing high blood pressure:

• **Diet**: Reduce salt (<2g/day), eat more fruits, vegetables, and whole grains (DASH diet)
• **Exercise**: 30 mins moderate activity most days
• **Alcohol**: Limit to 1 drink/day for women, 2 for men
• **No smoking**: Each cigarette raises BP temporarily and damages arteries long-term
• **Medication compliance**: Take prescribed BP medicines even when you feel fine
• **Monitor regularly**: Log your readings in the Vitals section of this app

📊 *Check your recent readings in [Health Logs](/patient/health)*`,
  glucose: `Foods that help control blood glucose:

**Eat more of:**
• Non-starchy vegetables (broccoli, spinach, peppers)
• Whole grains (oats, quinoa, brown rice)
• Legumes (lentils, chickpeas, black beans)
• Lean proteins (chicken, fish, tofu)
• Healthy fats (avocado, nuts, olive oil)

**Limit:**
• White bread, rice, pasta
• Sugary drinks and desserts
• Processed snacks
• Alcohol

🎯 *Aim for consistent meal times to keep glucose stable*`,
  urgent: `Seek emergency care immediately if you experience:

🚨 **Call emergency services (112/911) for:**
• Chest pain or pressure
• Sudden severe headache
• Difficulty breathing
• Weakness or numbness on one side of body
• Sudden vision changes or confusion
• Blood glucose below 54 mg/dL with confusion
• Blood pressure above 180/120 mmHg with symptoms

📞 **Contact your doctor same day for:**
• Blood pressure consistently above 160/100
• Blood glucose above 300 mg/dL
• Missed medicines for 2+ days
• New or worsening symptoms`,
}

function getMockResponse(input: string): string {
  const lower = input.toLowerCase()
  if (lower.includes('adherence') || lower.includes('miss') || lower.includes('dose') || lower.includes('reminder')) return MOCK_RESPONSES.adherence
  if (lower.includes('blood pressure') || lower.includes('bp') || lower.includes('hypertension')) return MOCK_RESPONSES.bp
  if (lower.includes('glucose') || lower.includes('sugar') || lower.includes('diabetes') || lower.includes('food')) return MOCK_RESPONSES.glucose
  if (lower.includes('urgent') || lower.includes('emergency') || lower.includes('doctor') || lower.includes('when')) return MOCK_RESPONSES.urgent
  return MOCK_RESPONSES.default
}

export function PatientAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: MOCK_RESPONSES.default,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  function sendMessage(text?: string) {
    const content = (text ?? input).trim()
    if (!content || isTyping) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Simulate streaming delay
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getMockResponse(content),
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiMsg])
      setIsTyping(false)
    }, 1200)
  }

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-lavender/15 flex items-center justify-center">
          <Sparkles size={20} className="text-lavender" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-ink">AI Health Assistant</h3>
            <Badge label="Demo Mode" variant="lavender" />
          </div>
          <p className="text-xs text-slate-light">General wellness guidance — not a substitute for medical advice</p>
        </div>
      </div>

      {/* Daily Health Tips */}
      <Card>
        <CardBody>
          <p className="text-xs font-semibold text-slate-light uppercase tracking-wide mb-3">💡 Daily Health Tips</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {HEALTH_TIPS.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-sm bg-cream">
                <span className="text-base shrink-0 mt-0.5">{tip.emoji}</span>
                <p className="text-[12px] text-slate leading-relaxed">{tip.tip}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Chat */}
      <Card>
        <CardBody className="p-0">
          {/* Messages */}
          <div className="h-80 overflow-y-auto p-4 space-y-4">
            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    msg.role === 'assistant' ? 'bg-lavender/15' : 'bg-sage/15'
                  }`}>
                    {msg.role === 'assistant'
                      ? <Bot size={14} className="text-lavender" />
                      : <User size={14} className="text-sage" />
                    }
                  </div>
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 text-[13px] leading-relaxed ${
                    msg.role === 'assistant'
                      ? 'bg-cream text-ink'
                      : 'bg-sage text-white'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2.5"
                >
                  <div className="w-7 h-7 rounded-full bg-lavender/15 flex items-center justify-center shrink-0">
                    <Bot size={14} className="text-lavender" />
                  </div>
                  <div className="bg-cream rounded-lg px-3 py-2 flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-lavender animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-lavender animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-lavender animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          <div className="px-4 pb-3">
            <div className="flex gap-2 flex-wrap">
              {QUICK_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-border text-slate-light hover:border-lavender hover:text-lavender hover:bg-lavender/5 transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="flex gap-2 p-4 pt-2 border-t border-border">
            <input
              className="flex-1 bg-cream border border-border rounded-sm px-3 py-2 text-sm text-ink placeholder:text-slate-lighter outline-none focus:border-lavender transition-colors"
              placeholder="Ask a health question..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
              leftIcon={<Send size={14} />}
            >
              Send
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* CTA to reports */}
      <Link to="/patient/reports">
        <Card>
          <CardBody className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="text-sm font-semibold text-ink">View Your Health Reports</p>
                <p className="text-xs text-slate-light">Adherence %, vitals trends, and more</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-lighter" />
          </CardBody>
        </Card>
      </Link>
    </div>
  )
}
