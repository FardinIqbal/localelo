// app/javascript/controllers/navigation_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
    static targets = ["navbar", "bottomNav"]

    connect() {
        this.handleNavbarScroll()
        this.setActiveLinks()

        // Add scroll listener with passive option for performance
        window.addEventListener("scroll", this.handleScroll.bind(this), { passive: true })
    }

    disconnect() {
        window.removeEventListener("scroll", this.handleScroll.bind(this))
    }

    handleScroll() {
        this.handleNavbarScroll()
        this.handleBottomNavScroll()
    }

    handleNavbarScroll() {
        if (window.scrollY > 10) {
            this.navbarTarget.classList.add("shadow-lg", "shadow-purple-500/5")
        } else {
            this.navbarTarget.classList.remove("shadow-lg", "shadow-purple-500/5")
        }
    }

    handleBottomNavScroll() {
        if (!this.hasBottomNavTarget) return

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop
        const scrollThreshold = 20

        if (Math.abs(this.lastScrollTop - scrollTop) <= scrollThreshold) return

        if (scrollTop > this.lastScrollTop && scrollTop > 100) {
            this.bottomNavTarget.classList.add("translate-y-full")
        } else {
            this.bottomNavTarget.classList.remove("translate-y-full")
        }

        this.lastScrollTop = scrollTop <= 0 ? 0 : scrollTop
    }

    setActiveLinks() {
        const currentPath = window.location.pathname

        // Set active state for all navigation links
        document.querySelectorAll(".nav-link").forEach(link => {
            const href = link.getAttribute("href")
            if (href === currentPath) {
                link.classList.add("font-medium", "text-indigo-500")
            } else {
                link.classList.remove("font-medium", "text-indigo-500")
            }
        })

        // Mobile nav items
        document.querySelectorAll(".mobile-nav-item").forEach(link => {
            const href = link.getAttribute("href")
            if (href === currentPath) {
                link.classList.add("bg-slate-700/50", "text-pink-500")
            } else {
                link.classList.remove("bg-slate-700/50", "text-pink-500")
            }
        })

        // Bottom nav
        document.querySelectorAll(".mobile-nav-button").forEach(btn => {
            const href = btn.getAttribute("href")
            if (href === currentPath) {
                btn.classList.add("text-pink-500")
            } else {
                btn.classList.remove("text-pink-500")
            }
        })
    }

    initialize() {
        this.lastScrollTop = 0
    }
}
