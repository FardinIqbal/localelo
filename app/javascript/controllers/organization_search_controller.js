import { Controller } from "@hotwired/stimulus"

/**
 * OrganizationSearchController
 * 
 * Handles search and filter functionality for the organizations index page.
 * Provides real-time filtering as users type or change filter selections.
 */
export default class extends Controller {
  static targets = ["searchInput", "visibilityFilter", "organizationItem", "noResults"]

  connect() {
    // Initial filter on connect
    this.filter()
  }

  filter() {
    const query = this.hasSearchInputTarget 
      ? this.searchInputTarget.value.toLowerCase().trim() 
      : ""
    const visibilityFilter = this.hasVisibilityFilterTarget 
      ? this.visibilityFilterTarget.value.toLowerCase() 
      : ""

    let visibleCount = 0

    // Get all organization items
    const items = this.hasOrganizationItemTarget 
      ? this.organizationItemTargets 
      : this.element.querySelectorAll('.organization-item')

    items.forEach((item) => {
      const name = item.dataset.name || ""
      const location = item.dataset.location || ""
      const visibility = item.dataset.visibility || ""

      const matchesQuery = name.includes(query) || location.includes(query)
      const matchesVisibility = visibilityFilter === "" || visibility === visibilityFilter

      if (matchesQuery && matchesVisibility) {
        item.style.display = "block"
        visibleCount++
      } else {
        item.style.display = "none"
      }
    })

    // Show/hide no results message
    if (this.hasNoResultsTarget) {
      if (visibleCount === 0 && items.length > 0) {
        this.noResultsTarget.classList.remove("hidden")
        this.noResultsTarget.style.display = "block"
      } else {
        this.noResultsTarget.classList.add("hidden")
        this.noResultsTarget.style.display = "none"
      }
    }
  }

  // Debounced search for better performance on typing
  search() {
    // Clear existing timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout)
    }

    // Debounce the search
    this.searchTimeout = setTimeout(() => {
      this.filter()
    }, 150)
  }
}
