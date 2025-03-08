# app/controllers/home_controller.rb
class HomeController < ApplicationController
  # The index action is typically used for the homepage of the application
  # Here, we're not fetching any data or performing any logic for this page
  # It's just a simple entry point for users visiting the homepage

  def index
    # This action could render a welcome page, promotional content, or other public-facing content
    # If we need to include logic (like fetching data for the homepage), it would go here
    # For example, we might want to display featured organizations or recent activities
    # But for now, we're simply rendering the default view (index.html.erb) associated with this action
  end
end
