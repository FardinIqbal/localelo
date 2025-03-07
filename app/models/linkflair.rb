class Linkflair < ApplicationRecord
  # Associations
  belongs_to :sport_type
  belongs_to :match

  # Ensure every flair has a category, name, and is tied to a sport
  validates :category, presence: true
  validates :name, presence: true, uniqueness: { scope: [:sport_type_id, :category] }
  validates :usage_count, numericality: { only_integer: true, greater_than_or_equal_to: 1 }
end
