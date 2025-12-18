
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Match, ChatMessage } from './types';
import { MOCK_USER, OPPONENTS } from './constants';
import { GlitchText } from './components/GlitchText';
import { FighterCard } from './components/FighterCard';
import { analyzeMatchmaking, startRefChat, generateFightPoster, getRefVoice, getVenuesNearby } from './geminiService';
import { Skull, Swords, MessageSquare, ShieldAlert, Award, User, LogOut, ChevronLeft, ChevronRight, X, Check, Loader2, Camera, MapPin, Volume2 } from 'lucide-react';

type AppView = 'landing' | 'onboarding' | 'swiping' | 'matches' | 'ref' | 'profile';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('landing');
  const [currentUser, setCurrentUser] = useState<UserProfile>(MOCK_USER);
  const [swipeIndex, setSwipeIndex] = useState(0);
  const [matches, setMatches] = useState<Match[]>([]);
  const [refChatMessages, setRefChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [matchAnalysis, setMatchAnalysis] = useState<{intensityScore: number, analysis: string} | null>(null);
  const [aiPosterUrl, setAiPosterUrl] = useState<string | null>(null);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [groundingLinks, setGroundingLinks] = useState<{title: string, uri: string}[]>([]);

  // Sound Effects Refs
  const audioContext = useRef<AudioContext | null>(null);

  const playSound = (type: 'swipe' | 'match' | 'glitch') => {
    if (!audioContext.current) audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioContext.current.createOscillator();
    const gain = audioContext.current.createGain();
    osc.connect(gain);
    gain.connect(audioContext.current.destination);

    if (type === 'swipe') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, audioContext.current.currentTime);
      osc.frequency.exponentialRampToValueAtTime(10, audioContext.current.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, audioContext.current.currentTime);
      gain.gain.linearRampToValueAtTime(0, audioContext.current.currentTime + 0.2);
    } else if (type === 'match') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(80, audioContext.current.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1, audioContext.current.currentTime + 0.5);
      gain.gain.setValueAtTime(0.2, audioContext.current.currentTime);
      gain.gain.linearRampToValueAtTime(0, audioContext.current.currentTime + 0.5);
    }
    osc.start();
    osc.stop(audioContext.current.currentTime + 0.5);
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    playSound('swipe');
    const opponent = OPPONENTS[swipeIndex];
    if (direction === 'right') {
      setIsLoading(true);
      setAiPosterUrl(null);
      
      try {
        const [analysis, poster] = await Promise.all([
          analyzeMatchmaking(currentUser, opponent),
          generateFightPoster(currentUser, opponent)
        ]);
        
        setMatchAnalysis(analysis);
        setAiPosterUrl(poster);
        
        const newMatch: Match = {
          id: Math.random().toString(36).substr(2, 9),
          fighterA: currentUser,
          fighterB: opponent,
          status: 'pending'
        };
        setMatches(prev => [...prev, newMatch]);
        setIsMatchModalOpen(true);
        playSound('match');
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    setSwipeIndex(prev => (prev + 1) % OPPONENTS.length);
  };

  const playRefVoice = async (text: string) => {
    try {
      const audioData = await getRefVoice(text);
      if (audioData) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        const buffer = await ctx.decodeAudioData(audioData);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start();
      }
    } catch (e) {
      console.error("TTS failed", e);
    }
  };

  const sendMessageToRef = async () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = { role: 'user', parts: [{ text: chatInput }] };
    setRefChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsLoading(true);
    setGroundingLinks([]);

    try {
      if (chatInput.toLowerCase().includes('location') || chatInput.toLowerCase().includes('gym') || chatInput.toLowerCase().includes('near')) {
        const response = await getVenuesNearby(chatInput);
        const modelMsg: ChatMessage = { role: 'model', parts: [{ text: response.text || '' }] };
        setRefChatMessages(prev => [...prev, modelMsg]);
        if (response.links) setGroundingLinks(response.links);
      } else {
        const chat = startRefChat(currentUser.name);
        // sendMessage expects only a 'message' string parameter.
        const response = await chat.sendMessage({ message: chatInput });
        const modelMsg: ChatMessage = { role: 'model', parts: [{ text: response.text || '' }] };
        setRefChatMessages(prev => [...prev, modelMsg]);
        // Randomly play voice for the Ref
        if (Math.random() > 0.5) playRefVoice(response.text || '');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Render the list of matched opponents as a fight card gallery.
  const renderMatches = () => (
    <div className="max-w-lg mx-auto p-4 pt-12">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setView('swiping')} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <GlitchText text="FIGHT CARD" className="text-3xl font-bold italic" />
      </div>
      
      <div className="space-y-4 pb-20">
        {matches.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
            <Swords className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 uppercase font-black tracking-widest italic">No active bouts. Get back in the pit.</p>
          </div>
        ) : (
          matches.map((match) => (
            <div 
              key={match.id} 
              className="bg-zinc-900 border border-red-900/30 p-4 rounded-xl flex items-center gap-4 hover:border-red-600 transition-all cursor-pointer group"
              onClick={() => setView('ref')}
            >
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 shrink-0">
                <img src={match.fighterB.imageUrl} alt={match.fighterB.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-red-500 text-[10px] font-black uppercase tracking-tighter">Match Scheduled</p>
                <p className="text-lg font-bold italic uppercase text-white truncate">{match.fighterB.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] bg-red-900/40 text-red-500 px-1.5 py-0.5 rounded uppercase font-bold">{match.status}</span>
                  <span className="text-[10px] text-gray-500 uppercase font-bold">{match.fighterB.style}</span>
                </div>
              </div>
              <ChevronRight className="text-zinc-700 group-hover:text-red-500 transition-colors w-5 h-5" />
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderLanding = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-12">
      <div className="relative">
        <Skull className="w-24 h-24 text-red-600 mx-auto mb-4 animate-pulse" />
        <GlitchText text="BRUTAL MATCH" className="text-7xl md:text-9xl font-bold tracking-tighter" />
      </div>
      <p className="max-w-md text-xl text-gray-400 font-medium tracking-wide uppercase italic">
        "The elite digital arena for combatants. No mercy. Just glory."
      </p>
      <button 
        onClick={() => setView('onboarding')}
        className="px-12 py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-2xl rounded-none transform skew-x-[-12deg] transition-all hover:scale-110 active:scale-95 border-r-4 border-b-4 border-black shadow-[4px_4px_0px_0px_rgba(255,0,0,0.3)]"
      >
        INITIATE PROTOCOL
      </button>
    </div>
  );

  const renderOnboarding = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 max-w-lg mx-auto text-center space-y-8">
       {onboardingStep === 0 && (
         <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <ShieldAlert className="w-20 h-20 text-red-600 mx-auto" />
           <GlitchText text="VERIFICATION REQUIRED" className="text-4xl font-bold italic" />
           <p className="text-gray-400">To enter the pit, we must verify your fighting capability. Upload or record a 10s shadowboxing clip.</p>
           <div className="border-2 border-dashed border-red-900 h-64 w-full flex flex-col items-center justify-center gap-4 bg-zinc-900/50 hover:bg-red-900/10 transition-colors cursor-pointer"
                onClick={() => setOnboardingStep(1)}>
             <Camera className="w-12 h-12 text-gray-600" />
             <p className="text-xs text-gray-500 font-bold uppercase">Click to open camera</p>
           </div>
         </div>
       )}
       {onboardingStep === 1 && (
         <div className="space-y-6">
           <Loader2 className="w-20 h-20 text-red-600 mx-auto animate-spin" />
           <GlitchText text="ANALYZING BIOMETRICS" className="text-3xl font-bold italic" />
           <div className="text-left bg-zinc-900 p-4 border border-red-900/50 space-y-2 font-mono text-xs">
             <p className="text-red-500">> SCANNING LIMB EXTENSION...</p>
             <p className="text-green-500">> AGGRESSION SCORE: 88%</p>
             <p className="text-gray-400">> CLASS IDENTIFIED: STRIKER</p>
             <p className="text-red-500">> VERIFYING AUTHENTICITY...</p>
           </div>
           {/* Auto advance simulation */}
           {setTimeout(() => setOnboardingStep(2), 3000) && null}
         </div>
       )}
       {onboardingStep === 2 && (
         <div className="space-y-6 animate-in zoom-in duration-500">
           <Award className="w-24 h-24 text-yellow-500 mx-auto" />
           <GlitchText text="ACCESS GRANTED" className="text-5xl font-bold italic" />
           <p className="text-gray-300">You have been ranked as an <span className="text-red-500 font-bold">ELITE UNDERGROUND COMBATANT</span>.</p>
           <button 
             onClick={() => setView('swiping')}
             className="w-full py-4 bg-red-600 text-white font-bold uppercase tracking-widest hover:bg-red-700 transition-all"
           >
             START MATCHING
           </button>
         </div>
       )}
    </div>
  );

  const renderSwiping = () => (
    <div className="max-w-lg mx-auto p-4 pt-12">
      <div className="flex justify-between items-center mb-6">
        <GlitchText text="TARGETS ACQUIRED" className="text-3xl font-bold italic" />
        <div className="flex gap-4">
          <Award className="text-yellow-500 w-6 h-6 cursor-pointer" onClick={() => setView('matches')} />
          <User className="text-gray-400 w-6 h-6 cursor-pointer" onClick={() => setView('profile')} />
        </div>
      </div>
      
      <div className="relative group">
        <FighterCard fighter={OPPONENTS[swipeIndex]} />
        <div className="absolute -bottom-8 left-0 w-full flex justify-center gap-12 z-40">
          <button 
            disabled={isLoading}
            onClick={() => handleSwipe('left')}
            className="w-16 h-16 rounded-full bg-black border-2 border-gray-800 flex items-center justify-center hover:bg-gray-900 transition-all hover:border-gray-500 disabled:opacity-50"
          >
            <X className="text-gray-500 w-8 h-8" />
          </button>
          <button 
             disabled={isLoading}
             onClick={() => handleSwipe('right')}
            className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700 transition-all hover:scale-110 shadow-lg shadow-red-900/50 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-10 h-10 animate-spin text-white" /> : <Check className="text-white w-10 h-10" />}
          </button>
        </div>
      </div>
    </div>
  );

  const renderRefChat = () => (
    <div className="max-w-2xl mx-auto h-screen flex flex-col p-4">
      <div className="flex items-center gap-4 py-4 border-b border-red-900/50">
        <button onClick={() => setView('swiping')}><ChevronLeft /></button>
        <div className="flex items-center gap-2">
          <ShieldAlert className="text-red-600 w-6 h-6" />
          <GlitchText text="THE REF" className="text-2xl font-bold italic" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 space-y-4 px-2 scroll-smooth">
        {refChatMessages.length === 0 && (
          <div className="bg-red-900/20 border border-red-900/50 p-4 rounded-lg flex justify-between items-start">
            <div className="flex-1">
              <p className="text-red-500 text-sm italic uppercase font-bold">THE REF:</p>
              <p className="text-gray-300">"What do you want, rookie? You here to scout a location or just talk? I know all the pits in this city."</p>
            </div>
            <button onClick={() => playRefVoice("What do you want, rookie? You here to scout a location or just talk? I know all the pits in this city.")} 
                    className="p-2 bg-red-600/20 text-red-500 rounded-full hover:bg-red-600/40 transition-colors ml-2">
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        ) }
        {refChatMessages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-zinc-800' : 'bg-red-900/20 border border-red-900/50'}`}>
               <p className={`text-[10px] uppercase font-bold mb-1 ${msg.role === 'user' ? 'text-gray-500' : 'text-red-500'}`}>
                {msg.role === 'user' ? 'YOU' : 'THE REF'}
              </p>
              <p className="text-sm">{msg.parts[0].text}</p>
              {msg.role === 'model' && (
                <button onClick={() => playRefVoice(msg.parts[0].text)} className="mt-2 text-[10px] text-red-500 flex items-center gap-1 hover:underline">
                  <Volume2 className="w-3 h-3" /> Replay Voice
                </button>
              )}
            </div>
          </div>
        ))}
        {groundingLinks.length > 0 && (
          <div className="space-y-2 pt-2">
            <p className="text-[10px] text-gray-500 uppercase font-bold px-2">Scouted Locations:</p>
            {groundingLinks.map((link, idx) => (
              <a key={idx} href={link.uri} target="_blank" rel="noopener noreferrer" 
                 className="flex items-center gap-3 p-3 bg-zinc-900 border border-white/10 rounded-lg hover:border-red-600 transition-colors mx-2">
                <MapPin className="text-red-600 w-5 h-5" />
                <span className="text-sm font-bold uppercase italic text-white">{link.title}</span>
                <ChevronRight className="ml-auto w-4 h-4 text-gray-600" />
              </a>
            ))}
          </div>
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="animate-pulse bg-red-900/20 p-2 rounded text-red-500 text-xs font-bold uppercase tracking-widest">TRANSMITTING...</div>
          </div>
        )}
      </div>

      <div className="p-4 bg-black border-t border-red-900/50 flex flex-col gap-3">
        <div className="flex gap-2 text-[10px] text-gray-500 uppercase font-bold">
          <button onClick={() => setChatInput('Find gyms nearby')} className="px-2 py-1 bg-zinc-900 border border-white/10 rounded hover:border-red-500">Scout Gyms</button>
          <button onClick={() => setChatInput('Schedule my match')} className="px-2 py-1 bg-zinc-900 border border-white/10 rounded hover:border-red-500">Schedule</button>
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessageToRef()}
            placeholder="TYPE TO THE REF..."
            className="flex-1 bg-zinc-900 border border-red-900/30 p-3 text-sm focus:outline-none focus:border-red-600 uppercase tracking-wider"
          />
          <button 
            onClick={sendMessageToRef}
            className="bg-red-600 p-3 hover:bg-red-700 transition-colors"
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-black min-h-screen relative overflow-hidden">
      <div className="scanline"></div>
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-[0.03] z-0" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #ff0000 1px, transparent 0)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10">
        {view === 'landing' && renderLanding()}
        {view === 'onboarding' && renderOnboarding()}
        {view === 'swiping' && renderSwiping()}
        {view === 'matches' && renderMatches()}
        {view === 'ref' && renderRefChat()}
        {view === 'profile' && (
           <div className="max-w-lg mx-auto p-6 pt-12">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setView('swiping')}><ChevronLeft /></button>
              <GlitchText text="MY DOSSIER" className="text-3xl font-bold italic" />
            </div>
            <FighterCard fighter={currentUser} />
            <button 
              onClick={() => setView('landing')}
              className="w-full mt-8 p-4 bg-zinc-900 border border-red-900/30 text-red-500 font-bold uppercase flex items-center justify-center gap-2 hover:bg-red-900/10 transition-all"
            >
              <LogOut className="w-5 h-5" /> DISCONNECT
            </button>
          </div>
        )}
      </div>

      {isMatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 overflow-y-auto">
          <div className="max-w-2xl w-full bg-zinc-950 border-2 border-red-600 p-6 md:p-8 text-center space-y-6 animate-in fade-in zoom-in duration-300 relative overflow-hidden">
             {aiPosterUrl && (
               <div className="absolute inset-0 opacity-40 z-0">
                 <img src={aiPosterUrl} className="w-full h-full object-cover grayscale brightness-50" alt="AI Match Poster" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
               </div>
             )}

            <div className="relative z-10">
              <Swords className="w-16 h-16 text-red-600 mx-auto animate-bounce mb-2" />
              <GlitchText text="MATCH FOUND" className="text-5xl font-bold italic" />
              
              <div className="flex justify-between items-center py-6">
                <div className="text-left flex-1">
                  <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Champion</p>
                  <p className="text-2xl font-bold italic uppercase tracking-tighter">{currentUser.name.split('"')[1] || currentUser.name}</p>
                </div>
                <div className="px-4">
                  <p className="text-red-600 font-black italic text-5xl">VS</p>
                </div>
                <div className="text-right flex-1">
                  <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Challenger</p>
                  <p className="text-2xl font-bold italic uppercase tracking-tighter">
                    {OPPONENTS[(swipeIndex-1+OPPONENTS.length)%OPPONENTS.length].name.split('"')[1] || 'OPPONENT'}
                  </p>
                </div>
              </div>

              {matchAnalysis && (
                <div className="bg-black/80 p-4 border border-red-900/60 rounded mb-6">
                  <p className="text-xs text-red-500 font-bold uppercase mb-1 flex items-center justify-center gap-2">
                    <Loader2 className="w-3 h-3 animate-pulse" /> 
                    AI INTENSITY FORECAST: {matchAnalysis.intensityScore}%
                  </p>
                  <p className="text-sm text-gray-300 italic">"{matchAnalysis.analysis}"</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => {
                    setIsMatchModalOpen(false);
                    setView('ref');
                  }}
                  className="flex-1 py-4 bg-red-600 text-white font-bold uppercase hover:bg-red-700 transition-all transform hover:scale-105"
                >
                  SCHEDULE BOUT
                </button>
                <button 
                  onClick={() => setIsMatchModalOpen(false)}
                  className="flex-1 py-4 bg-white/5 text-gray-400 font-bold uppercase border border-white/10 hover:bg-white/10 transition-all"
                >
                  KEEP HUNTING
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
