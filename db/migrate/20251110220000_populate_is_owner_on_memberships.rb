class PopulateIsOwnerOnMemberships < ActiveRecord::Migration[7.1]
  disable_ddl_transaction!

  def up
    Organization.reset_column_information
    OrganizationMembership.reset_column_information

    say_with_time "Populating is_owner on organization memberships" do
      Organization.find_each do |org|
        # Prefer explicit owner_profile_id if available
        owner_profile =
          if org.respond_to?(:owner_profile_id) && org.owner_profile_id.present?
            Profile.find_by(id: org.owner_profile_id)
          else
            org.profiles.first
          end

        next unless owner_profile

        membership = org.organization_memberships.find_by(profile_id: owner_profile.id)

        if membership
          membership.update_column(:is_owner, true)
        else
          # Create membership if missing
          org.organization_memberships.create!(
            profile_id: owner_profile.id,
            status: :approved,
            admin: true,
            is_owner: true
          )
        end
      end
    end
  end

  def down
    say_with_time "Clearing is_owner flags on organization memberships" do
      OrganizationMembership.update_all(is_owner: false)
    end
  end
end