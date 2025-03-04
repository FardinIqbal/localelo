class ChangeMatchTimeToDatetimeInMatches < ActiveRecord::Migration[7.0]
  def change
    remove_column :matches, :match_time
    add_column :matches, :match_time, :datetime
  end
end
