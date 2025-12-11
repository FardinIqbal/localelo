module Rating
  # Processes a rating period for a leaderboard using Glicko-2.
  # Collects all unrated active matches, computes per-player updates, then persists
  # rating, rating deviation, volatility, counters, participant snapshots, and histories.
  class Glicko2Processor
    def initialize(leaderboard:, matches: nil, calculator: Rating::Glicko2Calculator.new)
      @leaderboard = leaderboard
      @matches = Array(matches).compact.presence
      @calculator = calculator
    end

    def call
      matches = @matches || pending_matches
      return if matches.empty?

      matches = matches.includes(match_participants: :profile)

      ratings = preload_ratings(matches)
      initial_states = snapshot_states(ratings)
      results_by_profile, counters = build_results(matches, ratings)

      updated_states = compute_updates(initial_states, results_by_profile)
      persist!(matches, ratings, initial_states, updated_states, counters)
    end

    private

    def pending_matches
      @leaderboard.matches.active.where(rated_at: nil)
    end

    def preload_ratings(matches)
      profile_ids = matches.flat_map { |m| m.match_participants.map(&:profile_id) }.compact.uniq
      existing = LeaderboardRating.where(leaderboard: @leaderboard, profile_id: profile_ids).index_by(&:profile_id)

      profile_ids.index_with do |pid|
        existing[pid] || LeaderboardRating.create!(leaderboard: @leaderboard, profile_id: pid)
      end
    end

    def snapshot_states(ratings)
      ratings.transform_values do |rating|
        {
          rating: rating.rating.to_f,
          rating_deviation: rating.rating_deviation.to_f,
          volatility: rating.volatility.to_f,
          wins: rating.wins.to_i,
          losses: rating.losses.to_i,
          draws: rating.draws.to_i
        }
      end
    end

    def build_results(matches, ratings)
      results_by_profile = Hash.new { |h, k| h[k] = [] }
      counters = Hash.new { |h, k| h[k] = { wins: 0, losses: 0, draws: 0 } }

      matches.each do |match|
        participants = match.match_participants
        next unless participants.size == 2

        p1, p2 = participants
        rating1 = ratings[p1.profile_id]
        rating2 = ratings[p2.profile_id]
        next unless rating1 && rating2

        scores = scores_for(match, p1, p2)

        results_by_profile[p1.profile_id] << build_result(rating2, scores[:p1])
        results_by_profile[p2.profile_id] << build_result(rating1, scores[:p2])

        increment_counters(counters[p1.profile_id], scores[:p1])
        increment_counters(counters[p2.profile_id], scores[:p2])
      end

      [results_by_profile, counters]
    end

    def build_result(opponent_rating, score)
      Rating::Glicko2Calculator::Result.new(
        opponent_rating: opponent_rating.rating,
        opponent_rd: opponent_rating.rating_deviation,
        score: score
      )
    end

    def scores_for(match, p1, p2)
      if match.is_draw?
        { p1: 0.5, p2: 0.5 }
      elsif p1.winner?
        { p1: 1.0, p2: 0.0 }
      elsif p2.winner?
        { p1: 0.0, p2: 1.0 }
      else
        { p1: 0.5, p2: 0.5 }
      end
    end

    def increment_counters(counter, score)
      case score
      when 1.0
        counter[:wins] += 1
      when 0.0
        counter[:losses] += 1
      else
        counter[:draws] += 1
      end
    end

    def compute_updates(initial_states, results_by_profile)
      initial_states.each_with_object({}) do |(profile_id, state), acc|
        results = results_by_profile[profile_id] || []
        acc[profile_id] = @calculator.update(state, results)
      end
    end

    def persist!(matches, ratings, initial_states, updated_states, counters)
      timestamp = Time.current

      ActiveRecord::Base.transaction do
        ratings.each do |profile_id, rating|
          before = initial_states[profile_id]
          after = updated_states[profile_id]
          counter = counters[profile_id]

          rating.rating = after[:rating]
          rating.rating_deviation = after[:rating_deviation]
          rating.volatility = after[:volatility]
          rating.last_rated_at = timestamp
          rating.wins = before[:wins] + counter[:wins]
          rating.losses = before[:losses] + counter[:losses]
          rating.draws = before[:draws] + counter[:draws]
          rating.save!
        end

        matches.each do |match|
          match.match_participants.each do |participant|
            profile_id = participant.profile_id
            before = initial_states[profile_id]
            after = updated_states[profile_id]

            participant.update!(
              rating_before_match: before[:rating],
              rating_deviation_before_match: before[:rating_deviation],
              volatility_before_match: before[:volatility],
              rating_after_match: after[:rating],
              rating_deviation_after_match: after[:rating_deviation],
              volatility_after_match: after[:volatility]
            )

            RatingHistory.create!(
              profile_id: profile_id,
              leaderboard: @leaderboard,
              match: match,
              rating: after[:rating],
              rating_deviation: after[:rating_deviation],
              volatility: after[:volatility]
            )
          end

          match.update!(rated_at: timestamp)
        end
      end
    end
  end
end

