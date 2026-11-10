import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Download, Copy, Check, Shield, Smartphone, Hash, Zap } from 'lucide-react';

interface TournamentPlayerCardProps {
  playerName: string;
  playerAvatarUrl?: string | null;
  gameId: string;
  deviceModel: string;
  tournamentTitle?: string;
  seasonName?: string;
  updatedAt?: string | null;
  lastUpdateType?: 'id' | 'device' | 'both' | null;
  onDownloaded?: (dataUrl: string) => void;
}

function formatUpdateDateTime(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const day = d.getDate().toString().padStart(2, '0');
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = hours.toString().padStart(2, '0');
  return `${day} ${month} ${year} • ${formattedHours}:${minutes} ${ampm}`;
}

export const TournamentPlayerCard: React.FC<TournamentPlayerCardProps> = ({
  playerName,
  playerAvatarUrl,
  gameId,
  deviceModel,
  tournamentTitle = 'EFOOTBALL CHAMPIONSHIP',
  seasonName = 'SEASON 1 • 2026',
  updatedAt,
  lastUpdateType,
  onDownloaded
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Handle Download Image (High Res 4:5)
  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setDownloading(true);
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.98,
        pixelRatio: 3, // Ultra-crisp 3x resolution for Facebook
      });

      const link = document.createElement('a');
      link.download = `${playerName.toLowerCase().replace(/\s+/g, '_')}_card.png`;
      link.href = dataUrl;
      link.click();

      if (onDownloaded) {
        onDownloaded(dataUrl);
      }
    } catch (err) {
      console.error('Error generating card image:', err);
    } finally {
      setDownloading(false);
    }
  };

  // Handle Copy Facebook Caption
  const handleCopyCaption = () => {
    const caption = `⚽ Officially registered for ${tournamentTitle} (${seasonName})! 🔥\n\n👤 Player: ${playerName}\n🔢 Game ID: ${gameId}\n📱 Device: ${deviceModel}\n\nReady for the challenge! Wish me luck! 🏆⚡\n#eFootball #Tournament #OfficialContender`;
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
      {/* 4:5 Aspect Ratio Card Container */}
      <div
        ref={cardRef}
        className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl select-none flex flex-col justify-between p-5 border-2 border-[#c89850]/40"
        style={{
          background: 'radial-gradient(ellipse at 50% 20%, #002c6b 0%, #00173d 60%, #000c22 100%)',
          fontFamily: "'Bebas Neue', sans-serif, system-ui",
        }}
      >
        {/* Subtle Luxury Card Background Lines */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#c89850 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Top Metallic Border Line */}
        <div className="absolute top-0 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-[#c89850] to-transparent opacity-80" />

        {/* ─── 1. Header: Tournament & Season ─── */}
        <div className="relative z-10 flex items-center justify-between border-b border-[#c89850]/20 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#c89850] text-[#00173d] flex items-center justify-center font-bold shadow">
              <Shield className="w-4 h-4 fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] tracking-wider text-[#c89850] uppercase font-black leading-none truncate max-w-[170px]">
                {tournamentTitle}
              </span>
              <span className="text-[10px] tracking-widest text-white/50 uppercase font-sans font-bold mt-0.5">
                OFFICIAL CONTENDER
              </span>
            </div>
          </div>

          <div className="px-2.5 py-1 rounded-md bg-[#c89850]/15 border border-[#c89850]/40 text-[#c89850] text-[11px] font-sans font-bold tracking-wider">
            {seasonName}
          </div>
        </div>

        {/* ─── 2. Center: Centered Player Photo in Luxury Frame ─── */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center py-2">
          <div className="relative w-[65%] aspect-square rounded-2xl overflow-hidden border-2 border-[#c89850]/60 shadow-[0_12px_30px_rgba(0,0,0,0.6)] bg-white">
            {playerAvatarUrl ? (
              <img
                src={playerAvatarUrl}
                alt={playerName}
                className="w-full h-full object-cover object-top"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#00173d] text-white/40 p-4 text-center">
                <span className="text-5xl font-bold mb-1">⚽</span>
                <span className="text-xs font-sans">No Avatar</span>
              </div>
            )}
            {/* Subtle inner bottom gradient for depth */}
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
          </div>

          {/* Player Name Directly Below Photo */}
          <div className="mt-3 text-center px-2 w-full">
            <h2 className="text-[26px] sm:text-[30px] font-black text-white tracking-wider uppercase leading-none truncate drop-shadow-md">
              {playerName}
            </h2>
            <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-[#c89850] to-transparent mx-auto mt-1.5" />
          </div>
        </div>

        {/* ─── 3. Bottom: Game ID & Device Pills ─── */}
        <div className="relative z-10 pt-2">
          {updatedAt && lastUpdateType && (
            <div className="mb-2 flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[9px] font-sans font-bold tracking-wider uppercase shadow-inner">
              <Zap className="w-3 h-3 text-amber-400 fill-current animate-pulse flex-shrink-0" />
              <span>
                {lastUpdateType === 'id' && 'GAME ID UPDATED'}
                {lastUpdateType === 'device' && 'DEVICE UPDATED'}
                {lastUpdateType === 'both' && 'ID & DEVICE UPDATED'}
              </span>
              <span className="text-white/80 font-mono">• {formatUpdateDateTime(updatedAt)}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 bg-[#00112a]/90 border border-[#c89850]/30 rounded-2xl p-2.5 shadow-lg">
            {/* Game ID */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/5">
              <Hash className="w-4 h-4 text-[#c89850] flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] uppercase font-sans font-bold text-white/50 tracking-wider leading-none">
                  Game ID
                </span>
                <span className="text-[12px] font-mono font-bold text-white tracking-wide truncate mt-0.5">
                  {gameId || '—'}
                </span>
              </div>
            </div>

            {/* Device */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/5">
              <Smartphone className="w-4 h-4 text-[#c89850] flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] uppercase font-sans font-bold text-white/50 tracking-wider leading-none">
                  Device
                </span>
                <span className="text-[12px] font-sans font-bold text-white truncate mt-0.5">
                  {deviceModel || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Actions Below Card ─── */}
      <div className="flex items-center gap-3 w-full">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#c89850] hover:bg-[#b58641] text-[#00173d] font-bold text-sm shadow-lg transition active:scale-[0.98] disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Generating...' : 'Download Card (HD)'}
        </button>

        <button
          onClick={handleCopyCaption}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm border border-white/10 shadow transition active:scale-[0.98]"
          title="Copy Facebook post caption"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-white/80" />
              <span>Copy Caption</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
