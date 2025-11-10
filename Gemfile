source "https://rubygems.org"

ruby "3.2.3"

# Bundle edge Rails instead: gem "rails", github: "rails/rails", branch: "main"
gem "rails", "~> 7.1.5"

# The original asset pipeline for Rails
gem "sprockets-rails"

# Use postgresql as the database for Active Record
gem "pg", "~> 1.1"

# Use the Puma web server
gem "puma", ">= 5.0"

# Use JavaScript with ESM import maps
gem "importmap-rails"

# Hotwire's SPA-like page accelerator
gem "turbo-rails"

# Hotwire's modest JavaScript framework
gem "stimulus-rails"

# Build JSON APIs with ease
gem "jbuilder"

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem "tzinfo-data", platforms: %i[ windows jruby ]

# Reduces boot times through caching; required in config/boot.rb
gem "bootsnap", require: false

group :development, :test do
  # Debugging
  gem "debug", platforms: %i[ mri windows ]
end

group :development do
  # Use console on exceptions pages
  gem "web-console"

  # Testing & factories
  gem "rspec-rails"
  gem "factory_bot_rails"
  gem "faker"

  # Linting
  gem "rubocop", require: false
  gem "rubocop-rails", require: false

  # Add speed badges
  # gem "rack-mini-profiler"

  # Speed up commands on slow machines / big apps
  # gem "spring"
end

group :test do
  # Use system testing
  gem "capybara"
  gem "selenium-webdriver"
end

# Auth
gem "devise", "~> 4.9"

# Background jobs
gem "sidekiq", "~> 7.3"
gem "sidekiq-cron", "~> 2.1"

# Tailwind
gem "tailwindcss-rails", "~> 4.1"

# Pagination
gem "kaminari", "~> 1.2"