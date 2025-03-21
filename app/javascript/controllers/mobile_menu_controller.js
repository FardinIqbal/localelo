import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
    static targets = ["container"]

    connect() {
        this.boundCloseOnOutsideClick = this.closeOnOutsideClick.bind(this)
    }

    open() {
        this.element.classList.remove("hidden")
        requestAnimationFrame(() => {
            this.containerTarget.classList.remove("-translate-x-full")
        })
        document.addEventListener("click", this.boundCloseOnOutsideClick)
    }

    close() {
        this.containerTarget.classList.add("-translate-x-full")
        setTimeout(() => {
            this.element.classList.add("hidden")
        }, 300)
        document.removeEventListener("click", this.boundCloseOnOutsideClick)
    }

    closeOnOutsideClick(event) {
        if (!this.containerTarget.contains(event.target)) {
            this.close()
        }
    }
}
