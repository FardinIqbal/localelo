import { Controller } from "@hotwired/stimulus"

// Lightweight filtering for the matches index page.
export default class extends Controller {
  static targets = ["item", "empty", "query", "leaderboard", "timeframe"]

  connect() {
    this.filter()
  }

  filter() {
    const query = this.hasQueryTarget ? this.queryTarget.value.trim().toLowerCase() : ""
    const leaderboardFilter = this.hasLeaderboardTarget ? this.leaderboardTarget.value : "all"
    const timeFilter = this.hasTimeframeTarget ? this.timeframeTarget.value : "all"

    const now = new Date()
    let visibleCount = 0

    this.itemTargets.forEach((item) => {
      const opponent = (item.dataset.opponent || "").toLowerCase()
      const leaderboardId = item.dataset.leaderboardId || ""
      const leaderboardName = (item.dataset.leaderboardName || "").toLowerCase()
      const playedAt = item.dataset.playedAt

      const matchesQuery = !query || opponent.includes(query) || leaderboardName.includes(query)
      const matchesLeaderboard = leaderboardFilter === "all" || leaderboardId === leaderboardFilter
      const matchesTime = this.matchesTimeFilter(timeFilter, playedAt, now)

      const isVisible = matchesQuery && matchesLeaderboard && matchesTime
      item.classList.toggle("hidden", !isVisible)
      if (isVisible) visibleCount += 1
    })

    if (this.hasEmptyTarget) {
      this.emptyTarget.classList.toggle("hidden", visibleCount > 0)
    }
  }

  matchesTimeFilter(filter, playedAt, now) {
    if (filter === "all" || !playedAt) return true

    const playedDate = new Date(playedAt)
    if (Number.isNaN(playedDate.getTime())) return true

    if (filter === "month") {
      return (
        playedDate.getUTCFullYear() === now.getUTCFullYear() &&
        playedDate.getUTCMonth() === now.getUTCMonth()
      )
    }

    if (filter === "week") {
      const diff = now.getTime() - playedDate.getTime()
      const sevenDays = 7 * 24 * 60 * 60 * 1000
      return diff <= sevenDays && diff >= 0
    }

    if (filter === "today") {
      return (
        playedDate.getUTCFullYear() === now.getUTCFullYear() &&
        playedDate.getUTCMonth() === now.getUTCMonth() &&
        playedDate.getUTCDate() === now.getUTCDate()
      )
    }

    return true
  }
}
