// app/javascript/controllers/dropdown_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
    static targets = ["menu"]

    connect() {
        this.boundOutsideClick = this.handleOutsideClick.bind(this)
    }

    disconnect() {
        document.removeEventListener("click", this.boundOutsideClick)
    }

    toggle() {
        if (this.menuTarget.classList.contains("hidden")) {
            this.open()
        } else {
            this.close()
        }
    }

    open() {
        this.menuTarget.classList.remove("hidden", "scale-95", "opacity-0")
        this.menuTarget.classList.add("scale-100", "opacity-100")

        // Add outside click handler with slight delay
        setTimeout(() => {
            document.addEventListener("click", this.boundOutsideClick)
        }, 10)
    }

    close() {
        this.menuTarget.classList.remove("scale-100", "opacity-100")
        this.menuTarget.classList.add("scale-95", "opacity-0")

        // Hide after animation completes
        setTimeout(() => {
            this.menuTarget.classList.add("hidden")
        }, 150)

        document.removeEventListener("click", this.boundOutsideClick)
    }

    handleOutsideClick(event) {
        if (!this.element.contains(event.target)) {
            this.close()
        }
    }
}
