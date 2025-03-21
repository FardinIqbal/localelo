import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
    static targets = ["message"]

    connect() {
        this.messageTargets.forEach((el) => {
            setTimeout(() => this.fadeOut(el), 5000)
        })
    }

    close(event) {
        const el = event.target.closest(".flash-message")
        if (el) this.fadeOut(el)
    }

    fadeOut(el) {
        el.classList.remove("opacity-100", "translate-y-0")
        el.classList.add("opacity-0", "-translate-y-2")
        setTimeout(() => el.remove(), 500)
    }
}
