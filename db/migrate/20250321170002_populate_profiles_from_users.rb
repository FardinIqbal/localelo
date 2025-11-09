class PopulateProfilesFromUsers < ActiveRecord::Migration[7.1]
  def up
    say_with_time "Populating profiles from existing users" do
      User.find_each do |user|
        user.organization_memberships.find_each do |membership|
          Profile.create!(
            user_id: user.id,
            organization_id: membership.organization_id,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name
          )
        end
      end
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Cannot automatically revert profile population"
  end
end
