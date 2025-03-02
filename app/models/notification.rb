class Notification < ApplicationRecord
  belongs_to :user
  belongs_to :notifiable, polymorphic: true

  scope :unread, -> { where(read: false) }
  scope :read, -> { where(read: true) }

  def mark_as_read!
    update!(read: true)
  end
end
