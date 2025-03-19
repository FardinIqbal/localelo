// app/javascript/controllers/toast_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
    static targets = ["container"]

    show(event) {
        const { message, type = "info" } = event.detail

        const toast = document.createElement("div")
        toast.className = "flex items-center mb-3 pointer-events-auto bg-slate-800/90 backdrop-blur-md rounded-lg shadow-md p-4 max-w-sm w-full border-l-4 border-white/10"
        toast.style.opacity = "0"
        toast.style.transform = "translateY(20px)"
        toast.style.transition = "opacity 0.5s ease, transform 0.5s ease"

        let iconClass = "fa-info-circle text-indigo-400"
        let borderColor = "border-indigo-500"

        if (type === "success") {
            iconClass = "fa-check-circle text-green-400"
            borderColor = "border-green-500"
        } else if (type === "error") {
            iconClass = "fa-exclamation-circle text-red-400"
            borderColor = "border-red-500"
        } else if (type === "warning") {
            iconClass = "fa-exclamation-triangle text-yellow-400"
            borderColor = "border-yellow-500"
        }

        toast.classList.add(borderColor)
        toast.innerHTML = `
      <i class="fas ${iconClass} mr-3"></i>
      <span class="flex-1 text-white">${message}</span>
      <button class="ml-2 text-white/60 hover:text-white transition-colors duration-300" data-action="toast#dismiss">
        <i class="fas fa-times"></i>
      </button>
    `

        this.containerTarget.appendChild(toast)

        // Trigger reflow
        toast.offsetHeight

        // Show toast
        toast.style.opacity = "1"
        toast.style.transform = "translateY(0)"

        // Auto hide after 3 seconds
        setTimeout(() => {
            if (toast.isConnected) {
                this.dismissToast(toast)
            }
        }, 3000)
    }

    dismiss(event) {
        const toast = event.target.closest("div")
        this.dismissToast(toast)
    }

    dismissToast(toast) {
        toast.style.opacity = "0"
        toast.style.transform = "translateY(-20px)"
        setTimeout(() => {
            if (toast.isConnected) {
                toast.remove()
            }
        }, 500)
    }
}
