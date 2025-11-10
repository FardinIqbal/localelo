class PopulateIsOwnerOnMemberships < ActiveRecord::Migration[7.1]
  disable_ddl_transaction!

  def up
    Organization.reset_column_information
    OrganizationMembership.reset_column_information

    say_with_time "Populating is_owner on organization memberships" do
      Organization.find_each do |org|
        next unless org.user_id.present?

        membership = org.organization_memberships.find_by(user_id: org.user_id)

        if membership
          membership.update_column(:is_owner, true)
        else
          org.organization_memberships.create!(
            user_id: org.user_id,
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
