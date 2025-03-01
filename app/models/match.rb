class Match < ApplicationRecord
  belongs_to :player1, class_name: "Player"
  belongs_to :player2, class_name: "Player"
  belongs_to :winner, class_name: "Player", optional: true
  belongs_to :gym

  after_create :update_elo_ratings

  private

  def update_elo_ratings
    return if winner.nil?

    k_factor = 32

    p1 = player1
    p2 = player2

    p1_expected = 1.0 / (1.0 + 10**((p2.elo - p1.elo) / 400.0))
    p2_expected = 1.0 / (1.0 + 10**((p1.elo - p2.elo) / 400.0))

    if winner == p1
      p1_new_elo = p1.elo + k_factor * (1 - p1_expected)
      p2_new_elo = p2.elo + k_factor * (0 - p2_expected)
    else
      p1_new_elo = p1.elo + k_factor * (0 - p1_expected)
      p2_new_elo = p2.elo + k_factor * (1 - p2_expected)
    end

    p1.update!(elo: p1_new_elo.round)
    p2.update!(elo: p2_new_elo.round)
  end
end
