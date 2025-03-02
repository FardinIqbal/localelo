class Match < ApplicationRecord
  belongs_to :player1, class_name: "Player"
  belongs_to :player2, class_name: "Player"
  belongs_to :winner, class_name: "Player", optional: true
  belongs_to :gym

  after_create :update_elo_ratings

  # This method will be used to process Elo after the match is created

  private

  def update_elo
    k_factor = 32
    p1 = player1
    p2 = player2

    expected_p1 = 1.0 / (1.0 + 10 ** ((p2.elo - p1.elo) / 400.0))
    expected_p2 = 1.0 / (1.0 + 10 ** ((p1.elo - p2.elo) / 400.0))

    if winner_id == player1_id
      p1.elo += k_factor * (1 - expected_p1)
      p2.elo += k_factor * (0 - expected_p2)
    elsif winner_id == player2_id
      p1.elo += k_factor * (0 - expected_p1)
      p2.elo += k_factor * (1 - expected_p2)
    else
      # Draw case
      p1.elo += k_factor * (0.5 - expected_p1)
      p2.elo += k_factor * (0.5 - expected_p2)
    end

    p1.save!
    p2.save!
  end
end
