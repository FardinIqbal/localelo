Rails.application.configure do
  config.cache_store = :mem_cache_store,
    { namespace: "elo_tracker_#{Rails.env}", expires_in: 1.day }
end
