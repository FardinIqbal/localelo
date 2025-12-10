import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [
    "button",
    "content",
    "memberSearch",
    "memberStatusFilter",
    "memberRow",
    "matchLeaderboardFilter",
    "matchRow"
  ]

  connect() {
    // Initialize tabs - this ensures the correct tab is shown
    // Use requestAnimationFrame to ensure DOM is fully ready
    requestAnimationFrame(() => {
      this.showInitialTab()
    })
  }

  changeTab(event) {
    event.preventDefault()
    event.stopPropagation()
    const targetId = event.currentTarget.dataset.tabsTarget
    if (!targetId) return

    // Get all buttons and content - use targets if available, otherwise querySelector
    const buttons = this.hasButtonTarget ? this.buttonTargets : this.element.querySelectorAll('[data-organization-tabs-target="button"]')
    const contents = this.hasContentTarget ? this.contentTargets : this.element.querySelectorAll('[data-organization-tabs-target="content"]')

    // Hide all tab contents
    contents.forEach((content) => {
      content.classList.add("hidden")
      content.classList.remove("block")
    })

    // Remove active state from all buttons
    buttons.forEach((btn) => {
      btn.classList.remove("active", "text-purple-400", "border-purple-500")
      btn.classList.add("border-transparent")
    })

    // Show the selected tab content
    const targetEl = document.getElementById(targetId)
    if (targetEl) {
      targetEl.classList.remove("hidden")
      targetEl.classList.add("block")
    }

    // Add active state to clicked button
    event.currentTarget.classList.add("active", "text-purple-400", "border-purple-500")
    event.currentTarget.classList.remove("border-transparent")
  }

  filterMembersSearch(event) {
    const term = event.currentTarget.value.toLowerCase()
    const rows = this.hasMemberRowTarget ? this.memberRowTargets : this.element.querySelectorAll('[data-organization-tabs-target="memberRow"]')
    rows.forEach((row) => {
      const usernameEl = row.querySelector("td:first-child .text-white")
      const username = usernameEl ? usernameEl.textContent.toLowerCase() : ""
      row.style.display = username.includes(term) ? "" : "none"
    })
  }

  filterMembersStatus(event) {
    const status = event.currentTarget.value
    const rows = this.hasMemberRowTarget ? this.memberRowTargets : this.element.querySelectorAll('[data-organization-tabs-target="memberRow"]')
    rows.forEach((row) => {
      const statusEl = row.querySelector("td:nth-child(2) span")
      const memberStatus = statusEl ? statusEl.textContent.toLowerCase() : ""
      if (status === "all" || memberStatus === status) {
        row.style.display = ""
      } else {
        row.style.display = "none"
      }
    })
  }

  filterMatches(event) {
    const leaderboardId = event.currentTarget.value
    const selectedName =
      leaderboardId === "all"
        ? null
        : event.currentTarget.querySelector(`option[value="${leaderboardId}"]`)?.textContent?.trim()

    const rows = this.hasMatchRowTarget ? this.matchRowTargets : this.element.querySelectorAll('[data-organization-tabs-target="matchRow"]')
    rows.forEach((row) => {
      if (!selectedName) {
        row.style.display = ""
        return
      }
      const leaderboardName = row.querySelector("td:nth-child(2)")?.textContent?.trim()
      row.style.display = leaderboardName === selectedName ? "" : "none"
    })
  }

  showInitialTab() {
    // Get buttons and content - use targets if available, otherwise querySelector
    const buttons = this.hasButtonTarget ? Array.from(this.buttonTargets) : Array.from(this.element.querySelectorAll('[data-organization-tabs-target="button"]'))
    const contents = this.hasContentTarget ? Array.from(this.contentTargets) : Array.from(this.element.querySelectorAll('[data-organization-tabs-target="content"]'))
    
    if (buttons.length === 0 || contents.length === 0) return

    // Find the active button or default to first
    const activeButton = buttons.find((btn) => btn.classList.contains("active")) || buttons[0]
    if (!activeButton) return

    // Get the target ID from the button's data attribute
    const targetId = activeButton.dataset.tabsTarget
    if (!targetId) return

    // Hide all content
    contents.forEach((content) => {
      content.classList.add("hidden")
      content.classList.remove("block")
    })

    // Remove active state from all buttons
    buttons.forEach((btn) => {
      btn.classList.remove("active", "text-purple-400", "border-purple-500")
      btn.classList.add("border-transparent")
    })

    // Show the target content
    const targetEl = document.getElementById(targetId)
    if (targetEl) {
      targetEl.classList.remove("hidden")
      targetEl.classList.add("block")
    }

    // Set active state on the button
    activeButton.classList.add("active", "text-purple-400", "border-purple-500")
    activeButton.classList.remove("border-transparent")
  }
}
