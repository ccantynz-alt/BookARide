import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Brain,
  User,
  Loader2,
  Sparkles,
  FileText,
  TrendingUp,
  Shield,
  DollarSign,
  BarChart3,
  ChevronRight,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';

const suggestedPrompts = [
  { icon: DollarSign, text: "What's my current tax liability?", category: 'Tax' },
  { icon: TrendingUp, text: 'Analyze my cash flow for this quarter', category: 'Finance' },
  { icon: Shield, text: 'Find applicable tax treaty benefits', category: 'Treaty' },
  { icon: BarChart3, text: 'Check my compliance status', category: 'Compliance' },
  { icon: FileText, text: 'Create an invoice for Pacific Trading Co', category: 'Action' },
  { icon: Sparkles, text: 'What are my top expense categories?', category: 'Insight' },
];

const initialMessages = [
  {
    id: 1,
    role: 'assistant',
    content: "Hello! I'm your AI accounting assistant. I have context about your organization, recent transactions, and tax obligations. How can I help you today?",
    timestamp: new Date(Date.now() - 60000),
  },
];

const mockResponses = {
  tax: {
    content: `Based on your current data, here's your tax liability breakdown:

**Current Quarter Tax Summary (Q1 2026)**

| Jurisdiction | Tax Type | Amount |
|---|---|---|
| New Zealand | GST | $8,602.50 |
| Australia | GST | $2,390.00 |
| United Kingdom | VAT | $660.00 |
| United States | Sales Tax | $3,856.00 |

**Total estimated tax liability: $15,508.50**

Key notes:
- Your NZ GST return is due **March 28** (9 days away)
- US Q4 2025 sales tax return is **4 days overdue** - I recommend filing immediately
- You have **$2,340 in unclaimed GST input credits** from Q4 2025

Would you like me to prepare any of these returns?`,
    hasTable: true,
  },
  cashflow: {
    content: `Here's your cash flow analysis for Q1 2026:

**Cash Flow Summary**
- Opening Balance (Jan 1): $178,200
- Cash In: $142,580
- Cash Out: ($117,340)
- **Closing Balance: $203,440**

**Monthly Breakdown:**

| Month | Inflows | Outflows | Net |
|---|---|---|---|
| January | $42,300 | $38,200 | +$4,100 |
| February | $48,900 | $41,500 | +$7,400 |
| March (to date) | $51,380 | $37,640 | +$13,740 |

**AI Observations:**
1. Cash inflows are trending upward (+12.5% MoM)
2. Your largest expense categories are Cloud Hosting ($4,668) and Payroll ($42,000)
3. At current burn rate, you have approximately **5.2 months of runway**
4. 3 outstanding invoices totaling $12,450 are expected within 14 days

Would you like me to generate a detailed cash flow forecast?`,
    hasTable: true,
  },
  default: {
    content: "I've analyzed your request. Let me pull together the relevant data from your accounts. Is there anything specific you'd like me to focus on?",
    hasTable: false,
  },
};

export default function AIAssistant() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text = input) => {
    if (!text.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Simulate AI response
    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));

    const lowerText = text.toLowerCase();
    let response;
    if (lowerText.includes('tax') && (lowerText.includes('liability') || lowerText.includes('status'))) {
      response = mockResponses.tax;
    } else if (lowerText.includes('cash flow') || lowerText.includes('cashflow')) {
      response = mockResponses.cashflow;
    } else {
      response = mockResponses.default;
    }

    const aiMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      hasTable: response.hasTable,
    };

    setMessages((prev) => [...prev, aiMessage]);
    setLoading(false);
  };

  const handlePromptClick = (prompt) => {
    handleSend(prompt);
  };

  const handleCopy = (id, content) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderContent = (content) => {
    // Simple markdown-like rendering
    const lines = content.split('\n');
    const elements = [];
    let inTable = false;
    let tableRows = [];

    lines.forEach((line, i) => {
      if (line.startsWith('|') && line.endsWith('|')) {
        if (line.includes('---')) return; // separator row
        const cells = line.split('|').filter(Boolean).map((c) => c.trim());
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        tableRows.push(cells);
        return;
      }

      if (inTable) {
        elements.push(
          <div key={`table-${i}`} className="my-3 overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-50">
                  {tableRows[0]?.map((cell, ci) => (
                    <th key={ci} className="px-3 py-2 text-left text-xs font-medium text-gray-500 border-b border-gray-200">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.slice(1).map((row, ri) => (
                  <tr key={ri} className="border-b border-gray-100 last:border-b-0">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2 text-gray-700">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        inTable = false;
        tableRows = [];
      }

      if (line.startsWith('**') && line.endsWith('**')) {
        elements.push(
          <p key={i} className="font-semibold text-gray-900 mt-3 mb-1">
            {line.replace(/\*\*/g, '')}
          </p>
        );
      } else if (line.match(/^\d+\.\s/)) {
        elements.push(
          <p key={i} className="ml-4 text-gray-700 leading-relaxed">
            {line.replace(/\*\*(.*?)\*\*/g, '$1')}
          </p>
        );
      } else if (line.startsWith('- ')) {
        elements.push(
          <p key={i} className="ml-4 text-gray-700 leading-relaxed flex items-start gap-1">
            <span className="text-gray-400 mt-1">&#8226;</span>
            {line.slice(2).replace(/\*\*(.*?)\*\*/g, '$1')}
          </p>
        );
      } else if (line.trim()) {
        elements.push(
          <p key={i} className="text-gray-700 leading-relaxed">
            {line.replace(/\*\*(.*?)\*\*/g, '$1')}
          </p>
        );
      } else {
        elements.push(<div key={i} className="h-2" />);
      }
    });

    // Handle trailing table
    if (inTable && tableRows.length > 0) {
      elements.push(
        <div key="table-end" className="my-3 overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-50">
                {tableRows[0]?.map((cell, ci) => (
                  <th key={ci} className="px-3 py-2 text-left text-xs font-medium text-gray-500 border-b border-gray-200">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.slice(1).map((row, ri) => (
                <tr key={ri} className="border-b border-gray-100 last:border-b-0">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 text-gray-700">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return elements;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #14b8a6, #0d9488)' }}>
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">AI Assistant</h1>
            <p className="text-xs text-gray-500">Context-aware financial advisor</p>
          </div>
        </div>
        <button
          onClick={() => setMessages(initialMessages)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
                style={{ background: 'linear-gradient(135deg, #14b8a6, #0d9488)' }}
              >
                <Brain className="w-4 h-4 text-white" />
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 shadow-sm'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="text-sm leading-relaxed">{msg.content}</p>
              ) : (
                <div className="text-sm">
                  {renderContent(msg.content)}
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy
                        </>
                      )}
                    </button>
                    <span className="text-xs text-gray-300">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 bg-gray-200">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #14b8a6, #0d9488)' }}
            >
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing your data...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      {messages.length <= 1 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
          {suggestedPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handlePromptClick(prompt.text)}
              className="text-left p-3 bg-white border border-gray-200 rounded-xl hover:border-teal-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-2 mb-1">
                <prompt.icon className="w-4 h-4 text-gray-400 group-hover:text-teal-500 transition-colors" />
                <span className="text-xs font-medium text-gray-400">{prompt.category}</span>
              </div>
              <p className="text-sm text-gray-700">{prompt.text}</p>
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="mt-4 bg-white border border-gray-200 rounded-xl p-3 flex items-end gap-3">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your finances, taxes, or compliance..."
          rows={1}
          className="flex-1 resize-none text-sm text-gray-900 placeholder-gray-400 outline-none min-h-[36px] max-h-[120px] py-2"
          style={{ lineHeight: '1.5' }}
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-50 flex-shrink-0"
          style={{ backgroundColor: '#14b8a6' }}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
