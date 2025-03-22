import { Controller } from "@hotwired/stimulus"

/**
 * Handles toggle between "All" and "Mine" for recent match activity
 * Uses Turbo Frame + Stimulus to reload from server with different query param
 */
export default class extends Controller {
    static targets = ["allButton", "mineButton", "frame"]
    static values = {
        urlBase: String // e.g., "/matches/recent"
    }

    showAll() {
        this.#updateToggleUI(this.allButtonTarget, this.mineButtonTarget)
        this.frameTarget.src = `${this.urlBaseValue}?scope=all`
    }

    showMine() {
        this.#updateToggleUI(this.mineButtonTarget, this.allButtonTarget)
        this.frameTarget.src = `${this.urlBaseValue}?scope=mine`
    }

    #updateToggleUI(activeBtn, inactiveBtn) {
        activeBtn.classList.replace("bg-slate-700", "bg-indigo-600")
        activeBtn.setAttribute("aria-pressed", "true")
        inactiveBtn.classList.replace("bg-indigo-600", "bg-slate-700")
        inactiveBtn.setAttribute("aria-pressed", "false")
    }
}
