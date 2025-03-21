import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
    static targets = ["mainContent"]

    connect() {
        this.revealMain()
    }

    revealMain() {
        if (this.hasMainContentTarget) {
            this.mainContentTarget.classList.remove("opacity-0", "translate-y-4")
            this.mainContentTarget.classList.add("opacity-100", "translate-y-0")
        }
    }
}
