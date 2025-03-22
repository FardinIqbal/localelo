import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
    static values = {
        url: String,
        interval: Number
    }

    connect() {
        this.startPolling()
    }

    disconnect() {
        this.stopPolling()
    }

    startPolling() {
        this.poll()
        this.interval = setInterval(() => this.poll(), this.intervalValue || 30000)
    }

    stopPolling() {
        if (this.interval) {
            clearInterval(this.interval)
        }
    }

    async poll() {
        const response = await fetch(this.urlValue, {
            headers: { Accept: "text/vnd.turbo-stream.html" }
        })

        if (response.ok) {
            const html = await response.text()
            Turbo.renderStreamMessage(html)
        }
    }
}
