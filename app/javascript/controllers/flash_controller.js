// app/javascript/controllers/flash_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
    connect() {
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            this.dismiss()
        }, 5000)
    }

    dismiss() {
        this.element.style.opacity = "0"
        setTimeout(() => {
            this.element.remove()
        }, 500)
    }

    close() {
        this.dismiss()
    }
}
