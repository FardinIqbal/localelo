// Entry point for Stimulus controllers
import { application } from "./application"

// === General Controllers ===
import FlashController from "./flash_controller"
import ToastController from "./toast_controller"
import HelloController from "./hello_controller"

// === Navigation Controllers ===
import NavigationController from "./navigation_controller"
import MobileMenuController from "./mobile_menu_controller"
import ProfileDropdownController from "./profile_dropdown_controller"
import DropdownController from "./dropdown_controller"

// === Optional / Future (uncomment when needed)
// import TableController from "./table_controller"
// import TooltipController from "./tooltip_controller"
// import BottomNavController from "./bottom_nav_controller"

// Register controllers
application.register("flash", FlashController)
application.register("toast", ToastController)
application.register("hello", HelloController)

application.register("navigation", NavigationController)
application.register("mobile-menu", MobileMenuController)
application.register("profile-dropdown", ProfileDropdownController)
application.register("dropdown", DropdownController)

// Uncomment to enable these:
// application.register("table", TableController)
// application.register("tooltip", TooltipController)
// application.register("bottom-nav", BottomNavController)
