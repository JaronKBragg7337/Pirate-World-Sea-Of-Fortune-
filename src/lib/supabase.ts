import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Player API
export async function getOrCreatePlayer(username: string) {
  const { data: existing } = await supabase
    .from('players')
    .select('*')
    .eq('username', username)
    .single();

  if (existing) {
    await supabase.from('players').update({ last_played: new Date().toISOString() }).eq('id', existing.id);
    return existing;
  }

  const { data: player } = await supabase
    .from('players')
    .insert({ username, display_name: username })
    .select()
    .single();

  // Create default ship
  if (player) {
    await supabase.from('player_ships').insert({ player_id: player.id });
    const names = ['Jack', 'Anne', 'Blackbeard', 'Calico', 'Morgan'];
    const crewData = names.map(n => ({ ship_id: player.id, name: n, role: 'idle' as const, skill: 0.5 + Math.random() * 0.5 }));
    await supabase.from('crew_members').insert(crewData);
  }

  return player;
}

export async function getPlayerShip(playerId: string) {
  const { data } = await supabase
    .from('player_ships')
    .select('*, crew:crew_members(*)')
    .eq('player_id', playerId)
    .single();
  return data;
}

export async function updateShip(shipId: string, updates: Record<string, unknown>) {
  return supabase.from('player_ships').update(updates).eq('id', shipId);
}

export async function saveScore(playerId: string, playerName: string, score: number, shipsSunk: number, gold: number, shipType: string) {
  return supabase.from('scores').insert({
    player_id: playerId,
    player_name: playerName,
    score,
    ships_sunk: shipsSunk,
    gold_earned: gold,
    ship_type: shipType,
  });
}

export async function getLeaderboard(limit = 20) {
  const { data } = await supabase
    .from('scores')
    .select('*')
    .order('score', { ascending: false })
    .limit(limit);
  return data || [];
}

export async function updatePlayerStats(playerId: string, renown: number, shipsSunk: number, goldEarned: number) {
  return supabase.rpc('update_player_stats', {
    p_id: playerId,
    p_renown: renown,
    p_ships_sunk: shipsSunk,
    p_gold: goldEarned,
  });
}

// Multiplayer sessions
export async function createSession(hostId: string, name: string, maxPlayers = 8) {
  return supabase.from('game_sessions').insert({
    host_player_id: hostId,
    session_name: name,
    max_players: maxPlayers,
  }).select().single();
}

export async function getActiveSessions() {
  const { data } = await supabase
    .from('game_sessions')
    .select('*, players:session_players(count)')
    .eq('status', 'waiting');
  return data || [];
}

export async function joinSession(sessionId: string, playerId: string, shipType = 'sloop') {
  return supabase.from('session_players').insert({
    session_id: sessionId,
    player_id: playerId,
    ship_type: shipType,
  });
}
