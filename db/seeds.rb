DEFAULT_LINKFLAIRS = {
  "BJJ" => ["Triangle Choke", "Armbar", "Kimura", "Rear Naked Choke"],
  "MMA" => ["KO", "TKO", "Decision", "Flying Knee"],
  "Wrestling" => ["Double Leg", "Single Leg", "Snap Down"],
  "Table Tennis" => ["Forehand Smash", "Backhand Chop"],
  "Chess" => ["Checkmate", "Stalemate", "Blunder"]
}

DEFAULT_LINKFLAIRS.each do |sport_name, moves|
  sport = SportType.find_by(name: sport_name)
  next unless sport

  moves.each do |move|
    Linkflair.find_or_create_by!(sport_type: sport, category: "technique", name: move)
  end
end
