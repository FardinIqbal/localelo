import { Controller } from "@hotwired/stimulus"
import { Turbo } from "@hotwired/turbo-rails"

export default class extends Controller {
  connect() {
    this.setInitialSelection()
  }

  switch(event) {
    const selectedValue = event.target.value
    const url = new URL(window.location.href)

    if (!selectedValue || selectedValue === "all") {
      url.searchParams.delete("organization_id")
    } else {
      url.searchParams.set("organization_id", selectedValue)
    }

    Turbo.visit(url.toString())
  }

  setInitialSelection() {
    const url = new URL(window.location.href)
    const organizationId = url.searchParams.get("organization_id")

    if (organizationId) {
      this.element.value = organizationId
    } else {
      this.element.value = "all"
    }
  }
}
