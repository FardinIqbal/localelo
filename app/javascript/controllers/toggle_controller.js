import { Controller } from "@hotwired/stimulus"

/**
 * Toggle controller for switching recent activity views.
 * Used to show either all matches or only the current user's matches.
 */
export default class extends Controller {
    static targets = ["all", "mine"]

    switch(event) {
        const target = event.currentTarget.dataset.toggleTarget
        const url = new URL(window.location.href)

        if (target === "mine") {
            url.searchParams.set("view", "mine")
        } else {
            url.searchParams.delete("view")
        }

        Turbo.visit(url.toString(), { frame: "recent_activity" })
    }
}
