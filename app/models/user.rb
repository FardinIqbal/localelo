class User < ApplicationRecord
  # Include default Devise modules for authentication and user management.
  # - `database_authenticatable` → Encrypts and stores passwords securely.
  # - `registerable` → Allows users to sign up and edit their accounts.
  # - `recoverable` → Enables password resets via email.
  # - `rememberable` → Supports "remember me" functionality for persistent sessions.
  # - `validatable` → Provides built-in email and password validation.
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  # Associations
  # -----------------

  # A user can belong to multiple organizations (gyms, clubs, etc.).
  # The `organization_memberships` table acts as the join table.
  has_many :organization_memberships, dependent: :destroy
  has_many :organizations, through: :organization_memberships

  # A user can be part of multiple leaderboards.
  has_many :leaderboard_ratings, dependent: :destroy
  has_many :leaderboards, through: :leaderboard_ratings

  # Matches where the user is one of the competitors.
  has_many :matches_as_user1, class_name: "Match", foreign_key: "user1_id", dependent: :destroy
  has_many :matches_as_opponent, class_name: "Match", foreign_key: "opponent_id", dependent: :destroy

  # Matches where the user was declared the winner.
  has_many :matches_won, class_name: "Match", foreign_key: "winner_id", dependent: :nullify

  # Validations
  # -----------------

  # Ensure every user has a unique email.
  validates :email, presence: true, uniqueness: true

  # Ensure every user has a unique username.
  validates :username, presence: true, uniqueness: true

  # Ensure first and last names are provided (for better identification in leaderboards).
  validates :first_name, presence: true
  validates :last_name, presence: true

  # Scopes
  # -----------------

  # Retrieves users ordered by their creation date (newest first).
  scope :recent, -> { order(created_at: :desc) }

  # Instance Methods
  # -----------------

  # Returns the full name of a user for display purposes.
  # Example: "John Doe"
  def full_name
    "#{first_name} #{last_name}"
  end

  # Checks if the user is a member of a specific organization.
  # Useful for access control in views and controllers.
  def member_of?(organization)
    organizations.exists?(organization.id)
  end

  # Finds a user's Elo rating for a specific leaderboard.
  # Returns 1500 (default Elo) if no rating exists.
  def elo_for(leaderboard)
    leaderboard_ratings.find_by(leaderboard: leaderboard)&.rating || 1500
  end

  # Returns the total number of matches played by a user.
  def total_matches
    matches_as_user1.count + matches_as_opponent.count
  end

  # Returns the total number of matches won.
  def total_wins
    matches_won.count
  end

  # Returns the total number of matches lost.
  def total_losses
    total_matches - total_wins
  end

  # Returns the win percentage (avoiding division by zero).
  def win_percentage
    total_matches > 0 ? (total_wins.to_f / total_matches * 100).round(2) : 0
  end
end
