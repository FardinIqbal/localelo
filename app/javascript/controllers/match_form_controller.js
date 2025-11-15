import { Controller } from "@hotwired/stimulus"

// Guides the multi-step match form without inline scripts.
export default class extends Controller {
  static targets = [
    "organizationSelect",
    "leaderboardSelect",
    "opponentSelect",
    "profileField",
    "winnerMeRadio",
    "winnerOpponentRadio",
    "submitButton",
    "progressBar",
    "stepIndicator"
  ]

  static values = {
    leaderboards: Array,
    profilesByOrg: Object,
    opponentsUrl: String
  }

  connect() {
    this.updateStep(1)
  }

  chooseOrganization() {
    const orgId = this.organizationSelectTarget.value

    this.resetSelect(this.leaderboardSelectTarget, "Select a leaderboard…")
    this.resetSelect(this.opponentSelectTarget, "Select an opponent…")
    this.disableResult()
    this.opponentSelectTarget.disabled = true

    if (!orgId) {
      this.leaderboardSelectTarget.disabled = true
      this.opponentSelectTarget.disabled = true
      this.updateStep(1)
      return
    }

    const leaderboardsData = this.leaderboardsValue || []
    const leaderboards = leaderboardsData.filter(
      (leaderboard) => String(leaderboard.organization_id) === orgId
    )

    leaderboards.forEach((leaderboard) => {
      this.leaderboardSelectTarget.add(new Option(leaderboard.name, leaderboard.id))
    })

    this.leaderboardSelectTarget.disabled = leaderboards.length === 0
    this.opponentSelectTarget.disabled = true

    const profilesByOrg = this.profilesByOrgValue || {}
    const profileId = profilesByOrg[orgId]
    this.profileFieldTarget.value = profileId || ""
    this.winnerMeRadioTarget.value = profileId || ""

    this.updateStep(this.leaderboardSelectTarget.disabled ? 1 : 2)
  }

  chooseLeaderboard() {
    const leaderboardId = this.leaderboardSelectTarget.value

    this.resetSelect(this.opponentSelectTarget, "Select an opponent…")
    this.disableResult()

    if (!leaderboardId) {
      this.opponentSelectTarget.disabled = true
      this.updateStep(2)
      return
    }

    this.opponentSelectTarget.disabled = true
    this.updateStep(3)

    const baseUrl = this.opponentsUrlValue
    if (!baseUrl) {
      this.opponentSelectTarget.disabled = true
      return
    }

    const url = `${baseUrl}?leaderboard_id=${leaderboardId}`

    fetch(url, { headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" } })
      .then((response) => response.json())
      .then((data) => {
        this.resetSelect(this.opponentSelectTarget, "Select an opponent…")

        if (!data.opponents || data.opponents.length === 0) {
          this.opponentSelectTarget.add(new Option("No opponents available", ""))
          this.opponentSelectTarget.disabled = true
          this.disableResult()
          return
        }

        data.opponents.forEach((opponent) => {
          this.opponentSelectTarget.add(new Option(opponent.username, opponent.id))
        })

        this.opponentSelectTarget.disabled = false
      })
      .catch(() => {
        this.resetSelect(this.opponentSelectTarget, "Unable to load opponents")
        this.opponentSelectTarget.disabled = true
        this.disableResult()
      })
  }

  chooseOpponent() {
    const opponentId = this.opponentSelectTarget.value
    this.winnerOpponentRadioTarget.value = opponentId || ""

    if (opponentId) {
      this.winnerMeRadioTarget.disabled = false
      this.winnerOpponentRadioTarget.disabled = false
      this.updateStep(4)
    } else {
      this.disableResult()
      this.updateStep(3)
    }
  }

  pickWinner() {
    const ready = this.winnerMeRadioTarget.checked || this.winnerOpponentRadioTarget.checked
    this.submitButtonTarget.disabled = !ready
  }

  disableResult() {
    this.winnerMeRadioTarget.checked = false
    this.winnerOpponentRadioTarget.checked = false
    this.winnerMeRadioTarget.disabled = true
    this.winnerOpponentRadioTarget.disabled = true
    this.submitButtonTarget.disabled = true
  }

  resetSelect(select, placeholder) {
    select.innerHTML = ""
    select.add(new Option(placeholder, ""))
  }

  updateStep(step) {
    if (this.hasProgressBarTarget) {
      const progress = Math.min(Math.max(step, 1), 4) / 4 * 100
      this.progressBarTarget.style.width = `${progress}%`
    }

    if (this.hasStepIndicatorTarget) {
      this.stepIndicatorTarget.textContent = step
    }
  }
}
