class EloHistory < ApplicationRecord
  belongs_to :profile
  belongs_to :leaderboard

  delegate :user, to: :profile
end
