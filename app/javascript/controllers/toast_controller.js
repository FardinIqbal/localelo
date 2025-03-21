import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
    connect() {
        window.showToast = this.show.bind(this)
    }

    show(message, type = "info") {
        const toast = document.createElement("div")
        toast.className = `
      flex items-center mb-3 pointer-events-auto
      bg-slate-800/90 backdrop-blur-md rounded-lg shadow-md p-4 max-w-sm w-full
      border-l-4 transition-all duration-500 transform translate-y-4 opacity-0
    `

        // Icon and border styles
        let icon = "fas fa-info-circle text-indigo-400"
        let border = "border-indigo-500"
        if (type === "success") {
            icon = "fas fa-check-circle text-green-400"
            border = "border-green-500"
        } else if (type === "error") {
            icon = "fas fa-exclamation-circle text-red-400"
            border = "border-red-500"
        } else if (type === "warning") {
            icon = "fas fa-exclamation-triangle text-yellow-400"
            border = "border-yellow-500"
        }

        toast.classList.add(border)

        toast.innerHTML = `
      <i class="${icon} mr-3"></i>
      <span class="flex-1 text-white">${message}</span>
      <button class="ml-2 text-white/60 hover:text-white transition-colors duration-300">
        <i class="fas fa-times"></i>
      </button>
    `

        this.element.appendChild(toast)

        // Trigger reflow to apply transition
        requestAnimationFrame(() => {
            toast.classList.remove("translate-y-4", "opacity-0")
            toast.classList.add("translate-y-0", "opacity-100")
        })

        // Remove toast after 3 seconds
        setTimeout(() => this.removeToast(toast), 3000)

        // Manual close
        toast.querySelector("button")?.addEventListener("click", () => {
            this.removeToast(toast)
        })
    }

    removeToast(toast) {
        toast.classList.remove("opacity-100", "translate-y-0")
        toast.classList.add("opacity-0", "-translate-y-4")
        setTimeout(() => toast.remove(), 500)
    }
}
