class RatingHistory < ApplicationRecord
  belongs_to :profile
  belongs_to :leaderboard
  belongs_to :match
end
