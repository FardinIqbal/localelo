class ApplicationController < ActionController::Base
  before_action :configure_permitted_parameters, if: :devise_controller?
  after_action :store_flash, if: -> { request.format.turbo_stream? }

  protected

  # Permit additional Devise params
  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:username, :first_name, :last_name])
    devise_parameter_sanitizer.permit(:account_update, keys: [:username, :first_name, :last_name])
  end

  # Persist flash across Turbo Stream requests so flash messages render correctly
  def store_flash
    flash.keep
  end
end
