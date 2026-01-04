/**
 * Glicko-2 Rating System Implementation
 *
 * Based on Mark Glickman's Glicko-2 algorithm.
 * Reference: http://www.glicko.net/glicko/glicko2.pdf
 */

const TAU = 0.5; // System constant (volatility constraint)
const EPSILON = 0.000001; // Convergence tolerance

interface Player {
  rating: number;
  ratingDeviation: number;
  volatility: number;
}

interface MatchResult {
  opponent: Player;
  score: number; // 1 for win, 0 for loss, 0.5 for draw
}

// Convert from Glicko scale to Glicko-2 scale
function toGlicko2Scale(rating: number): number {
  return (rating - 1500) / 173.7178;
}

// Convert from Glicko-2 scale to Glicko scale
function fromGlicko2Scale(mu: number): number {
  return mu * 173.7178 + 1500;
}

function rdToGlicko2(rd: number): number {
  return rd / 173.7178;
}

function rdFromGlicko2(phi: number): number {
  return phi * 173.7178;
}

// g(φ) function
function g(phi: number): number {
  return 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
}

// E(μ, μj, φj) function - expected score
function E(mu: number, muj: number, phij: number): number {
  return 1 / (1 + Math.exp(-g(phij) * (mu - muj)));
}

// Calculate new volatility using Illinois algorithm
function calculateNewVolatility(
  sigma: number,
  phi: number,
  v: number,
  delta: number
): number {
  const a = Math.log(sigma * sigma);
  const deltaSq = delta * delta;
  const phiSq = phi * phi;

  function f(x: number): number {
    const ex = Math.exp(x);
    const num = ex * (deltaSq - phiSq - v - ex);
    const denom = 2 * Math.pow(phiSq + v + ex, 2);
    return num / denom - (x - a) / (TAU * TAU);
  }

  let A = a;
  let B: number;

  if (deltaSq > phiSq + v) {
    B = Math.log(deltaSq - phiSq - v);
  } else {
    let k = 1;
    while (f(a - k * TAU) < 0) {
      k++;
    }
    B = a - k * TAU;
  }

  let fA = f(A);
  let fB = f(B);

  while (Math.abs(B - A) > EPSILON) {
    const C = A + ((A - B) * fA) / (fB - fA);
    const fC = f(C);

    if (fC * fB <= 0) {
      A = B;
      fA = fB;
    } else {
      fA = fA / 2;
    }

    B = C;
    fB = fC;
  }

  return Math.exp(A / 2);
}

/**
 * Calculate new ratings for a player after matches
 */
export function calculateNewRating(
  player: Player,
  results: MatchResult[]
): Player {
  if (results.length === 0) {
    // No matches - only RD increases (rating decay)
    const phi = rdToGlicko2(player.ratingDeviation);
    const newPhi = Math.sqrt(phi * phi + player.volatility * player.volatility);
    return {
      ...player,
      ratingDeviation: Math.min(rdFromGlicko2(newPhi), 350),
    };
  }

  const mu = toGlicko2Scale(player.rating);
  const phi = rdToGlicko2(player.ratingDeviation);
  const sigma = player.volatility;

  // Step 3: Calculate v (estimated variance)
  let v = 0;
  for (const result of results) {
    const muj = toGlicko2Scale(result.opponent.rating);
    const phij = rdToGlicko2(result.opponent.ratingDeviation);
    const gPhij = g(phij);
    const eVal = E(mu, muj, phij);
    v += gPhij * gPhij * eVal * (1 - eVal);
  }
  v = 1 / v;

  // Step 4: Calculate delta
  let deltaSum = 0;
  for (const result of results) {
    const muj = toGlicko2Scale(result.opponent.rating);
    const phij = rdToGlicko2(result.opponent.ratingDeviation);
    deltaSum += g(phij) * (result.score - E(mu, muj, phij));
  }
  const delta = v * deltaSum;

  // Step 5: Calculate new volatility
  const newSigma = calculateNewVolatility(sigma, phi, v, delta);

  // Step 6: Calculate pre-rating period phi*
  const phiStar = Math.sqrt(phi * phi + newSigma * newSigma);

  // Step 7: Calculate new phi and mu
  const newPhi = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
  const newMu = mu + newPhi * newPhi * deltaSum;

  return {
    rating: Math.round(fromGlicko2Scale(newMu)),
    ratingDeviation: Math.round(rdFromGlicko2(newPhi) * 10) / 10,
    volatility: Math.round(newSigma * 10000) / 10000,
  };
}

/**
 * Process a single match between two players
 * Returns the new ratings for both players
 */
export function processMatch(
  player1: Player,
  player2: Player,
  outcome: "player1" | "player2" | "draw"
): { player1: Player; player2: Player } {
  const score1 = outcome === "player1" ? 1 : outcome === "draw" ? 0.5 : 0;
  const score2 = 1 - score1;

  const newPlayer1 = calculateNewRating(player1, [
    { opponent: player2, score: score1 },
  ]);

  const newPlayer2 = calculateNewRating(player2, [
    { opponent: player1, score: score2 },
  ]);

  return {
    player1: newPlayer1,
    player2: newPlayer2,
  };
}
