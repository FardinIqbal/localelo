class NotificationsController < ApplicationController
  before_action :authenticate_user!

  # Action to mark a notification as read
  def mark_as_read
    @notification = current_user.notifications.find(params[:id])

    if @notification.update(read: true)
      redirect_back(fallback_location: root_path, notice: "Notification marked as read.")
    else
      redirect_back(fallback_location: root_path, alert: "Failed to mark notification as read.")
    end
  end
end
