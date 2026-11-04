import { Player } from '@/features/players/types';

export type TournamentStatus = 'draft' | 'registration_open' | 'group_stage' | 'knockout_stage' | 'completed';
export type RegistrationStatus = 'pending' | 'approved' | 'rejected';
export type MatchStage = 
  | 'group' 
  | 'tie_breaker' 
  | 'round_of_64' 
  | 'round_of_32' 
  | 'round_of_16' 
  | 'quarter_final' 
  | 'semi_final' 
  | 'third_place' 
  | 'final';
export type MatchStatus = 'scheduled' | 'pending_approval' | 'disputed' | 'completed' | 'cancelled';

export interface Tournament {
  id: string;
  title: string;
  season_id?: number | null;
  season_name?: string | null;
  status: TournamentStatus;
  group_size: number;
  
  // Timeline (A to Z)
  start_date: string;
  registration_deadline: string;
  group_match_days_interval: number; // e.g. 2 days
  result_submission_grace_hours: number; // e.g. 24 hours
  final_deadline?: string | null;
  
  // Colors & Branding
  primary_color: string; // '#00265a'
  accent_color: string;  // '#c89850'
  banner_url?: string | null;
  rules_text?: string | null;
  
  // Awards / Winners
  champion_player_id?: string | null;
  runner_up_player_id?: string | null;
  third_place_player_id?: string | null;
  golden_boot_player_id?: string | null;
  mvp_player_id?: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface TournamentRegistration {
  id: string;
  tournament_id: string;
  player_id: string;
  player?: Player;
  
  game_id: string;
  device_model: string;
  facebook_post_url: string;
  generated_card_url?: string | null;
  
  status: RegistrationStatus;
  rejection_reason?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  created_at: string;
}

export interface TournamentGroup {
  id: string;
  tournament_id: string;
  name: string; // 'Group A'
  display_order: number;
  created_at: string;
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  player_id?: string | null;
  player?: Player;
  group_id?: string | null;
  
  game_id?: string | null;
  device_model?: string | null;
  is_dummy: boolean;
  dummy_name?: string | null;
  
  seed?: number | null;
  group_rank?: number | null;
  qualified_for_knockout?: boolean;
  created_at: string;
}

export interface TournamentMatchStats {
  shots_p1?: number;
  shots_p2?: number;
  shots_on_target_p1?: number;
  shots_on_target_p2?: number;
  possession_p1?: number;
  possession_p2?: number;
  saves_p1?: number;
  saves_p2?: number;
  passes_p1?: number;
  passes_p2?: number;
  successful_passes_p1?: number;
  successful_passes_p2?: number;
  pass_accuracy_p1?: number;
  pass_accuracy_p2?: number;
  tackles_p1?: number;
  tackles_p2?: number;
  fouls_p1?: number;
  fouls_p2?: number;
  interceptions_p1?: number;
  interceptions_p2?: number;
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  stage: MatchStage;
  group_id?: string | null;
  matchday: number;
  bracket_match_number?: number | null;
  
  play_deadline: string;
  submission_deadline: string;
  
  player1_id?: string | null;
  player2_id?: string | null;
  player1?: Player;
  player2?: Player;
  player1_is_dummy: boolean;
  player2_is_dummy: boolean;
  
  player1_score?: number | null;
  player2_score?: number | null;
  winner_id?: string | null;
  
  status: MatchStatus;
  is_auto_win: boolean;
  auto_win_player_id?: string | null;
  auto_win_reason?: string | null;
  auto_win_proof_url?: string | null;
  
  is_inactive_double_loss: boolean;
  screenshot_url?: string | null;
  match_stats?: TournamentMatchStats | null;
  
  created_at: string;
  updated_at: string;
}

export interface TournamentSubmission {
  id: string;
  match_id: string;
  submitted_by_player_id: string;
  submission_type: 'score' | 'auto_win_claim';
  
  proposed_p1_score?: number | null;
  proposed_p2_score?: number | null;
  claim_reason?: string | null;
  screenshot_url: string;
  ocr_extracted_data?: Record<string, any> | null;
  
  status: 'pending' | 'verified' | 'disputed' | 'rejected';
  created_at: string;
}

// Standings calculation item for Group Tables
export interface GroupStandingRow {
  participant_id: string;
  player_id?: string | null;
  player_name: string;
  avatar_url?: string | null;
  game_id?: string | null;
  device_model?: string | null;
  is_dummy: boolean;
  
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number; // Goals For
  ga: number; // Goals Against
  gd: number; // Goal Difference
  points: number; // 3 for win, 1 for played draw, 0 for inactive/loss
  
  rank: number;
  is_qualified: boolean;
}
