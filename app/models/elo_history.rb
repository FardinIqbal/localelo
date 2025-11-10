class EloHistory < ApplicationRecord
  belongs_to :profile
  belongs_to :leaderboard
  belongs_to :match, optional: true

  delegate :user, to: :profile
end
