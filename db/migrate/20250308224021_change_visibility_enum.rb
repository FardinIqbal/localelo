class ChangeVisibilityEnum < ActiveRecord::Migration[7.1]
  def change
    change_column_default :organizations, :visibility, from: 0, to: 0  # Ensure existing records still work
  end
end
