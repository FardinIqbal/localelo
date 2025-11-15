# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.1].define(version: 2025_12_02_000007) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "leaderboard_ratings", force: :cascade do |t|
    t.bigint "leaderboard_id", null: false
    t.float "rating", default: 1500.0, null: false
    t.integer "wins", default: 0
    t.integer "losses", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "profile_id", null: false
    t.integer "draws", default: 0, null: false
    t.float "rating_deviation", default: 350.0
    t.float "volatility", default: 0.06
    t.datetime "last_rated_at"
    t.index ["leaderboard_id", "rating"], name: "index_leaderboard_ratings_on_leaderboard_id_and_rating"
    t.index ["leaderboard_id"], name: "index_leaderboard_ratings_on_leaderboard_id"
    t.index ["profile_id", "leaderboard_id"], name: "index_leaderboard_ratings_on_profile_id_and_leaderboard_id", unique: true
    t.index ["profile_id"], name: "index_leaderboard_ratings_on_profile_id"
  end

  create_table "leaderboards", force: :cascade do |t|
    t.bigint "organization_id", null: false
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "description"
    t.string "sport"
    t.index ["organization_id", "sport"], name: "index_leaderboards_on_organization_and_sport"
    t.index ["organization_id"], name: "index_leaderboards_on_organization_id"
  end

  create_table "match_participants", force: :cascade do |t|
    t.bigint "match_id", null: false
    t.bigint "profile_id", null: false
    t.boolean "is_winner", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.float "rating_before_match"
    t.float "rating_deviation_before_match"
    t.float "volatility_before_match"
    t.float "rating_after_match"
    t.float "rating_deviation_after_match"
    t.float "volatility_after_match"
    t.index ["match_id", "profile_id"], name: "index_match_participants_on_match_id_and_profile_id", unique: true
    t.index ["match_id"], name: "index_match_participants_on_match_id"
    t.index ["profile_id"], name: "index_match_participants_on_profile_id"
  end

  create_table "matches", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "match_time"
    t.bigint "leaderboard_id", null: false
    t.boolean "is_draw", default: false, null: false
    t.bigint "winner_profile_id"
    t.integer "status", default: 0, null: false
    t.datetime "rated_at"
    t.index ["leaderboard_id"], name: "index_matches_on_leaderboard_id"
    t.index ["match_time"], name: "index_matches_on_match_time"
    t.index ["status"], name: "index_matches_on_status"
    t.index ["winner_profile_id"], name: "index_matches_on_winner_profile_id"
  end

  create_table "organization_memberships", force: :cascade do |t|
    t.bigint "organization_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "status", default: 0, null: false
    t.bigint "profile_id", null: false
    t.index ["organization_id"], name: "index_organization_memberships_on_organization_id"
    t.index ["profile_id"], name: "index_organization_memberships_on_profile_id"
  end

  create_table "organization_roles", force: :cascade do |t|
    t.bigint "organization_id", null: false
    t.bigint "organization_membership_id", null: false
    t.boolean "admin", default: false, null: false
    t.boolean "owner", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id", "organization_membership_id"], name: "index_roles_on_org_and_membership", unique: true
    t.index ["organization_id", "owner"], name: "index_organization_roles_on_org_and_owner", unique: true, where: "(owner = true)"
    t.index ["organization_id"], name: "index_organization_roles_on_organization_id"
    t.index ["organization_membership_id"], name: "index_roles_on_membership"
  end

  create_table "organizations", force: :cascade do |t|
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "description"
    t.string "location"
    t.string "website"
    t.integer "visibility", default: 0
    t.bigint "created_by"
    t.string "subdomain"
    t.index ["name"], name: "index_organizations_on_name"
    t.index ["subdomain"], name: "index_organizations_on_subdomain", unique: true
    t.index ["visibility"], name: "index_organizations_on_visibility"
  end

  create_table "profiles", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "organization_id", null: false
    t.string "username", null: false
    t.string "first_name"
    t.string "last_name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id", "user_id"], name: "index_profiles_on_organization_id_and_user_id", unique: true
    t.index ["organization_id", "username"], name: "index_profiles_on_organization_id_and_username", unique: true
    t.index ["organization_id"], name: "index_profiles_on_organization_id"
    t.index ["user_id"], name: "index_profiles_on_user_id"
  end

  create_table "rating_histories", force: :cascade do |t|
    t.bigint "profile_id", null: false
    t.bigint "leaderboard_id", null: false
    t.bigint "match_id", null: false
    t.float "rating"
    t.float "rating_deviation"
    t.float "volatility"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["leaderboard_id"], name: "index_rating_histories_on_leaderboard_id"
    t.index ["match_id"], name: "index_rating_histories_on_match_id"
    t.index ["profile_id"], name: "index_rating_histories_on_profile_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "discarded_at"
    t.index ["discarded_at"], name: "index_users_on_discarded_at"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "leaderboard_ratings", "leaderboards"
  add_foreign_key "leaderboard_ratings", "profiles"
  add_foreign_key "leaderboards", "organizations"
  add_foreign_key "match_participants", "matches"
  add_foreign_key "match_participants", "profiles"
  add_foreign_key "matches", "leaderboards"
  add_foreign_key "matches", "profiles", column: "winner_profile_id"
  add_foreign_key "organization_memberships", "organizations"
  add_foreign_key "organization_memberships", "profiles"
  add_foreign_key "organization_roles", "organization_memberships"
  add_foreign_key "organization_roles", "organizations"
  add_foreign_key "profiles", "organizations"
  add_foreign_key "profiles", "users"
  add_foreign_key "rating_histories", "leaderboards"
  add_foreign_key "rating_histories", "matches"
  add_foreign_key "rating_histories", "profiles"
end
