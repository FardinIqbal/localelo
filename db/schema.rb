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

ActiveRecord::Schema[7.1].define(version: 2025_03_07_133937) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "leaderboard_ratings", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "leaderboard_id", null: false
    t.integer "rating", default: 1500, null: false
    t.integer "wins", default: 0
    t.integer "losses", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["leaderboard_id"], name: "index_leaderboard_ratings_on_leaderboard_id"
    t.index ["user_id", "leaderboard_id"], name: "index_leaderboard_ratings_on_user_id_and_leaderboard_id", unique: true
    t.index ["user_id"], name: "index_leaderboard_ratings_on_user_id"
  end

  create_table "leaderboards", force: :cascade do |t|
    t.bigint "organization_id", null: false
    t.string "name", null: false
    t.string "slug", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "sport_type_id", null: false
    t.index ["organization_id", "slug"], name: "index_leaderboards_on_organization_id_and_slug", unique: true
    t.index ["organization_id"], name: "index_leaderboards_on_organization_id"
    t.index ["sport_type_id"], name: "index_leaderboards_on_sport_type_id"
  end

  create_table "linkflairs", force: :cascade do |t|
    t.bigint "sport_type_id", null: false
    t.string "category", null: false
    t.string "name", null: false
    t.integer "usage_count", default: 1
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "match_id", null: false
    t.index ["match_id"], name: "index_linkflairs_on_match_id"
    t.index ["sport_type_id", "category", "name"], name: "index_linkflairs_on_sport_type_id_and_category_and_name", unique: true
    t.index ["sport_type_id"], name: "index_linkflairs_on_sport_type_id"
  end

  create_table "match_metadata", force: :cascade do |t|
    t.bigint "match_id", null: false
    t.jsonb "data", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["match_id"], name: "index_match_metadata_on_match_id"
  end

  create_table "matches", force: :cascade do |t|
    t.bigint "user1_id", null: false
    t.bigint "opponent_id", null: false
    t.bigint "winner_id"
    t.string "submission"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "match_time"
    t.integer "elo_change"
    t.integer "elo_at_time", default: 1500, null: false
    t.bigint "leaderboard_id", null: false
    t.bigint "match_metadata_id"
    t.index ["leaderboard_id"], name: "index_matches_on_leaderboard_id"
    t.index ["match_metadata_id"], name: "index_matches_on_match_metadata_id"
    t.index ["opponent_id"], name: "index_matches_on_opponent_id"
    t.index ["user1_id"], name: "index_matches_on_user1_id"
    t.index ["winner_id"], name: "index_matches_on_winner_id"
  end

  create_table "organization_memberships", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "organization_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id"], name: "index_organization_memberships_on_organization_id"
    t.index ["user_id"], name: "index_organization_memberships_on_user_id"
  end

  create_table "organizations", force: :cascade do |t|
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.string "slug"
    t.index ["slug"], name: "index_organizations_on_slug", unique: true
    t.index ["user_id"], name: "index_organizations_on_user_id"
  end

  create_table "sport_types", force: :cascade do |t|
    t.string "name", null: false
    t.jsonb "metadata_template", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_sport_types_on_name", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "first_name"
    t.string "last_name"
    t.string "username"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["username"], name: "index_users_on_username", unique: true
  end

  add_foreign_key "leaderboard_ratings", "leaderboards"
  add_foreign_key "leaderboard_ratings", "users"
  add_foreign_key "leaderboards", "organizations"
  add_foreign_key "leaderboards", "sport_types"
  add_foreign_key "linkflairs", "matches"
  add_foreign_key "linkflairs", "sport_types"
  add_foreign_key "match_metadata", "matches"
  add_foreign_key "matches", "leaderboards"
  add_foreign_key "matches", "match_metadata", column: "match_metadata_id"
  add_foreign_key "matches", "users", column: "opponent_id"
  add_foreign_key "matches", "users", column: "user1_id"
  add_foreign_key "matches", "users", column: "winner_id"
  add_foreign_key "organization_memberships", "organizations"
  add_foreign_key "organization_memberships", "users"
  add_foreign_key "organizations", "users"
end
