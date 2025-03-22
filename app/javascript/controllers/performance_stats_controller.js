import { Controller } from "@hotwired/stimulus"

/*
  performance-stats_controller.js

  PURPOSE:
  1) Animate Elo numbers from 0 (or a smaller start) to their final values.
  2) Show/hide tooltips on hover for Highest Elo / Average Elo.
  3) Toggle advanced stats section (like a chart or streak details).
  4) (Optional) Could poll or use Turbo Streams to refresh content after match verification.

  USAGE:
  In _performance_stats.html.erb:
    <div data-controller="performance-stats" ...>
      ...
    </div>
*/

export default class extends Controller {
    static targets = [
        "highestEloDisplay",
        "averageEloDisplay",
        "tooltip",
        "advanced",
    ]

    static values = {
        highestElo: Number,
        averageElo: Number,
    }

    connect() {
        // Animate the Elo displays on connect
        this.animateNumber(this.highestEloDisplayTarget, this.highestEloValue)
        this.animateNumber(this.averageEloDisplayTarget, this.averageEloValue)
    }

    // ============== ELO ANIMATION ==============
    animateNumber(element, finalValue) {
        // We start from zero, or from 80% of final as a quick example
        let currentValue = Math.floor(finalValue * 0.8)
        if (currentValue < 0) currentValue = 0

        const duration = 1500      // ms total animation time
        const interval = 30        // ms per update
        const steps = duration / interval
        const increment = (finalValue - currentValue) / steps

        const timer = setInterval(() => {
            currentValue += increment
            if ((increment > 0 && currentValue >= finalValue) ||
                (increment < 0 && currentValue <= finalValue)) {
                currentValue = finalValue
                clearInterval(timer)
            }
            element.textContent = Math.round(currentValue)
        }, interval)
    }

    // ============== TOOLTIP HANDLERS ==============
    showTooltip(e) {
        const tooltipTarget = this.tooltipTargets.find(
            (t) => t !== null && t.offsetParent === e.currentTarget.offsetParent
        )
        if (!tooltipTarget) return

        // The data attribute 'performance-stats-tooltip-content-value'
        // is on the element that triggered 'mouseenter'
        const content = e.currentTarget.dataset.performanceStatsTooltipContentValue

        tooltipTarget.textContent = content || "Info not provided."
        tooltipTarget.classList.remove("hidden")
    }

    hideTooltip(e) {
        const tooltipTarget = this.tooltipTargets.find(
            (t) => t !== null && t.offsetParent === e.currentTarget.offsetParent
        )
        if (tooltipTarget) {
            tooltipTarget.classList.add("hidden")
        }
    }

    // ============== ADVANCED STATS TOGGLE ==============
    toggleAdvanced() {
        if (!this.hasAdvancedTarget) return
        if (this.advancedTarget.classList.contains("hidden")) {
            this.advancedTarget.classList.remove("hidden")
        } else {
            this.advancedTarget.classList.add("hidden")
        }
    }
}
