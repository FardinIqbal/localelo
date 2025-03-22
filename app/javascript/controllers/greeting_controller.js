// app/javascript/controllers/greeting_controller.js

import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
    static targets = ["headline", "tagline", "quote"]
    static values = {
        quotes: Array,
        refreshInterval: { type: Number, default: 30000 } // 30 seconds
    }

    connect() {
        this.updateGreeting()

        // Show elements with animation
        setTimeout(() => {
            this.headlineTarget.classList.remove("opacity-0", "-translate-y-4")
            this.taglineTarget.classList.remove("opacity-0", "-translate-y-4")
            this.quoteTarget.classList.remove("opacity-0", "-translate-y-4")
        }, 100)

        // Load and rotate quote
        this.updateQuote()
        this.quoteInterval = setInterval(() => {
            this.updateQuote()
        }, this.refreshIntervalValue)
    }

    disconnect() {
        if (this.quoteInterval) clearInterval(this.quoteInterval)
    }

    updateGreeting() {
        const hour = new Date().getHours()
        let timeOfDay = ""

        if (hour < 12) {
            timeOfDay = "Good morning"
        } else if (hour < 18) {
            timeOfDay = "Good afternoon"
        } else {
            timeOfDay = "Good evening"
        }

        const name = this.element.dataset.greetingUserName || "champ"
        this.headlineTarget.textContent = `${timeOfDay}, ${name}!`
    }

    updateQuote() {
        const quotes = [
            "The only competition that matters is the one against yourself.",
            "Every match is a chance to learn and improve.",
            "Champions are made when nobody's watching.",
            "Your next win is just one match away.",
            "Progress over perfection. Keep climbing.",
            "The leaderboard is waiting for you to make your move."
        ]
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]

        // Fade out and update quote
        this.quoteTarget.classList.add("opacity-0")
        setTimeout(() => {
            this.quoteTarget.textContent = randomQuote
            this.quoteTarget.classList.remove("opacity-0")
        }, 300)
    }
}
