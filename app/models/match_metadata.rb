class MatchMetadata < ApplicationRecord
  # Associations
  belongs_to :match

  # Store sport-specific metadata as JSON
  serialize :data, JSON

  # Validation: Ensure metadata is present
  validates :data, presence: true
end
