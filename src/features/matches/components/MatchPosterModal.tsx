import { useRef, useState } from 'react';
import { toPng, toBlob } from 'html-to-image';
import { SocialMatchPoster, MatchDuel } from './SocialMatchPoster';
import { Button } from '@/shared/components';
import { Download, Copy, Check, X, Moon, Sun } from 'lucide-react';

export interface MatchPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId?: string | number;
  competition: string;
  date: string;
  homeClub: string;
  awayClub: string;
  homeScore: number;
  awayScore: number;
  homeLogoUrl?: string;
  awayLogoUrl?: string;
  matches: MatchDuel[];
}

export function MatchPosterModal({
  isOpen,
  onClose,
  matchId,
  competition,
  date,
  homeClub,
  awayClub,
  homeScore,
  awayScore,
  homeLogoUrl,
  awayLogoUrl,
  matches,
}: MatchPosterModalProps) {
  const posterRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
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
      const cleanComp = competition.replace(/[^a-zA-Z0-9]/g, '_');
      const cleanOpp = awayClub.replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `${cleanComp}_vs_${cleanOpp}_Report.png`;
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#121826] border border-white/10 rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d131f]">
          <div className="flex items-center gap-3">
            <span className="text-xl">🏆</span>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Match Poster Generated!</h2>
              <p className="text-xs text-gray-400">Ready to download or copy directly to social media</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  theme === 'light' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  theme === 'dark' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Poster Viewport */}
        <div className="flex-1 overflow-auto p-6 flex justify-center items-center bg-[#070B12]">
          <div
            className="flex-shrink-0 origin-top shadow-2xl rounded-2xl overflow-hidden"
            style={{
              transform: 'scale(0.58)',
              transformOrigin: 'top center',
              marginBottom: '-550px',
            }}
          >
            <SocialMatchPoster
              ref={posterRef}
              matchId={matchId}
              competition={competition}
              date={date}
              homeClub={homeClub}
              awayClub={awayClub}
              homeScore={homeScore}
              awayScore={awayScore}
              homeLogoUrl={homeLogoUrl}
              awayLogoUrl={awayLogoUrl}
              matches={matches}
              theme={theme}
            />
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#0d131f]">
          <p className="text-xs text-gray-400 hidden sm:block">
            High-res PNG (2x Retina quality for Facebook / Instagram / WhatsApp)
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
              className="flex items-center gap-2"
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
