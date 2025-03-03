# frozen_string_literal: true

class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  has_many :gym_memberships, dependent: :destroy  # Tracks user-gym relationships
  has_many :gyms, through: :gym_memberships  # Users can join multiple gyms

  validates :email, presence: true, uniqueness: true
end
