// app/javascript/controllers/index.js
import { application } from "./application"

// Import your controllers
import MobileMenuController from "./mobile_menu_controller"
import FlashController from "./flash_controller"
import NavigationController from "./navigation_controller"
import ToastController from "./toast_controller"

// Register controllers
application.register("mobile-menu", MobileMenuController)
application.register("flash", FlashController)
application.register("navigation", NavigationController)
application.register("toast", ToastController)

// Register global toast function
window.showToast = function(message, type = 'info') {
    const event = new CustomEvent('toast:show', {
        detail: { message, type }
    })
    document.getElementById('toast-container').dispatchEvent(event)
}

// Add event listener for toast:show events
document.addEventListener('DOMContentLoaded', () => {
    const toastContainer = document.getElementById('toast-container')
    if (toastContainer) {
        toastContainer.addEventListener('toast:show', (event) => {
            const controller = application.getControllerForElementAndIdentifier(
                toastContainer, 'toast'
            )
            if (controller) {
                controller.show(event)
            }
        })
    }
})
