// app/javascript/controllers/mobile_menu_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
    static targets = ["menu", "button", "icon", "container"]

    connect() {
        // Initialize the mobile menu in closed state
        this.close()
    }

    toggle(event) {
        event.stopPropagation()
        if (this.menuTarget.classList.contains("hidden")) {
            this.open()
        } else {
            this.close()
        }
    }

    open() {
        // Show the menu
        this.menuTarget.classList.remove("hidden")

        // Reset styles for animation
        this.menuTarget.style.opacity = "0"
        this.menuTarget.style.transform = "translateY(-10px)"

        // Trigger reflow
        this.menuTarget.offsetHeight

        // Animate in
        this.menuTarget.style.opacity = "1"
        this.menuTarget.style.transform = "translateY(0)"

        // Toggle icon
        if (this.hasIconTarget) {
            this.iconTarget.classList.remove("fa-bars")
            this.iconTarget.classList.add("fa-times")
        }
    }

    close() {
        // Animate out
        this.menuTarget.style.opacity = "0"
        this.menuTarget.style.transform = "translateY(-10px)"

        // Toggle icon
        if (this.hasIconTarget) {
            this.iconTarget.classList.remove("fa-times")
            this.iconTarget.classList.add("fa-bars")
        }

        // Hide after transition
        setTimeout(() => {
            this.menuTarget.classList.add("hidden")
        }, 300)
    }

    closeIfOutside(event) {
        if (this.hasContainerTarget && !this.containerTarget.contains(event.target) &&
            !this.buttonTarget.contains(event.target)) {
            this.close()
        }
    }

    closeOnNavigation() {
        this.close()
    }
}
