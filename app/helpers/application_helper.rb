module ApplicationHelper
  def active_nav_class(path)
    current_page?(path) ? "nav-link--active" : ""
  end
end
