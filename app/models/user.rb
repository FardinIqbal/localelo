class User < ApplicationRecord
  # Include Devise modules for authentication functionality
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  # Add Active Storage for avatar
  has_one_attached :avatar

  # == Associations ==
  has_many :profiles
  has_many :organization_memberships, dependent: :destroy
  has_many :organizations, through: :organization_memberships

  has_many :leaderboard_ratings, dependent: :destroy
  has_many :leaderboards, through: :leaderboard_ratings

  has_many :matches_as_user1, class_name: "Match", foreign_key: "user1_id", dependent: :destroy
  has_many :matches_as_opponent, class_name: "Match", foreign_key: "opponent_id", dependent: :destroy
  has_many :matches_won, class_name: "Match", foreign_key: "winner_id", dependent: :nullify

  # Define a method to get all matches for a user
  def matches
    Match.where("user1_id = ? OR opponent_id = ?", id, id)
  end

  # Define a scope for recent matches
  def recent_matches(limit = 5)
    matches.order(created_at: :desc).limit(limit)
  end

  # Define a method to get win rate
  def win_rate
    total = matches.count
    return 0 if total == 0

    wins = matches_won.count
    (wins.to_f / total * 100).round(2)
  end


  # == Validations ==
  validates :email, presence: true, uniqueness: true
  validates :username, presence: true, uniqueness: true
  validates :first_name, presence: true
  validates :last_name, presence: true

  # == Instance Methods ==

  # Returns all matches the user has participated in
  def matches
    Match.where('user1_id = ? OR opponent_id = ?', id, id)
  end

  # Returns full name of the user (or just username if no name exists)
  def full_name
    "#{first_name} #{last_name}"
  end

  # Checks if the user is a member of a given organization
  def member_of?(organization)
    organizations.exists?(organization.id)
  end

  # Returns Elo rating for a given leaderboard (defaults to 1500 if no rating found)
  def elo_for(leaderboard)
    leaderboard_ratings.find_by(leaderboard: leaderboard)&.rating || 1500
  end

  # Total number of matches played by the user
  def total_matches
    matches_as_user1.count + matches_as_opponent.count
  end

  # Total matches won by the user
  def total_wins
    matches_won.count
  end

  # Total matches lost by the user
  def total_losses
    total_matches - total_wins
  end

  # Calculates the user's overall win/loss ratio
  def win_loss_ratio
    total_matches.positive? ? (total_wins.to_f / total_matches).round(2) : 0
  end

  # Returns win percentage
  def win_percentage
    total = total_matches
    return 0 if total.zero?

    (total_wins.to_f / total * 100).round(1)
  end

  # Returns win/loss ratio for a specific leaderboard
  def win_loss_ratio_for_leaderboard(leaderboard)
    matches = Match.where(leaderboard: leaderboard)
                   .where("user1_id = ? OR opponent_id = ?", id, id)
    wins = matches.where(winner_id: id).count
    total = matches.count
    total.positive? ? (wins.to_f / total).round(2) : 0
  end

  # Returns the user's **most frequent opponent across all matches**
  def most_frequent_opponent
    matches = Match.where("user1_id = ? OR opponent_id = ?", id, id)
    return nil if matches.empty?

    opponent_column = Arel.sql("CASE WHEN user1_id = #{id} THEN opponent_id ELSE user1_id END")

    most_faced_opponent_id = matches
                               .group(opponent_column)
                               .order(Arel.sql("COUNT(*) DESC"))
                               .limit(1)
                               .pluck(opponent_column)
                               .first

    User.find_by(id: most_faced_opponent_id)
  end

  # Returns the user's **most frequent opponent in a specific leaderboard**
  def most_frequent_opponent_for_leaderboard(leaderboard)
    matches = Match.where(leaderboard: leaderboard)
                   .where("user1_id = ? OR opponent_id = ?", id, id)
    return nil if matches.empty?

    opponent_column = Arel.sql("CASE WHEN user1_id = #{id} THEN opponent_id ELSE user1_id END")

    most_faced_opponent_id = matches
                               .group(opponent_column)
                               .order(Arel.sql("COUNT(*) DESC"))
                               .limit(1)
                               .pluck(opponent_column)
                               .first

    User.find_by(id: most_faced_opponent_id)
  end

  # Calculates the percentage change in win ratio compared to the previous month
  def win_ratio_trend
    # Get this month's matches
    this_month_matches = Match.where("created_at >= ?", Time.current.beginning_of_month)
                              .where("user1_id = ? OR opponent_id = ?", id, id)
    this_month_wins = this_month_matches.where(winner_id: id).count
    this_month_ratio = this_month_matches.any? ? (this_month_wins.to_f / this_month_matches.count * 100).round(2) : 0

    # Get last month's matches
    last_month_start = 1.month.ago.beginning_of_month
    last_month_end = 1.month.ago.end_of_month
    last_month_matches = Match.where(created_at: last_month_start..last_month_end)
                              .where("user1_id = ? OR opponent_id = ?", id, id)
    last_month_wins = last_month_matches.where(winner_id: id).count
    last_month_ratio = last_month_matches.any? ? (last_month_wins.to_f / last_month_matches.count * 100).round(2) : 0

    # Calculate percentage change
    return 0 if last_month_ratio.zero? # Avoid division by zero
    ((this_month_ratio - last_month_ratio) / last_month_ratio * 100).round(2)
  end

  # Returns the highest Elo rating the user has ever achieved
  def highest_elo
    leaderboard_ratings.maximum(:rating) || 1500
  end
end
