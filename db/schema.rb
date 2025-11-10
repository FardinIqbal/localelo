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

ActiveRecord::Schema[7.1].define(version: 2025_05_01_120500) do
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

  create_table "elo_histories", force: :cascade do |t|
    t.bigint "leaderboard_id", null: false
    t.integer "elo", null: false
    t.datetime "recorded_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.bigint "profile_id", null: false
    t.bigint "match_id"
    t.index ["profile_id", "leaderboard_id", "recorded_at"], name: "index_elo_history_on_profile_and_leaderboard"
    t.index ["profile_id"], name: "index_elo_histories_on_profile_id"
    t.index ["match_id"], name: "index_elo_histories_on_match_id"
  end

  create_table "leaderboard_ratings", force: :cascade do |t|
    t.bigint "leaderboard_id", null: false
    t.integer "rating", default: 1500, null: false
    t.integer "wins", default: 0
    t.integer "losses", default: 0
    t.integer "draws", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "profile_id", null: false
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

  create_table "matches", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "match_time"
    t.integer "elo_change"
    t.integer "elo_at_time", default: 1500, null: false
    t.bigint "leaderboard_id", null: false
    t.boolean "is_draw", default: false, null: false
    t.bigint "profile1_id", null: false
    t.bigint "opponent_profile_id", null: false
    t.bigint "winner_profile_id"
    t.index ["leaderboard_id"], name: "index_matches_on_leaderboard_id"
    t.index ["match_time"], name: "index_matches_on_match_time"
    t.index ["opponent_profile_id"], name: "index_matches_on_opponent_profile_id"
    t.index ["profile1_id", "opponent_profile_id", "leaderboard_id"], name: "index_matches_on_profile1_and_opponent_profile_and_leaderboard"
    t.index ["profile1_id"], name: "index_matches_on_profile1_id"
    t.index ["winner_profile_id"], name: "index_matches_on_winner_profile_id"
  end

  create_table "organization_memberships", force: :cascade do |t|
    t.bigint "organization_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "status", default: 0, null: false
    t.boolean "admin", default: false, null: false
    t.bigint "profile_id", null: false
    t.index ["organization_id"], name: "index_organization_memberships_on_organization_id"
    t.index ["profile_id"], name: "index_organization_memberships_on_profile_id"
  end

  create_table "organizations", force: :cascade do |t|
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.text "description"
    t.string "location"
    t.string "website"
    t.integer "visibility", default: 0
    t.bigint "created_by"
    t.string "subdomain"
    t.index ["name"], name: "index_organizations_on_name"
    t.index ["subdomain"], name: "index_organizations_on_subdomain", unique: true
    t.index ["user_id"], name: "index_organizations_on_user_id"
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

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.datetime "discarded_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["discarded_at"], name: "index_users_on_discarded_at"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "elo_histories", "leaderboards"
  add_foreign_key "elo_histories", "matches"
  add_foreign_key "elo_histories", "profiles"
  add_foreign_key "leaderboard_ratings", "leaderboards"
  add_foreign_key "leaderboard_ratings", "profiles"
  add_foreign_key "leaderboards", "organizations"
  add_foreign_key "matches", "leaderboards"
  add_foreign_key "matches", "profiles", column: "opponent_profile_id"
  add_foreign_key "matches", "profiles", column: "profile1_id"
  add_foreign_key "matches", "profiles", column: "winner_profile_id"
  add_foreign_key "organization_memberships", "organizations"
  add_foreign_key "organization_memberships", "profiles"
  add_foreign_key "organizations", "users"
  add_foreign_key "profiles", "organizations"
  add_foreign_key "profiles", "users"
end
