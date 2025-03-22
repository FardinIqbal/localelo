// app/javascript/controllers/stats_card_controller.js
/**
 * Stats Card Controller
 *
 * Provides animated visual effects for statistics cards to improve user engagement.
 *
 * Features:
 * - Animated counting effect for rank numbers
 * - Subtle pulsing animation for streak indicators
 * - Smooth transitions and visual feedback
 *
 * Usage:
 * <div data-controller="stats-card">
 *   <p data-stats-card-target="rankNumber" data-rank="5">#5</p>
 *   <span data-stats-card-target="flame" class="inline-block">🔥</span>
 * </div>
 */

import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
    static targets = ["rankNumber", "flame"]

    connect() {
        if (this.hasFlameTarget) {
            this.animateFlame()
        }

        if (this.hasRankNumberTarget) {
            const rank = parseInt(this.rankNumberTarget.dataset.rank)
            this.animateNumber(rank)
        }
    }

    animateFlame() {
        // Subtle pulse effect for visual engagement
        setInterval(() => {
            this.flameTarget.classList.add("scale-110")
            setTimeout(() => {
                this.flameTarget.classList.remove("scale-110")
            }, 500)
        }, 2000)
    }

    animateNumber(finalNumber) {
        // Animated count-down effect for rank numbers
        let start = Math.max(finalNumber + 10, finalNumber * 2)
        let current = start
        const duration = 1500
        const interval = 30
        const steps = duration / interval
        const decrement = (start - finalNumber) / steps

        const timer = setInterval(() => {
            current -= decrement
            if (current <= finalNumber) {
                current = finalNumber
                clearInterval(timer)
            }
            this.rankNumberTarget.textContent = `#${Math.round(current)}`
        }, interval)
    }
}
