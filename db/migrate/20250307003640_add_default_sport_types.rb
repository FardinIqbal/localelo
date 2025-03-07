class AddDefaultSportTypes < ActiveRecord::Migration[7.1]
  def up
    sport_metadata_config = {
      "BJJ" => { "submission" => { "type" => "string", "label" => "Submission", "required" => true } },
      "MMA" => { "win_method" => { "type" => "string", "label" => "Win Method", "required" => true } },
      "Wrestling" => { "win_type" => { "type" => "enum", "options" => %w[Pin Decision], "required" => true } }
    }

    sport_metadata_config.each do |name, metadata|
      sport = SportType.find_or_create_by!(name: name)
      sport.update!(metadata_template: metadata)
    end
  end

  def down
    SportType.where(name: %w[BJJ MMA Wrestling]).destroy_all
  end
end
