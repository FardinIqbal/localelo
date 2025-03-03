class Match < ApplicationRecord
  belongs_to :gym
  belongs_to :user1, class_name: "User"
  belongs_to :opponent, class_name: "User", foreign_key: "opponent_id" # UPDATED
  belongs_to :winner, class_name: "User"
end
