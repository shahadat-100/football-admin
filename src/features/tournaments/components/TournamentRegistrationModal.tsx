import React, { useState } from 'react';
import { Player } from '@/features/players/types';
import { TournamentPlayerCard } from './TournamentPlayerCard';
import { supabase } from '@/lib/supabase';
import { X, CheckCircle2, AlertCircle, Share2, ArrowRight } from 'lucide-react';

interface TournamentRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  tournamentTitle: string;
  seasonName?: string;
  players: Player[];
  onRegistrationSuccess?: () => void;
}

export const TournamentRegistrationModal: React.FC<TournamentRegistrationModalProps> = ({
  isOpen,
  onClose,
  tournamentId,
  tournamentTitle,
  seasonName = 'SEASON 1 • 2026',
  players,
  onRegistrationSuccess
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [gameId, setGameId] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [facebookPostUrl, setFacebookPostUrl] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedPlayerId) {
      setError('Please select your player profile.');
      return;
    }
    if (!gameId.trim()) {
      setError('Please enter your eFootball Game ID (IGN).');
      return;
    }
    if (!deviceModel.trim()) {
      setError('Please enter your device name / model.');
      return;
    }
    if (!facebookPostUrl.trim() || !facebookPostUrl.includes('facebook.com')) {
      setError('Please provide a valid Facebook post URL as proof.');
      return;
    }

    try {
      setSubmitting(true);
      const { error: insertError } = await supabase
        .from('tournament_registrations')
        .insert({
          tournament_id: tournamentId,
          player_id: selectedPlayerId,
          game_id: gameId.trim(),
          device_model: deviceModel.trim(),
          facebook_post_url: facebookPostUrl.trim(),
          status: 'pending'
        });

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error('This player has already registered for this tournament.');
        }
        throw insertError;
      }

      setSuccess(true);
      if (onRegistrationSuccess) {
        onRegistrationSuccess();
      }
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err.message || 'Failed to submit registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#09152b] border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="p-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5 border border-emerald-500/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Registration Submitted!</h3>
            <p className="text-white/70 max-w-md mb-6 text-sm">
              Your application has been received. Our admin team will verify your Facebook post link. Once verified, you will be added to the tournament draw!
            </p>
            <button
              onClick={onClose}
              className="py-2.5 px-6 rounded-xl bg-[#c89850] text-[#00265a] font-bold text-sm shadow hover:bg-[#b58641] transition"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8">
            {/* Left Column: Form & Steps */}
            <div className="lg:col-span-6 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c89850]/15 border border-[#c89850]/30 text-[#c89850] text-xs font-bold uppercase tracking-wider mb-3">
                  <Share2 className="w-3.5 h-3.5" />
                  Viral Registration Flow
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight mb-1">
                  Tournament Registration
                </h2>
                <p className="text-white/60 text-xs mb-6">
                  Select your profile, customize your official player card, post it on Facebook, and paste the link below!
                </p>

                {error && (
                  <div className="p-3 mb-5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Select Player Profile */}
                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1.5">
                      Select Player Profile *
                    </label>
                    <select
                      value={selectedPlayerId}
                      onChange={(e) => setSelectedPlayerId(e.target.value)}
                      required
                      className="w-full py-2.5 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#c89850] transition"
                    >
                      <option value="" disabled className="bg-[#09152b] text-white/50">
                        -- Choose your profile --
                      </option>
                      {players.map((p) => (
                        <option key={p.id} value={p.id} className="bg-[#09152b] text-white">
                          {p.name} {p.playerRoles?.[0] ? `(${p.playerRoles[0]})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Game ID & Device in 2 cols */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-white/80 mb-1.5">
                        eFootball IGN / Game ID *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. SHADOW_99"
                        value={gameId}
                        onChange={(e) => setGameId(e.target.value)}
                        required
                        className="w-full py-2.5 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#c89850] transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/80 mb-1.5">
                        Device Model *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. iPhone 15 Pro"
                        value={deviceModel}
                        onChange={(e) => setDeviceModel(e.target.value)}
                        required
                        className="w-full py-2.5 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#c89850] transition"
                      />
                    </div>
                  </div>

                  {/* Facebook Post URL */}
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-white/80 mb-1.5">
                      Facebook Post Proof URL *
                    </label>
                    <input
                      type="url"
                      placeholder="https://www.facebook.com/your-post-url"
                      value={facebookPostUrl}
                      onChange={(e) => setFacebookPostUrl(e.target.value)}
                      required
                      className="w-full py-2.5 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#c89850] transition"
                    />
                    <p className="text-[11px] text-white/40 mt-1">
                      Download the card from the right, post it to Facebook, and paste the URL here.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#c89850] hover:bg-[#b58641] text-[#00265a] font-black text-sm tracking-wide shadow-lg transition active:scale-[0.98] disabled:opacity-50"
                  >
                    <span>{submitting ? 'Submitting...' : 'Submit Registration'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Live Card Generator Preview */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center bg-black/30 p-4 sm:p-6 rounded-2xl border border-white/5">
              <div className="text-center mb-3">
                <span className="text-xs uppercase font-bold tracking-wider text-[#c89850]">
                  Live Card Preview
                </span>
              </div>

              <TournamentPlayerCard
                playerName={selectedPlayer ? selectedPlayer.name : 'YOUR NAME'}
                playerAvatarUrl={selectedPlayer?.profileImageUrl}
                gameId={gameId || 'YOUR_IGN'}
                deviceModel={deviceModel || 'YOUR DEVICE'}
                tournamentTitle={tournamentTitle}
                seasonName={seasonName}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
