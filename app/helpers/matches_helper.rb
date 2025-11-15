module MatchesHelper
  def match_participants_for_display(match, user)
    participants = match.match_participants.to_a

    current_participant = participants.find { |participant| participant.profile&.user_id == user.id }
    opponent_participant = participants.reject { |participant| participant == current_participant }.first

    { current: current_participant, opponent: opponent_participant }
  end

  def participant_username(participant, fallback: "Opponent")
    participant&.profile&.username || fallback
  end
end
