import { Controller } from "@hotwired/stimulus"

/**
 * Handles match verification actions:
 * - Confirming acceptance of a match
 * - Denying a match
 * - Submits the PATCH or DELETE via fetch + Turbo
 */
export default class extends Controller {
    static values = {
        id: Number
    }

    confirmVerify() {
        if (confirm("Are you sure you want to verify this match?")) {
            this.sendRequest("PATCH", `/matches/${this.idValue}/verify`)
        }
    }

    confirmDeny() {
        if (confirm("Are you sure you want to deny and delete this match?")) {
            this.sendRequest("DELETE", `/matches/${this.idValue}`)
        }
    }

    sendRequest(method, url) {
        fetch(url, {
            method: method,
            headers: {
                "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content,
                "Accept": "text/vnd.turbo-stream.html"
            }
        })
            .then(response => {
                if (!response.ok) {
                    console.error(`Request failed: ${response.status}`)
                }
            })
            .catch(error => {
                console.error("Network error:", error)
            })
    }
}
