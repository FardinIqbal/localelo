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
import ContextSwitcherController from "./context_switcher_controller"
import ThemeController from "./theme_controller"

// === Dashboard / Stats Controllers ===
import GreetingController from "./greeting_controller"
import StatsCardController from "./stats_card_controller"
import CountdownController from "./countdown_controller"
import PerformanceStatsController from "./performance_stats_controller"
import OrganizationTabsController from "./organization_tabs_controller"
import OrganizationSearchController from "./organization_search_controller"

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
application.register("context-switcher", ContextSwitcherController)
application.register("theme", ThemeController)

// Register dashboard-specific controllers
application.register("greeting", GreetingController)
application.register("stats-card", StatsCardController)
application.register("countdown", CountdownController)
application.register("performance-stats", PerformanceStatsController)
application.register("organization-tabs", OrganizationTabsController)
application.register("organization-search", OrganizationSearchController)

// Uncomment to enable these:
// application.register("table", TableController)
// application.register("tooltip", TooltipController)
// application.register("bottom-nav", BottomNavController)

import PollController from "./poll_controller"
application.register("poll", PollController)
import ToggleController from "./toggle_controller"

application.register("toggle", ToggleController)
