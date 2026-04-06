import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Send, ArrowLeft, Users, User, Search, Plus, X, Loader2, Sparkles } from 'lucide-react';

const API_BASE = (import.meta.env.PUBLIC_API_URL as string) || "http://localhost:8000/v1/api";

interface Conversation {
  id: string;
  type: 'direct' | 'squad';
  display_name: string;
  squad_name?: string;
  last_message?: string;
  last_sender?: string;
  last_message_at?: string;
  unread_count: number;
}

interface Message {
  id: string;
  content: string;
  type: string;
  created_at: string;
  sender_id: string;
  sender_name: string;
  is_deleted: boolean;
}

interface Player {
  id: string;
  full_name: string;
  email: string;
}

interface ChatWidgetProps {
  lang?: string;
  initialConversationId?: string;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ lang = 'es', initialConversationId }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(initialConversationId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New conversation state
  const [isSearchingPlayers, setIsSearchingPlayers] = useState(false);
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [foundPlayers, setFoundPlayers] = useState<Player[]>([]);
  const [searchingPlayersLoading, setSearchingPlayersLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getToken = () => localStorage.getItem('em_token');

  const fetchConversations = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`/chat/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch {
      // silently fail on poll
    }
  }, []);

  const fetchMessages = useCallback(async (convId: string) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/chat/messages?conversation_id=${convId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {
      // silently fail
    }
  }, []);

  // Search players for new chat
  useEffect(() => {
    if (playerSearchQuery.length < 3) {
      setFoundPlayers([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingPlayersLoading(true);
      const token = getToken();
      try {
        const res = await fetch(`${API_BASE}/players/search?q=${encodeURIComponent(playerSearchQuery)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setFoundPlayers(data.players || []);
        }
      } catch {
        setFoundPlayers([]);
      } finally {
        setSearchingPlayersLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [playerSearchQuery]);

  const startDirectChat = async (targetUserId: string) => {
    const token = getToken();
    try {
      const res = await fetch(`/chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: 'direct', target_user_id: targetUserId }),
      });
      if (res.ok) {
        const data = await res.json();
        await fetchConversations();
        setActiveConversation(data.conversation_id);
        setIsSearchingPlayers(false);
        setPlayerSearchQuery('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Get current user ID from token
  useEffect(() => {
    const token = getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.sub || payload.userId || '');
      } catch {
        // invalid token
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchConversations().then(() => setLoading(false));
  }, [fetchConversations]);

  // Poll for new messages
  useEffect(() => {
    pollRef.current = setInterval(() => {
      fetchConversations();
      if (activeConversation) {
        fetchMessages(activeConversation);
      }
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeConversation, fetchConversations, fetchMessages]);

  // Load messages when conversation changes
  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation);
    }
  }, [activeConversation, fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || sending) return;

    setSending(true);
    const token = getToken();

    try {
      const res = await fetch(`/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversation_id: activeConversation,
          content: newMessage.trim(),
        }),
      });

      if (res.ok) {
        setNewMessage('');
        await fetchMessages(activeConversation);
        await fetchConversations();
      }
    } catch {
      // error sending
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return lang === 'en' ? 'now' : 'ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return date.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short' });
  };

  const filteredConversations = conversations.filter(c =>
    c.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeConvData = conversations.find(c => c.id === activeConversation);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin w-10 h-10 text-tropical-primary" />
          <p className="text-tropical-text/40 font-black uppercase tracking-widest text-xs">Cargando chats...</p>
        </div>
      </div>
    );
  }

  // No token
  if (!getToken()) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-center bg-tropical-card/30 rounded-3xl border-2 border-dashed border-tropical-secondary/20 p-8">
        <div className="w-20 h-20 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mb-6">
          <MessageCircle className="w-10 h-10 text-tropical-primary" />
        </div>
        <h3 className="text-xl font-bold text-tropical-primary mb-2">
          {lang === 'en' ? 'Coordination is key' : 'La coordinación es clave'}
        </h3>
        <p className="text-tropical-text/60 max-w-xs mb-8">
          {lang === 'en' 
            ? 'Sign in to chat with your squad and coordinate your next escape.' 
            : 'Inicia sesión para hablar con tu equipo y coordinar vuestra próxima misión.'}
        </p>
        <a
          href={`/${lang}/login`}
          className="px-8 py-4 bg-tropical-primary text-white font-black rounded-2xl shadow-lg shadow-tropical-primary/30 hover:scale-105 transition-transform"
        >
          {lang === 'en' ? 'Sign in now' : 'Entrar ahora'}
        </a>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-250px)] min-h-[600px] bg-white rounded-[2.5rem] shadow-2xl shadow-black/5 border border-gray-100 overflow-hidden">
      {/* Sidebar: Conversations List */}
      <div className={`w-full sm:w-96 border-r border-gray-50 flex flex-col ${activeConversation ? 'hidden sm:flex' : 'flex'}`}>
        <div className="p-8 border-b border-gray-50 bg-white/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center justify-between mb-6">
             <h2 className="font-bold text-lg text-tropical-primary flex items-center gap-3">
              {lang === 'en' ? 'Inbox' : 'Mensajes'}
              <span className="w-2 h-2 rounded-full bg-tropical-primary animate-pulse"></span>
            </h2>
            <button 
              onClick={() => setIsSearchingPlayers(true)}
              className="w-10 h-10 rounded-xl bg-tropical-primary text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-tropical-primary/30"
            >
              <Plus size={20} strokeWidth={3} />
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              type="text"
              placeholder={lang === 'en' ? 'Filter conversations...' : 'Filtrar conversaciones...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-gray-50 rounded-2xl text-sm font-bold text-tropical-text placeholder:text-gray-300 focus:bg-white focus:ring-4 focus:ring-tropical-primary/10 outline-none border border-transparent focus:border-tropical-primary/20 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
          {isSearchingPlayers ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-4 pt-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-tropical-primary">Nuevo Chat</span>
                <button onClick={() => setIsSearchingPlayers(false)} className="text-gray-400 hover:text-tropical-text"><X size={16}/></button>
              </div>
              <div className="px-4">
                 <input
                  autoFocus
                  type="text"
                  placeholder={lang === 'en' ? 'Search players...' : 'Buscar jugadores...'}
                  value={playerSearchQuery}
                  onChange={(e) => setPlayerSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 bg-tropical-primary/5 rounded-xl text-sm font-bold text-tropical-text focus:ring-2 focus:ring-tropical-primary outline-none"
                />
              </div>
              <div className="space-y-1">
                {searchingPlayersLoading ? (
                   <div className="text-center py-8"><Loader2 className="animate-spin w-5 h-5 mx-auto text-tropical-primary" /></div>
                ) : foundPlayers.length > 0 ? (
                  foundPlayers.map(p => (
                    <button
                      key={p.id}
                      onClick={() => startDirectChat(p.id)}
                      className="w-full px-4 py-4 rounded-2xl flex items-center gap-4 hover:bg-tropical-card transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-tropical-primary group-hover:bg-tropical-primary group-hover:text-white transition-all">
                        <User size={18} />
                      </div>
                      <div className="text-left">
                        <p className="font-black text-sm text-tropical-text group-hover:text-tropical-primary">{p.full_name}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{p.email}</p>
                      </div>
                    </button>
                  ))
                ) : playerSearchQuery.length >= 3 && (
                  <div className="text-center py-8 text-gray-400 text-xs font-bold uppercase tracking-widest px-4">
                    {lang === 'en' ? 'No players found' : 'No se encontraron jugadores'}
                  </div>
                )}
              </div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-20 px-8">
              <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-100">
                <Sparkles className="w-8 h-8 text-gray-200" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-300">
                {lang === 'en' ? 'Your inbox is clear' : 'Tu bandeja está vacía'}
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConversation(conv.id)}
                className={`w-full text-left px-5 py-4 rounded-2xl flex items-center gap-4 transition-all group ${
                  activeConversation === conv.id 
                    ? 'bg-tropical-primary shadow-xl shadow-tropical-primary/20 -translate-y-0.5' 
                    : 'hover:bg-tropical-card'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${
                  activeConversation === conv.id 
                    ? 'bg-white shadow-lg text-tropical-primary' 
                    : conv.type === 'squad' 
                      ? 'bg-tropical-primary/10 text-tropical-primary' 
                      : 'bg-gray-100 text-gray-400 group-hover:bg-white'
                }`}>
                  {conv.type === 'squad' ? <Users size={22} strokeWidth={2.5} /> : <User size={22} strokeWidth={2.5} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`font-black text-sm truncate ${activeConversation === conv.id ? 'text-white' : 'text-tropical-text'}`}>
                      {conv.display_name}
                    </span>
                    {conv.last_message_at && (
                      <span className={`text-[10px] font-black tracking-tighter flex-shrink-0 ml-2 ${activeConversation === conv.id ? 'text-white/60' : 'text-gray-300'}`}>
                        {formatTime(conv.last_message_at).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {conv.last_message && (
                    <p className={`text-xs truncate ${activeConversation === conv.id ? 'text-white/80' : 'text-gray-400 font-medium'}`}>
                      {conv.last_sender && conv.type === 'squad' ? `${conv.last_sender.split(' ')[0]}: ` : ''}
                      {conv.last_message}
                    </p>
                  )}
                </div>
                {conv.unread_count > 0 && activeConversation !== conv.id && (
                  <span className="w-5 h-5 bg-tropical-accent text-white text-[10px] font-black rounded-lg flex items-center justify-center flex-shrink-0 animate-bounce">
                    {conv.unread_count > 9 ? '9+' : conv.unread_count}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Panel: Messages */}
      <div className={`flex-1 flex flex-col bg-gray-50/30 ${!activeConversation ? 'hidden sm:flex' : 'flex'}`}>
        {activeConversation ? (
          <>
            {/* Thread Header */}
            <div className="px-8 py-6 border-b border-gray-50 bg-white flex items-center gap-5">
              <button
                onClick={() => setActiveConversation(null)}
                className="sm:hidden p-2 hover:bg-gray-100 rounded-xl text-tropical-text"
              >
                <ArrowLeft size={20} strokeWidth={3} />
              </button>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                activeConvData?.type === 'squad' ? 'bg-tropical-primary/10 text-tropical-primary' : 'bg-gray-100 text-gray-400'
              }`}>
                {activeConvData?.type === 'squad' ? <Users size={24} strokeWidth={2.5} /> : <User size={24} strokeWidth={2.5} />}
              </div>
              <div className="flex-1">
                <h3 className="font-black text-lg text-tropical-text leading-tight">{activeConvData?.display_name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                    {activeConvData?.type === 'squad' ? (lang === 'en' ? 'Team' : 'Equipo') : (lang === 'en' ? 'Direct' : 'Directo')}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-10 space-y-6 no-scrollbar custom-pattern">
              {messages.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full opacity-20 pointer-events-none">
                    <MessageCircle className="w-24 h-24 mb-4" />
                    <p className="font-black uppercase tracking-[0.3em]">Empezar chat</p>
                 </div>
              ) : messages.map((msg, idx) => {
                const isOwn = msg.sender_id === currentUserId;
                const prevMsg = messages[idx - 1];
                const nextMsg = messages[idx + 1];
                const isContinued = nextMsg?.sender_id === msg.sender_id;

                // Date separator: show when day changes from previous message
                const msgDate = new Date(msg.created_at);
                const prevDate = prevMsg ? new Date(prevMsg.created_at) : null;
                const showDateSep = !prevDate || msgDate.toDateString() !== prevDate.toDateString();
                const today = new Date();
                const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
                const dateLabel = msgDate.toDateString() === today.toDateString()
                  ? (lang === 'en' ? 'Today' : 'Hoy')
                  : msgDate.toDateString() === yesterday.toDateString()
                    ? (lang === 'en' ? 'Yesterday' : 'Ayer')
                    : msgDate.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short' });

                return (
                  <React.Fragment key={msg.id}>
                    {showDateSep && (
                      <div className="flex items-center justify-center my-4">
                        <span className="px-4 py-1 bg-white border border-gray-100 rounded-full text-[10px] font-bold text-tropical-text/40 uppercase tracking-widest shadow-sm">{dateLabel}</span>
                      </div>
                    )}
                    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} ${isContinued ? 'mb-1' : 'mb-4'}`}>
                      {!isOwn && !isContinued && (
                        <p className="text-[10px] font-bold text-tropical-primary uppercase tracking-widest mb-1.5 ml-2">{msg.sender_name}</p>
                      )}
                      <div className={`px-5 py-3.5 rounded-[2rem] text-[14px] leading-relaxed max-w-[85%] sm:max-w-[70%] shadow-lg shadow-black/5 ${
                        isOwn
                          ? 'bg-tropical-primary text-white rounded-tr-sm'
                          : 'bg-white text-tropical-text border border-gray-100 rounded-tl-sm'
                      }`}>
                        {msg.is_deleted ? (
                          <em className="opacity-40">{lang === 'en' ? 'This message was deleted' : 'Mensaje eliminado'}</em>
                        ) : (
                          msg.content
                        )}
                      </div>
                      <span className={`text-[9px] font-medium mt-1 ${isOwn ? 'text-tropical-text/30 mr-2' : 'text-tropical-text/30 ml-2'}`}>
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Modern Input Bar */}
            <div className="p-8 bg-white border-t border-gray-50">
              <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-3xl border border-gray-100 focus-within:ring-4 focus-within:ring-tropical-primary/10 transition-all">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={lang === 'en' ? 'Write something...' : 'Escribe algo...'}
                  className="flex-1 px-6 py-4 bg-transparent text-sm font-bold text-tropical-text placeholder:text-gray-300 outline-none"
                  disabled={sending}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="w-14 h-14 bg-tropical-primary text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all shadow-xl shadow-tropical-primary/30"
                >
                  {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} strokeWidth={3} />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="relative mb-8">
               <div className="absolute inset-0 bg-tropical-primary/10 blur-3xl rounded-full"></div>
               <div className="relative w-32 h-32 bg-white rounded-[3rem] shadow-2xl flex items-center justify-center">
                <MessageCircle className="w-16 h-16 text-tropical-primary/20" strokeWidth={1} />
                <Sparkles className="absolute -top-2 -right-2 text-tropical-accent animate-pulse" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-tropical-primary mb-3">
              {lang === 'en' ? 'Select a chat' : 'Selecciona un chat'}
            </h3>
            <p className="text-tropical-text/40 max-w-sm text-sm leading-relaxed">
              {lang === 'en'
                ? 'Coordinate routes, find teammates, and build your escape room reputation.'
                : 'Coordina tus rutas, encuentra compañeros y forja tu reputación como escapista.'}
            </p>
            
            <button 
              onClick={() => setIsSearchingPlayers(true)}
              className="mt-10 px-8 py-4 bg-white border-2 border-tropical-primary text-tropical-primary font-black rounded-2xl hover:bg-tropical-primary hover:text-white transition-all shadow-xl shadow-tropical-primary/5"
            >
               {lang === 'en' ? 'Find players' : 'Buscar jugadores'}
            </button>
          </div>
        )}
      </div>

      <style>{`
        .custom-pattern {
          background-color: #fafbfc;
          background-image: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%230097b2' fill-opacity='0.02' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E");
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default ChatWidget;
