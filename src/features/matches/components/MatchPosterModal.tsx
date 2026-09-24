import { useRef, useState } from 'react';
import { toPng, toBlob } from 'html-to-image';
import { SocialMatchPoster, MatchDuel, MotmPlayer } from './SocialMatchPoster';
import { Button } from '@/shared/components';
import { Download, Copy, Check, X } from 'lucide-react';

export interface MatchPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId?: string | number;
  competition: string;
  round?: string;
  date: string;
  homeClub: string;
  awayClub: string;
  homeScore: number;
  awayScore: number;
  homeLogoUrl?: string;
  awayLogoUrl?: string;
  motmPlayer?: MotmPlayer | null;
  matches: MatchDuel[];
}

export function MatchPosterModal({
  isOpen,
  onClose,
  matchId,
  competition,
  round,
  date,
  homeClub,
  awayClub,
  homeScore,
  awayScore,
  homeLogoUrl,
  awayLogoUrl,
  motmPlayer,
  matches,
}: MatchPosterModalProps) {
  const posterRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!posterRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(posterRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement('a');
      const cleanComp = (competition || 'Match').replace(/[^a-zA-Z0-9]/g, '_');
      const cleanOpp = (awayClub || 'Opponent').replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `${cleanComp}_vs_${cleanOpp}_Poster.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export match poster PNG:', err);
      alert('Could not generate image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyClipboard = async () => {
    if (!posterRef.current) return;
    setIsExporting(true);
    try {
      const blob = await toBlob(posterRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });
      if (blob && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } else {
        throw new Error('Clipboard API not supported');
      }
    } catch (err) {
      console.error('Failed to copy match poster to clipboard:', err);
      alert('Clipboard copy is not supported in this browser. Please use Download instead.');
    } finally {
      setIsExporting(false);
    }
  };

  // Preview scale: 1080 x 1350 scaled to fit comfortably inside modal
  const PREVIEW_SCALE = 0.52;
  const PREVIEW_WIDTH = Math.round(1080 * PREVIEW_SCALE); // 562px
  const PREVIEW_HEIGHT = Math.round(1350 * PREVIEW_SCALE); // 702px

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#0b101c] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/10 bg-[#070b14]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-base">
              🏆
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Official Match Poster</h2>
              <p className="text-xs text-gray-400">1080 × 1350 High-Res eSports Graphics</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Poster Viewport with clean scaling */}
        <div className="flex-1 overflow-y-auto p-6 flex justify-center items-start bg-[#04060B]">
          <div
            className="shadow-2xl rounded-2xl overflow-hidden my-auto border border-white/10"
            style={{
              width: `${PREVIEW_WIDTH}px`,
              height: `${PREVIEW_HEIGHT}px`,
              position: 'relative',
              flexShrink: 0,
              boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 35px rgba(34,211,238,0.15)',
            }}
          >
            <div
              style={{
                width: '1080px',
                height: '1350px',
                transform: `scale(${PREVIEW_SCALE})`,
                transformOrigin: 'top left',
              }}
            >
              <SocialMatchPoster
                ref={posterRef}
                matchId={matchId}
                competition={competition}
                round={round}
                date={date}
                homeClub={homeClub}
                opponentClub={awayClub}
                awayClub={awayClub}
                homeScore={homeScore}
                awayScore={awayScore}
                homeLogoUrl={homeLogoUrl}
                awayLogoUrl={awayLogoUrl}
                motmPlayer={motmPlayer}
                matches={matches}
              />
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#070b14]">
          <p className="text-xs text-gray-400 hidden sm:block">
            High-res PNG (2x Retina quality for Facebook, WhatsApp & Socials)
          </p>

          <div className="flex items-center gap-3 ml-auto">
            <Button
              variant="secondary"
              onClick={handleCopyClipboard}
              disabled={isExporting}
              className="flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard! 🎉' : 'Copy Image'}</span>
            </Button>

            <Button
              onClick={handleDownload}
              disabled={isExporting}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating PNG...' : 'Download Image'}</span>
            </Button>

            <Button variant="ghost" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
