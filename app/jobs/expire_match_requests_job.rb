class ExpireMatchRequestsJob < ApplicationJob
  queue_as :default

  def perform
    MatchRequest.expire_old_requests
  end
end
