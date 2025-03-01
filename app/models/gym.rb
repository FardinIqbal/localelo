# frozen_string_literal: true

class Gym < ApplicationRecord
  has_many :players, dependent: :destroy
  has_many :matches, dependent: :destroy  # Direct relationship with matches

  validates :name, presence: true, uniqueness: true
  validates :subdomain, presence: true, uniqueness: true
end
