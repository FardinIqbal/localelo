module ApplicationHelper
  # For desktop nav links
  def active_nav_class(path)
    classes = ["retro-nav-link"]
    classes << "retro-nav-link--active" if current_page?(path)
    classes.join(" ")
  end

  # For mobile bottom nav
  def nav_active_class(path)
    classes = ["retro-bottom-link"]
    classes << "retro-bottom-link--active" if current_page?(path)
    classes.join(" ")
  end
end
