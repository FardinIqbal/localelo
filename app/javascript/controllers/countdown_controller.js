// app/javascript/controllers/countdown_controller.js

import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
    static values = { time: String }

    connect() {
        this.targetTime = new Date(this.element.dataset.countdownTime)
        this.updateCountdown()
        this.interval = setInterval(() => this.updateCountdown(), 1000)
    }

    disconnect() {
        if (this.interval) clearInterval(this.interval)
    }

    updateCountdown() {
        const now = new Date()
        const diff = this.targetTime - now

        if (diff <= 0) {
            this.element.textContent = "Starting now!"
            clearInterval(this.interval)
            return
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)

        if (days > 0) {
            this.element.textContent = `${days}d ${hours}h ${minutes}m`
        } else if (hours > 0) {
            this.element.textContent = `${hours}h ${minutes}m ${seconds}s`
        } else {
            this.element.textContent = `${minutes}m ${seconds}s`
        }
    }
}
