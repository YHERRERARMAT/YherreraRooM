
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  Zap, 
  Send, 
  RefreshCw, 
  User, 
  Bot, 
  Calculator, 
  BookOpen, 
  Pencil, 
  X, 
  Save, 
  Bookmark, 
  BookmarkPlus, 
  Star, 
  Layers, 
  Activity, 
  ShieldCheck,
  Clock,
  HelpCircle,
  ThumbsUp, 
  ThumbsDown,
  Check,
  Copy,
  ExternalLink,
  Download // Nuevo icono para exportar
} from 'lucide-react';
import { 
  AppState, 
  ChatMessage, 
  PromptTone, 
  OutputFormat, 
  EducationLevel, 
  EvaluationType, 
  PromptImprovement, 
  HistoryItem, 
  PromptTemplate 
} from './types';
import { PromptArchitectSession } from './services/geminiService';

const STORAGE_KEY = 'promptflow_history_v3';
const TEMPLATES_KEY = 'promptflow_templates_v3';

const SUGGESTIONS = [
  "Unidad de 4 clases sobre probabilidad para 6to básico (Mineduc)",
  "Secuencia didáctica de 2 semanas para álgebra en 1ro medio",
  "Taller de 90 minutos sobre geometría 3D para 4to medio (ABP)",
  "Planificación de unidad: Números decimales para 5to básico"
];

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-gray-800 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-gray-500 hover:text-indigo-400 transition-colors py-3 group"
      >
        <h4 className="font-bold uppercase tracking-widest text-[10px] text-left">{title}</h4>
        <div className="bg-gray-800 p-1 rounded-md group-hover:bg-indigo-500/20 transition-colors">
          {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      </button>
      {isOpen && (
        <div className="pb-4 animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [level, setLevel] = useState<EducationLevel>(EducationLevel.B1);
  const [evaluation, setEvaluation] = useState<EvaluationType>(EvaluationType.FEEDBACK_INMEDIATO);
  
  const [loading, setLoading] = useState(false);
  const [appState, setAppState] = useState<AppState>('INITIAL');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [session, setSession] = useState<PromptArchitectSession | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEY);
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch (e) {}
    }
    const savedTemplates = localStorage.getItem(TEMPLATES_KEY);
    if (savedTemplates) {
      try { setTemplates(JSON.parse(savedTemplates)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  }, [templates]);

  const startNewSession = async (customInput?: string) => {
    const finalInput = customInput || input;
    if (!finalInput.trim()) return;
    
    setLoading(true);
    setAppState('REFINING');
    
    const newSession = new PromptArchitectSession(PromptTone.ACADEMICO, OutputFormat.TEXTO_PLANO, level, evaluation);
    setSession(newSession);
    
    const userMsg: ChatMessage = { id: crypto.randomUUID(), type: 'user', text: finalInput };
    setMessages([userMsg]);

    try {
      const response = await newSession.send(`Instrucción a mejorar: === ${finalInput} ===`);
      handleAIResponse(response);
    } catch (err) {
      setAppState('INITIAL');
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  const handleAIResponse = (response: any) => {
    if (response.status === 'asking') {
      const aiMsg: ChatMessage = { 
        id: crypto.randomUUID(), 
        type: 'ai', 
        text: response.content, 
        isQuestion: true 
      };
      setMessages(prev => [...prev, aiMsg]);
    } else if (response.status === 'completed') {
      const improvement: PromptImprovement = {
        improvedPrompt: response.finalPrompt,
        explanation: response.content,
        techniquesUsed: response.techniques || [],
        tips: response.tips || [],
        feedback: { rating: null }
      };
      
      const aiMsg: ChatMessage = { 
        id: crypto.randomUUID(), 
        type: 'ai', 
        text: response.content, 
        result: improvement 
      };
      setMessages(prev => [...prev, aiMsg]);
      setAppState('COMPLETED');

      const originalInput = messages[0]?.text || 'Instrucción desconocida';
      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        original: originalInput,
        improved: improvement,
        timestamp: Date.now(),
      };
      setHistory(prev => [newItem, ...prev].slice(0, 20));
    }
  };

  const sendAnswer = async () => {
    if (!input.trim() || !session || loading) return;
    setLoading(true);
    const userMsg: ChatMessage = { id: crypto.randomUUID(), type: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    try {
      const response = await session.send(currentInput);
      handleAIResponse(response);
    } finally {
      setLoading(false);
    }
  };

  const resetApp = () => {
    setAppState('INITIAL');
    setMessages([]);
    setSession(null);
    setInput('');
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (text: string, filename: string = 'planificacion_matematica.txt') => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans">
      <header className="border-b border-gray-800 bg-gray-950/50 backdrop-blur-md sticky top-0 z-50 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={resetApp}>
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Zap size={18} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Architect AI & Matemática
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {appState !== 'INITIAL' && (
            <button onClick={resetApp} className="text-xs font-medium text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
              <RefreshCw size={14} /> Reiniciar
            </button>
          )}
          <div className="h-4 w-px bg-gray-800" />
          <button onClick={() => setHistory([])} className="p-2 text-gray-400 hover:text-white transition-colors">
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden">
        {/* Izquierda: Consultoría */}
        <div className="lg:col-span-8 flex flex-col h-[calc(100vh-10rem)] bg-gray-900/30 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
          
          {appState === 'INITIAL' ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center overflow-y-auto">
              <div className="w-16 h-16 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 text-indigo-500">
                <Calculator size={32} />
              </div>
              <h2 className="text-3xl font-extrabold mb-2 tracking-tight">Arquitectura Didáctica 2023</h2>
              <p className="text-gray-400 mb-8 max-w-md text-sm">
                Diseño de prompts alineados con las <b>Orientaciones Didácticas 2023</b> y los tiempos pedagógicos del Mineduc Chile.
              </p>
              
              <div className="w-full max-w-2xl space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 flex items-center gap-2 ml-1">
                      <Layers size={10} className="text-indigo-500" /> Nivel Estudiantes (Chile)
                    </label>
                    <select value={level} onChange={(e) => setLevel(e.target.value as EducationLevel)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300 focus:border-indigo-500 outline-none transition-all">
                      {Object.entries(EducationLevel).map(([key, value]) => <option key={key} value={value}>{value}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 flex items-center gap-2 ml-1">
                      <Activity size={10} className="text-indigo-500" /> Estrategia de Evaluación
                    </label>
                    <select value={evaluation} onChange={(e) => setEvaluation(e.target.value as EvaluationType)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300 focus:border-indigo-500 outline-none transition-all">
                      {Object.values(EvaluationType).map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                  <div className="relative">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ej: Secuencia de 3 clases para fracciones en 4to básico..."
                      className="w-full h-32 bg-gray-950 border border-gray-800 rounded-2xl p-5 text-gray-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none shadow-2xl"
                    />
                    <button
                      onClick={() => startNewSession()}
                      disabled={!input.trim() || loading}
                      className="absolute bottom-4 right-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 text-white rounded-xl shadow-xl transition-all flex items-center gap-2 font-bold text-sm"
                    >
                      {loading ? <Loader2 className="animate-spin" size={18} /> : <><Sparkles size={18} /> Planificar Unidad</>}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] uppercase font-bold text-gray-600 tracking-tighter">Sugerencias basadas en tiempos Mineduc:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {SUGGESTIONS.map((s, i) => (
                      <button key={i} onClick={() => { setInput(s); startNewSession(s); }} className="px-3 py-2 bg-gray-900/50 border border-gray-800 hover:border-indigo-500/50 rounded-xl text-[11px] text-gray-400 hover:text-indigo-300 transition-all text-left max-w-[250px] flex items-start gap-2">
                        <Calculator size={12} className="mt-0.5 flex-shrink-0" /> {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg, index) => (
                  <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`max-w-[85%] flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${msg.type === 'user' ? 'bg-indigo-600 border-indigo-500' : 'bg-gray-800 border-gray-700'}`}>
                        {msg.type === 'user' ? <User size={14} /> : <Bot size={14} className="text-indigo-400" />}
                      </div>
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed relative group ${msg.type === 'user' ? 'bg-indigo-600/10 border border-indigo-500/30 text-indigo-100 shadow-lg' : 'bg-gray-800/50 border border-gray-700 text-gray-200 shadow-md'}`}>
                        <div className="whitespace-pre-wrap">{msg.text}</div>

                        {msg.result && (
                          <div className="mt-6 space-y-4 pt-6 border-t border-gray-700">
                            <div className="flex flex-col rounded-xl border border-indigo-500/30 overflow-hidden shadow-2xl bg-gray-950">
                              <div className="bg-gray-900/50 px-4 py-2 border-b border-gray-800 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                  <ShieldCheck size={12} className="text-indigo-500" /> PLANIFICACIÓN TEMPORAL
                                </span>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => handleDownload(msg.result!.improvedPrompt)} className="flex items-center gap-1.5 px-3 py-1 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg text-xs font-bold border border-gray-800 transition-all">
                                    <Download size={14} /> Exportar .txt
                                  </button>
                                  <button onClick={() => handleCopy(msg.result!.improvedPrompt, msg.id)} className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold transition-all duration-300 min-w-[100px] justify-center ${copiedId === msg.id ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/20'}`}>
                                    {copiedId === msg.id ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar</>}
                                  </button>
                                </div>
                              </div>
                              <div className="p-5 font-mono text-xs text-indigo-300 overflow-x-auto whitespace-pre-wrap bg-gray-950/50">
                                {msg.result.improvedPrompt}
                              </div>
                              
                              <div className="bg-gray-900/80 px-4 py-3 border-t border-gray-800 flex flex-wrap gap-2 items-center">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest w-full mb-1 flex items-center gap-1">
                                  <ExternalLink size={10} className="text-indigo-500" /> Implementar en IA:
                                </span>
                                <a href="https://chatgpt.com" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-gray-950 border border-gray-800 rounded-lg text-[10px] text-gray-400 hover:text-white hover:border-indigo-500 transition-all flex items-center gap-1.5">
                                  ChatGPT
                                </a>
                                <a href="https://claude.ai" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-gray-950 border border-gray-800 rounded-lg text-[10px] text-gray-400 hover:text-white hover:border-indigo-500 transition-all flex items-center gap-1.5">
                                  Claude
                                </a>
                                <a href="https://gemini.google.com" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-gray-950 border border-gray-800 rounded-lg text-[10px] text-gray-400 hover:text-white hover:border-indigo-500 transition-all flex items-center gap-1.5">
                                  Gemini
                                </a>
                                <a href="https://perplexity.ai" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-gray-950 border border-gray-800 rounded-lg text-[10px] text-gray-400 hover:text-white hover:border-indigo-500 transition-all flex items-center gap-1.5">
                                  Perplexity
                                </a>
                              </div>
                            </div>
                            
                            <div className="bg-gray-900/40 rounded-xl border border-gray-800 overflow-hidden px-4">
                              <CollapsibleSection title="Estrategia Mineduc">
                                <ul className="space-y-2">
                                  {msg.result.tips.slice(0, 5).map((t, i) => (
                                    <li key={i} className="text-gray-400 flex gap-2 text-[11px] leading-relaxed">
                                      <span className="text-indigo-500 mt-0.5">•</span> {t}
                                    </li>
                                  ))}
                                </ul>
                              </CollapsibleSection>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {appState === 'REFINING' && (
                <div className="p-4 bg-gray-950/80 border-t border-gray-800 flex gap-2 backdrop-blur-md">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendAnswer()}
                    placeholder="Responde para ajustar la carga horaria..."
                    className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-5 py-3 text-sm focus:border-indigo-500 outline-none transition-colors"
                  />
                  <button onClick={sendAnswer} disabled={loading || !input.trim()} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 px-6 py-2 rounded-xl text-white transition-all flex items-center gap-2 shadow-lg">
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                  </button>
                </div>
              )}

              {appState === 'COMPLETED' && (
                <div className="p-4 bg-indigo-600/5 border-t border-indigo-500/10 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-xs text-indigo-400 font-medium tracking-wide">✨ Estructura finalizada conforme al Mineduc.</p>
                  </div>
                  
                  <div className="bg-gray-900/60 border border-indigo-500/20 rounded-2xl p-4 flex gap-4">
                    <div className="bg-indigo-600/10 p-2.5 rounded-xl self-start">
                      <HelpCircle size={18} className="text-indigo-400" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-gray-200 flex items-center gap-2">Ayuda Contextual: Estructura Temporal</h4>
                      <p className="text-[10px] text-gray-400 leading-relaxed">
                        Este prompt ha sido diseñado respetando los estándares del Ministerio de Educación de Chile:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-tighter flex items-center gap-1">
                            <Clock size={10}/> Carga Horaria Semanal
                          </p>
                          <p className="text-[9px] text-gray-500 leading-tight">
                            Ajustada al nivel ({level}): {level.startsWith('B') ? '6-8' : '4-6'} horas pedagógicas. Evita la sobrecarga y asegura cobertura curricular.
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-tighter flex items-center gap-1">
                            <Zap size={10}/> Bloques de 90 Minutos
                          </p>
                          <p className="text-[9px] text-gray-500 leading-tight">
                            Cada clase propuesta incluye momentos de Inicio, Desarrollo y Cierre, optimizando la gestión del tiempo en aula.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Derecha */}
        <div className="lg:col-span-4 h-full flex flex-col gap-4 overflow-y-auto">
          <div className="p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl shrink-0">
            <h3 className="text-xs font-bold text-indigo-300 mb-2 flex items-center gap-2">
              <ShieldCheck size={14} /> Estándar Mineduc
            </h3>
            <p className="text-[10px] text-gray-400 leading-relaxed mb-3">
              Alineación con la carga horaria y los OA prioritarios 2023-2025.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-gray-950/50 rounded-xl border border-gray-800">
                <span className="text-[8px] uppercase text-gray-500 block mb-1">Carga Semanal</span>
                <span className="text-[10px] font-bold text-indigo-400 flex items-center gap-1"><Clock size={10}/> {level.startsWith('B') ? '6-8' : '4-6'} hrs</span>
              </div>
              <div className="p-2 bg-gray-950/50 rounded-xl border border-gray-800">
                <span className="text-[8px] uppercase text-gray-500 block mb-1">Bloques</span>
                <span className="text-[10px] font-bold text-indigo-400 flex items-center gap-1"><Zap size={10}/> 90 min</span>
              </div>
            </div>
          </div>

          <div className="p-5 bg-indigo-900/10 border border-indigo-500/10 rounded-3xl shrink-0">
            <h3 className="text-xs font-bold text-indigo-300 mb-2 flex items-center gap-2">
              <Clock size={14} /> Gestión del Tiempo
            </h3>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              Al planificar unidades, el arquitecto distribuirá los contenidos respetando los tiempos de <b>inicio, desarrollo y cierre</b> de cada sesión pedagógica.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
