class AddMatchMetadataToMatches < ActiveRecord::Migration[7.1]
  def change
    add_reference :matches, :match_metadata, foreign_key: true
  end
end
