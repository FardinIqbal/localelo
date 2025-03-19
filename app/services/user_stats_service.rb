class UserStatsService
  def initialize(user)
    @user = user
  end

  def calculate
    {
      total_matches: @user.total_matches,
      total_wins: @user.total_wins,
      total_losses: @user.total_losses,
      win_percentage: @user.win_percentage,
      highest_elo: @user.highest_elo,
      win_loss_ratio: @user.win_loss_ratio,
      win_ratio_trend: @user.win_ratio_trend
    }
  end
end
