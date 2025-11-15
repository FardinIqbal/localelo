class MatchRatingProcessor
  K_FACTOR = 32

  def initialize(match)
    @match = match
    @leaderboard = match.leaderboard
  end

  def call
    return unless processable_match?

    participants = @match.match_participants.includes(:profile)
    return unless participants.size == 2

    participant_data = build_participant_data(participants)
    assign_scores(participant_data)
    assign_expectations(participant_data)
    calculate_new_ratings(participant_data)

    persist_updates(participant_data)
  end

  private

  def processable_match?
    @match.present? && @match.active? && @match.rated_at.nil?
  end

  def build_participant_data(participants)
    participants.map do |participant|
      rating = LeaderboardRating.find_or_create_by!(
        leaderboard: @leaderboard,
        profile: participant.profile
      )

      {
        participant: participant,
        rating: rating
      }
    end
  end

  def assign_scores(participant_data)
    if @match.is_draw?
      participant_data.each { |data| data[:score] = 0.5 }
    else
      participant_data.each do |data|
        data[:score] = data[:participant].winner? ? 1.0 : 0.0
      end
    end
  end

  def assign_expectations(participant_data)
    first, second = participant_data
    first[:expected_score] = expected_score(first[:rating].rating, second[:rating].rating)
    second[:expected_score] = expected_score(second[:rating].rating, first[:rating].rating)
  end

  def calculate_new_ratings(participant_data)
    participant_data.each do |data|
      current_rating = data[:rating].rating
      data[:new_rating] = [current_rating + K_FACTOR * (data[:score] - data[:expected_score]), 0].max.round(2)
    end
  end

  def persist_updates(participant_data)
    timestamp = Time.current

    ActiveRecord::Base.transaction do
      participant_data.each do |data|
        participant = data[:participant]
        rating = data[:rating]

        before_attributes = {
          rating_before_match: rating.rating,
          rating_deviation_before_match: rating.rating_deviation,
          volatility_before_match: rating.volatility
        }

        update_counters(rating, participant)
        rating.rating = data[:new_rating]
        rating.last_rated_at = timestamp
        rating.save!

        participant.update!(
          before_attributes.merge(
            rating_after_match: rating.rating,
            rating_deviation_after_match: rating.rating_deviation,
            volatility_after_match: rating.volatility
          )
        )

        RatingHistory.create!(
          profile: participant.profile,
          leaderboard: @leaderboard,
          match: @match,
          rating: rating.rating,
          rating_deviation: rating.rating_deviation,
          volatility: rating.volatility
        )
      end

      @match.update!(rated_at: timestamp)
    end
  end

  def expected_score(rating, opponent_rating)
    1.0 / (1 + 10**((opponent_rating - rating) / 400.0))
  end

  def update_counters(rating, participant)
    case outcome_for(participant)
    when :win
      rating.wins = rating.wins.to_i + 1
    when :loss
      rating.losses = rating.losses.to_i + 1
    when :draw
      rating.draws = rating.draws.to_i + 1
    end
  end

  def outcome_for(participant)
    return :draw if @match.is_draw?

    participant.winner? ? :win : :loss
  end
end
