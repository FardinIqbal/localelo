import { Controller } from "@hotwired/stimulus"

/**
 * MobileMenuController
 *
 * Controls the behavior of the mobile slideout menu with enhanced animations
 * and improved user experience.
 */
export default class extends Controller {
    static targets = ["menu", "overlay"]

    connect() {
        // Bind methods to avoid rebinding event listeners
        this.boundOutsideClick = this.handleOutsideClick.bind(this)
        this.boundEscapeKey = this.handleEscapeKey.bind(this)

        // Add swipe detection for closing menu
        this.touchStartX = 0
        this.touchEndX = 0
        this.menuTarget.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true })
        this.menuTarget.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false })
        this.menuTarget.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true })
    }

    disconnect() {
        // Clean up event listeners when controller disconnects
        document.removeEventListener("click", this.boundOutsideClick)
        document.removeEventListener("keydown", this.boundEscapeKey)
    }

    /**
     * Open the menu with enhanced animations
     */
    open() {
        // Prevent scrolling on body
        document.body.classList.add('overflow-hidden')

        // Show overlay with fade-in
        this.overlayTarget.classList.remove("hidden")

        // Trigger reflow to ensure transition works
        void this.overlayTarget.offsetWidth

        // Add opacity for fade-in effect
        this.overlayTarget.classList.add("opacity-100")
        this.overlayTarget.classList.remove("opacity-0")

        // Slide in menu with slight delay for better visual effect
        setTimeout(() => {
            this.menuTarget.classList.remove("-translate-x-full")

            // Add event listeners after animation starts
            setTimeout(() => {
                document.addEventListener("click", this.boundOutsideClick)
                document.addEventListener("keydown", this.boundEscapeKey)
            }, 100)
        }, 50)
    }

    /**
     * Close the menu with smooth animations
     */
    close() {
        // Slide out menu
        this.menuTarget.classList.add("-translate-x-full")

        // Fade out overlay
        this.overlayTarget.classList.remove("opacity-100")
        this.overlayTarget.classList.add("opacity-0")

        // Hide overlay and re-enable scrolling after animation completes
        setTimeout(() => {
            this.overlayTarget.classList.add("hidden")
            document.body.classList.remove('overflow-hidden')
        }, 300)

        // Remove event listeners
        document.removeEventListener("click", this.boundOutsideClick)
        document.removeEventListener("keydown", this.boundEscapeKey)
    }

    /**
     * Handle clicks outside the menu
     */
    handleOutsideClick(event) {
        // Don't close if clicking inside the menu
        if (this.menuTarget.contains(event.target)) return

        // Don't close if clicking the toggle button
        if (event.target.closest("[data-action='click->mobile-menu#open']")) return

        this.close()
    }

    /**
     * Close menu when Escape key is pressed
     */
    handleEscapeKey(event) {
        if (event.key === "Escape") {
            this.close()
        }
    }

    /**
     * Touch handlers for swipe-to-close functionality
     */
    handleTouchStart(event) {
        this.touchStartX = event.touches[0].clientX
    }

    handleTouchMove(event) {
        this.touchEndX = event.touches[0].clientX

        // Calculate distance swiped
        const diffX = this.touchStartX - this.touchEndX

        // If swiping left (to close), prevent default to avoid page scrolling
        if (diffX > 10) {
            event.preventDefault()
        }
    }

    handleTouchEnd() {
        // Calculate swipe distance
        const diffX = this.touchStartX - this.touchEndX

        // If swiped left far enough, close the menu
        if (diffX > 70) {
            this.close()
        }
    }
}
