module HasMatches
  extend ActiveSupport::Concern
  
  included do
    has_many :match_participants, dependent: :destroy
    has_many :matches, through: :match_participants
    has_many :matches_won, class_name: 'Match', foreign_key: 'winner_profile_id'
  end

  def matches
    Match.involving_profile(id)
  end

  def win_percentage
    total = matches.count
    return 0 if total.zero?

    (matches_won.count.to_f / total * 100).round(1)
  end
end
