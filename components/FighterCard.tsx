
import React from 'react';
import { UserProfile } from '../types';
import { ShieldCheck, Zap, Trophy, Flame } from 'lucide-react';

interface FighterCardProps {
  fighter: UserProfile;
}

export const FighterCard: React.FC<FighterCardProps> = ({ fighter }) => {
  return (
    <div className="relative w-full h-[500px] md:h-[600px] rounded-2xl overflow-hidden border-4 border-red-900/50 shadow-[0_0_50px_rgba(255,0,0,0.2)] bg-black transition-transform duration-500 hover:scale-[1.01]">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={fighter.imageUrl} 
          alt={fighter.name} 
          className="w-full h-full object-cover opacity-90 filter brightness-90 grayscale-[0.3] hover:grayscale-0 transition-all duration-700"
        />
      </div>
      
      {/* Overlay Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none z-10" />
      
      {/* Red Scanline Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none z-20" 
           style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #ff0000 3px)' }} />

      {/* Content */}
      <div className="absolute bottom-0 left-0 w-full p-6 space-y-3 z-30">
        <div className="flex items-center gap-2">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-white uppercase italic leading-none drop-shadow-2xl">
            {fighter.name}
          </h2>
          {fighter.verified && <ShieldCheck className="text-red-600 w-8 h-8 fill-red-600/10" />}
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-red-600 text-black text-xs font-black uppercase tracking-widest skew-x-[-10deg]">
            {fighter.style}
          </span>
          <span className="px-3 py-1 bg-zinc-800 border border-white/20 text-white text-xs font-bold uppercase tracking-widest skew-x-[-10deg]">
            {fighter.weightClass}
          </span>
          <span className="px-3 py-1 bg-orange-600/20 border border-orange-600 text-orange-500 text-xs font-bold uppercase tracking-widest skew-x-[-10deg]">
            Exp: {fighter.experienceYears}Y
          </span>
        </div>

        <p className="text-gray-300 text-sm line-clamp-2 italic font-medium bg-black/40 p-2 border-l-2 border-red-600">
          "{fighter.bio}"
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20 mt-2">
          <div className="flex flex-col items-center bg-zinc-900/80 py-2 rounded border border-white/5">
            <Trophy className="text-yellow-500 w-4 h-4 mb-1" />
            <span className="text-xl font-black text-white">{fighter.stats.wins}W</span>
            <span className="text-[10px] text-gray-500 uppercase tracking-tighter font-bold">Victories</span>
          </div>
          <div className="flex flex-col items-center bg-red-900/20 py-2 rounded border border-red-900/30">
            <Flame className="text-red-500 w-4 h-4 mb-1" />
            <span className="text-xl font-black text-red-500">{fighter.stats.brutalityScore}%</span>
            <span className="text-[10px] text-red-500/70 uppercase tracking-tighter font-bold">Intensity</span>
          </div>
          <div className="flex flex-col items-center bg-zinc-900/80 py-2 rounded border border-white/5">
            <Zap className="text-cyan-400 w-4 h-4 mb-1" />
            <span className="text-xl font-black text-white">#{fighter.stats.losses}</span>
            <span className="text-[10px] text-gray-500 uppercase tracking-tighter font-bold">Losses</span>
          </div>
        </div>
      </div>
    </div>
  );
};
