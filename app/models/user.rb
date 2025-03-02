# frozen_string_literal: true

class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  has_many :players, dependent: :destroy
  has_many :gyms, through: :players
  has_many :notifications, dependent: :destroy


  validates :email, presence: true, uniqueness: true
end
