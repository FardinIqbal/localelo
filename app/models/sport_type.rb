class SportType < ApplicationRecord
  # Each sport type can have a structured metadata template
  serialize :metadata_template, JSON

  # Associations
  has_many :leaderboards
  has_many :linkflairs

  # Ensure sport names are unique (e.g., "BJJ", "Chess", "Table Tennis")
  validates :name, presence: true, uniqueness: true
end
