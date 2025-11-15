import { Controller } from "@hotwired/stimulus"

// Handles organization search + visibility filtering without inline scripts.
export default class extends Controller {
  static targets = ["list", "item", "query", "visibility", "empty"]

  connect() {
    this.filter()
  }

  filter() {
    const query = this.hasQueryTarget ? this.queryTarget.value.trim().toLowerCase() : ""
    const visibility = this.hasVisibilityTarget ? this.visibilityTarget.value : ""

    let visibleCount = 0

    this.itemTargets.forEach((item) => {
      const name = item.dataset.name || ""
      const location = item.dataset.location || ""
      const itemVisibility = item.dataset.visibility || ""

      const matchesQuery = !query || name.includes(query) || location.includes(query)
      const matchesVisibility = !visibility || itemVisibility === visibility

      const isVisible = matchesQuery && matchesVisibility
      item.classList.toggle("hidden", !isVisible)
      if (isVisible) visibleCount += 1
    })

    if (this.hasEmptyTarget) {
      this.emptyTarget.classList.toggle("hidden", visibleCount > 0)
    }

    if (this.hasListTarget) {
      this.listTarget.dataset.visibleCount = visibleCount
    }
  }
}
