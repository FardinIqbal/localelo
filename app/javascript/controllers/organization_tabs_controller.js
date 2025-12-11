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
    if (!targetId) {
      console.warn("No tabsTarget found on button")
      return
    }

    this.switchToTab(targetId, event.currentTarget)
  }

  switchToTab(targetId, clickedButton) {
    // Get all buttons and content
    const buttons = this.element.querySelectorAll('[data-tabs-target]')
    const contents = this.element.querySelectorAll('[role="tabpanel"]')

    // Hide all tab contents
    contents.forEach((content) => {
      content.classList.add("hidden")
      content.classList.remove("block")
    })

    // Remove active state from all buttons
    buttons.forEach((btn) => {
      btn.classList.remove("active", "text-purple-400", "border-purple-500", "font-semibold")
      btn.classList.add("border-transparent", "text-slate-400")
      btn.setAttribute("aria-selected", "false")
    })

    // Show the selected tab content
    const targetEl = document.getElementById(targetId)
    if (targetEl) {
      targetEl.classList.remove("hidden")
      targetEl.classList.add("block")
    }

    // Add active state to clicked button
    if (clickedButton) {
      clickedButton.classList.add("active", "text-purple-400", "border-purple-500", "font-semibold")
      clickedButton.classList.remove("border-transparent", "text-slate-400")
      clickedButton.setAttribute("aria-selected", "true")
    }
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
    // Get buttons using the data-tabs-target attribute
    const buttons = Array.from(this.element.querySelectorAll('[data-tabs-target]'))
    const contents = Array.from(this.element.querySelectorAll('[role="tabpanel"]'))
    
    if (buttons.length === 0 || contents.length === 0) return

    // Find the active button or default to first
    const activeButton = buttons.find((btn) => btn.classList.contains("active")) || buttons[0]
    if (!activeButton) return

    // Get the target ID from the button's data attribute
    const targetId = activeButton.dataset.tabsTarget
    if (!targetId) return

    this.switchToTab(targetId, activeButton)
  }
}
