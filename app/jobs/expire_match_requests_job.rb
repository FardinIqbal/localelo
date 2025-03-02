class ExpireMatchRequestsJob < ApplicationJob
  queue_as :default

  def perform
    # Expire match requests that are still pending and past their expiry time
    MatchRequest.where("expires_at < ? AND status = ?", Time.current, "pending").find_each do |match_request|
      match_request.update(status: "expired")

      # Create notification for challenger
      Notification.create!(
        user: match_request.challenger.user,
        notifiable: match_request,
        message: "Your match request with #{match_request.opponent.user.email} has expired."
      )
      # Create notification for opponent
      Notification.create!(
        user: match_request.opponent.user,
        notifiable: match_request,
        message: "Match request from #{match_request.challenger.user.email} has expired."
      )
    end
  end
end
