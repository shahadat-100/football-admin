import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Download, Copy, Check, Sparkles, Smartphone, Gamepad2 } from 'lucide-react';

interface TournamentPlayerCardProps {
  playerName: string;
  playerAvatarUrl?: string | null;
  gameId: string;
  deviceModel: string;
  tournamentTitle?: string;
  seasonName?: string;
  onDownloaded?: (dataUrl: string) => void;
}

export const TournamentPlayerCard: React.FC<TournamentPlayerCardProps> = ({
  playerName,
  playerAvatarUrl,
  gameId,
  deviceModel,
  tournamentTitle = 'EFOOTBALL SOLO CHAMPIONSHIP',
  seasonName = 'SEASON 1 • 2026',
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
        pixelRatio: 2.5, // Crisp 2.5x resolution for retina/FB upload
      });

      const link = document.createElement('a');
      link.download = `${playerName.toLowerCase().replace(/\s+/g, '_')}_tournament_card.png`;
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
    const caption = `⚽ Officially registered for ${tournamentTitle} (${seasonName})! 🔥\n\n👤 Player: ${playerName}\n🎮 IGN: ${gameId}\n📱 Device: ${deviceModel}\n\nReady to battle for the championship! Wish me luck! 🏆⚡\n#eFootball #SoloChampionship #TournamentRegistration`;
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
      {/* 4:5 Aspect Ratio Card Container */}
      <div
        ref={cardRef}
        className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl select-none"
        style={{
          backgroundColor: '#00265a',
          fontFamily: "'Bebas Neue', sans-serif, system-ui",
        }}
      >
        {/* Subtle Grunge/Grid Background Texture */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#ffffff 1px, #00265a 1px)`,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 10px 10px'
          }}
        />

        {/* Diagonal Gold Accent Cut / Polygon Behind Player */}
        <div
          className="absolute right-0 top-0 bottom-0 w-[55%] z-0"
          style={{
            backgroundColor: '#c89850',
            clipPath: 'polygon(25% 0%, 100% 0%, 100% 100%, 0% 100%)',
          }}
        />

        {/* Dynamic Chalk / Paint Strokes Effect on Gold Block */}
        <div
          className="absolute right-0 top-0 bottom-0 w-[55%] opacity-20 pointer-events-none mix-blend-multiply"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 15px, transparent 0, transparent 30px)'
          }}
        />

        {/* ─── Top Header Badge ─── */}
        <div className="relative z-10 p-5 flex items-center justify-between">
          <div className="flex items-center gap-2 bg-[#001738]/90 backdrop-blur-md px-3.5 py-1 rounded-md border border-[#c89850]/40 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#c89850] animate-pulse" />
            <span className="text-[14px] tracking-wider text-[#c89850] uppercase font-bold">
              {tournamentTitle}
            </span>
          </div>

          <div className="bg-[#c89850] text-[#00265a] font-black text-xs px-2.5 py-1 rounded shadow">
            {seasonName}
          </div>
        </div>

        {/* ─── Center / Right: Player Photo Frame ─── */}
        <div className="absolute right-3 bottom-14 w-[58%] h-[68%] z-10 flex items-end justify-center">
          {/* Black Stroke Shadow Frame Container */}
          <div className="relative w-full h-full rounded-xl border-4 border-[#001738] shadow-[6px_6px_0px_rgba(0,0,0,0.5)] bg-[#001a40] overflow-hidden">
            {playerAvatarUrl ? (
              <img
                src={playerAvatarUrl}
                alt={playerName}
                className="w-full h-full object-cover object-top"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#00265a] text-white/50 p-4 text-center">
                <span className="text-4xl font-bold mb-2">⚽</span>
                <span className="text-sm font-sans tracking-tight">No Photo Uploaded</span>
              </div>
            )}

            {/* Bottom Inner Gradient on Frame */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#001738] to-transparent opacity-80 pointer-events-none" />
          </div>
        </div>

        {/* ─── Left Side: Giant Vertical Rotated Typography ─── */}
        <div className="absolute left-4 bottom-24 top-20 z-10 flex items-center justify-center pointer-events-none">
          <span
            className="text-[44px] sm:text-[50px] leading-none text-white tracking-widest font-black uppercase whitespace-nowrap opacity-90 drop-shadow-[2px_2px_4px_rgba(0,0,0,0.6)]"
            style={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
            }}
          >
            {playerName}
          </span>
        </div>

        {/* ─── Bottom Information Banner ─── */}
        <div className="absolute inset-x-0 bottom-0 z-20 bg-[#001738] border-t-2 border-[#c89850]/50 p-3.5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[20px] text-white leading-tight font-black tracking-wide uppercase truncate max-w-[200px]">
              {playerName}
            </span>
            <div className="flex items-center gap-3 text-white/80 font-sans text-[11px] font-semibold mt-0.5">
              <span className="flex items-center gap-1 text-[#c89850]">
                <Gamepad2 className="w-3.5 h-3.5" />
                <span className="font-mono">{gameId || 'IGN: Not set'}</span>
              </span>
              <span className="text-white/30">•</span>
              <span className="flex items-center gap-1 text-white/70">
                <Smartphone className="w-3.5 h-3.5" />
                <span className="truncate max-w-[100px]">{deviceModel || 'Device'}</span>
              </span>
            </div>
          </div>

          {/* Accent Gold Icon */}
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#c89850] text-[#00265a] shadow">
            <Sparkles className="w-5 h-5 fill-current" />
          </div>
        </div>
      </div>

      {/* ─── Actions Below Card ─── */}
      <div className="flex items-center gap-3 w-full">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#c89850] hover:bg-[#b58641] text-[#00265a] font-bold text-sm shadow-lg transition active:scale-[0.98] disabled:opacity-50"
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
              <span>Copy FB Caption</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
