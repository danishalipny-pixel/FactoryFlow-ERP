import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Key,
} from 'lucide-react';
import { Modal } from '../common/Modal';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  source?: string;
  timestamp: string;
}

export const AiAssistantView: React.FC = () => {
  const { language, isRtl, t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'assistant',
      text:
        language === 'en'
          ? 'Welcome! I am your FactoryFlow AI Manufacturing Assistant connected directly to live factory data in 10th of Ramadan. I can answer questions about delayed orders, material shortages, actual job costing, and work center bottlenecks. How can I assist with your operations today?'
          : 'مرحباً بك! أنا مساعد FactoryFlow الذكي لمصنع الأهرام للصناعات الهندسية بالعاشر من رمضان. أنا متصل مباشرة بقاعدة بيانات المصنع الحية ومستعد للإجابة عن الأوامر المتأخرة، عجز الخامات، تكاليف التشغيل، وهوامش ربحية التعاقدات. كيف يمكنني خدمتك اليوم؟',
      source: 'live-erp',
      timestamp: new Date().toLocaleTimeString(language === 'en' ? 'en-US' : 'ar-EG', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiSettings, setAiSettings] = useState<any>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [modelInput, setModelInput] = useState('gpt-4o-mini');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSettings = async () => {
    try {
      const res = await apiRequest('/ai/settings');
      setAiSettings(res);
      setModelInput(res.model || 'gpt-4o-mini');
    } catch (e) {
      console.error('Failed to load AI settings:', e);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString(language === 'en' ? 'en-US' : 'ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await apiRequest('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text, language }),
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.reply,
        source: res.source,
        timestamp: new Date().toLocaleTimeString(language === 'en' ? 'en-US' : 'ar-EG', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: language === 'en' ? `Error processing AI query: ${err.message}` : `عذراً، حدث خطأ: ${err.message}`,
        timestamp: new Date().toLocaleTimeString(language === 'en' ? 'en-US' : 'ar-EG', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/ai/settings', {
        method: 'POST',
        body: JSON.stringify({
          apiKey: apiKeyInput,
          model: modelInput,
        }),
      });
      setIsConfigOpen(false);
      alert(language === 'en' ? 'AI settings saved successfully!' : 'تم حفظ إعدادات الذكاء الاصطناعي بنجاح!');
      loadSettings();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const quickChips = language === 'en'
    ? [
        { label: 'Which production orders are delayed?', query: 'Which production orders are delayed?' },
        { label: 'Are there any raw material shortages?', query: 'Are there any raw material shortages?' },
        { label: 'What is the profitability of Elsewedy order?', query: 'What is the actual cost and gross margin for the Elsewedy order?' },
        { label: 'Identify work center bottlenecks', query: 'Which work centers have the highest load or bottlenecks?' },
      ]
    : [
        { label: 'ما هي الطلبات المتأخرة حالياً؟', query: 'ما هي الطلبات المتأخرة حالياً؟' },
        { label: 'هل يوجد عجز في خامات التشغيل؟', query: 'ما هي الخامات التي يوجد بها عجز في المخزن؟' },
        { label: 'ما هي ربحية أمر تصنيع السويدي؟', query: 'ما هي التكلفة الفعلية والربحية لأمر تشغيل السويدي؟' },
        { label: 'مراكز العمل الأكثر ضغطاً واختناقاً', query: 'ما هي مراكز التشغيل التي تمثل عنق زجاجة؟' },
      ];

  return (
    <div className="space-y-4 animate-fade-in flex flex-col h-[calc(100vh-140px)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                {language === 'en' ? 'FactoryFlow AI Manufacturing Copilot' : 'المساعد الذكي لإدارة مصنع العاشر من رمضان'}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {aiSettings?.hasApiKey ? `OpenAI (${aiSettings.model})` : (language === 'en' ? 'Native ERP Intelligence' : 'محرك ERP الداخلي')}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {language === 'en' ? 'Live ERP Database Context & Accurate Costing' : 'متصل بقاعدة البيانات الحية لحساب التكاليف ومراقبة الجدولة'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsConfigOpen(true)}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
        >
          <Key className="w-3.5 h-3.5 text-slate-500" />
          <span>{language === 'en' ? 'OpenAI Settings' : 'إعدادات OpenAI'}</span>
        </button>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 overflow-y-auto space-y-4">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-industrial-900 text-white'
                    : 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-industrial-900 text-white rounded-te-none'
                    : 'bg-slate-50 border border-slate-200/80 text-slate-900 rounded-ts-none'
                }`}
              >
                <div className="whitespace-pre-line font-sans">{m.text}</div>
                <div
                  className={`mt-1.5 flex items-center gap-2 text-[10px] ${
                    isUser ? 'text-slate-300 justify-end' : 'text-slate-400'
                  }`}
                >
                  <span>{m.timestamp}</span>
                  {!isUser && m.source && (
                    <span className="font-mono px-1 rounded bg-slate-200 text-slate-700">
                      {m.source}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-500 font-medium">
              {language === 'en' ? 'Scanning live factory ERP database metrics...' : 'جاري فحص مؤشرات وقاعدة بيانات المصنع الحية...'}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
        <span className="text-[11px] font-bold text-slate-500 shrink-0">
          {language === 'en' ? 'Suggested Queries:' : 'أسئلة مقترحة:'}
        </span>
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip.query)}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-[11px] font-semibold text-slate-700 transition-all shrink-0 shadow-2xs"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm shrink-0 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
          placeholder={
            language === 'en'
              ? 'Ask AI assistant about delayed orders, material shortages, job costing, or bottlenecks...'
              : 'اسأل المساعد الذكي عن أي عملية إنتاج، عجز خامات، تكلفة، أو جدول زمني...'
          }
          className="flex-1 px-3 py-2 text-xs border-0 focus:ring-0 outline-none placeholder:text-slate-400 bg-transparent"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!input.trim() || loading}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{language === 'en' ? 'Send' : 'إرسال'}</span>
        </button>
      </div>

      {/* MODAL: AI OPENAI CONFIGURATION */}
      <Modal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        title={language === 'en' ? 'OpenAI API Configuration' : 'إعدادات مفتاح OpenAI API'}
        subtitle={language === 'en' ? 'Secure server-side API key protection' : 'حماية المفتاح في جانب الخادم واستخدامه لتحليل بيانات المصنع'}
      >
        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">OpenAI API Key</label>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="sk-proj-..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              {language === 'en'
                ? 'If left blank, the system automatically uses the built-in native ERP intelligence engine with zero downtime.'
                : 'إذا تُرك الحقل فارغاً، سيعتمد النظام تلقائياً على محرك الذكاء الاصطناعي الداخلي المربوط بقاعدة بيانات ERP الحية دون أي توقف أو تكلفة خارجية.'}
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {language === 'en' ? 'Model Selection' : 'النموذج (Model)'}
            </label>
            <select
              value={modelInput}
              onChange={(e) => setModelInput(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
            >
              <option value="gpt-4o-mini">gpt-4o-mini (Fast, cost-effective, recommended for factory floors)</option>
              <option value="gpt-4o">gpt-4o (Maximum precision for complex multi-level costing)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsConfigOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm"
            >
              {language === 'en' ? 'Save Settings' : 'حفظ الإعدادات'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
