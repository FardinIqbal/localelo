module OrganizationsHelper
  def head_to_head_label(match_count)
    match_count.positive? ? pluralize(match_count, "match") : "None yet"
  end

  def last_played_label(match_count, last_played_at)
    if match_count.zero?
      "—"
    elsif last_played_at.present?
      "#{time_ago_in_words(last_played_at)} ago"
    else
      "—"
    end
  end

  def rating_change_badge(participant)
    return unless participant&.elo_change

    change = participant.elo_change.round
    classes = if change.positive?
                "bg-green-400/20 text-green-400"
              elsif change.negative?
                "bg-red-400/20 text-red-400"
              else
                "bg-yellow-400/20 text-yellow-400"
              end

    content_tag(
      :span,
      "#{change.positive? ? '+' : ''}#{change} ELO",
      class: "ml-2 px-2 py-0.5 rounded-full text-xs font-medium #{classes}"
    )
  end
end
