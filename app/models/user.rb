# frozen_string_literal: true

class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  has_many :gym_memberships, dependent: :destroy
  has_many :gyms, through: :gym_memberships
  has_many :matches_as_user1, class_name: "Match", foreign_key: "user1_id", dependent: :destroy
  has_many :matches_as_opponent, class_name: "Match", foreign_key: "opponent_id", dependent: :destroy
  has_many :matches_won, class_name: "Match", foreign_key: "winner_id", dependent: :destroy

  validates :email, presence: true, uniqueness: true
  validates :first_name, :last_name, presence: true

  def full_name
    "#{first_name} #{last_name}"
  end

  def all_matches
    Match.where("user1_id = ? OR opponent_id = ?", id, id)
  end

  def win_count
    matches_won.count
  end

  def loss_count
    all_matches.count - win_count
  end

  def win_rate
    all_matches.count.positive? ? ((win_count.to_f / all_matches.count) * 100).round : 0
  end

  # Fetch the highest Elo from user's matches
  def highest_elo
    all_matches.maximum(:elo_change) || 1500
  end

  # Calculate Elo gain in last 30 days
  def elo_gain_last_30_days
    all_matches.where("match_time >= ?", 30.days.ago).sum(:elo_change).to_i
  end
end
