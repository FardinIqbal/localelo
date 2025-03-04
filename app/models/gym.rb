# frozen_string_literal: true

class Gym < ApplicationRecord
  belongs_to :user  # Gym owner (creator)

  has_many :gym_memberships, dependent: :destroy  # Tracks users in gyms
  has_many :users, through: :gym_memberships  # Many-to-many relationship with users
  has_many :matches, dependent: :destroy  # Matches belong to gyms

  validates :name, presence: true, uniqueness: true
  validates :subdomain, presence: true, uniqueness: true
end