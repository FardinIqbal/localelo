module ApplicationHelper
  # For regular nav links (e.g., desktop)
  def active_nav_class(path)
    if current_page?(path)
      "text-transparent bg-gradient-to-r from-pink-500 to-indigo-500 bg-clip-text font-medium"
    else
      "text-white/70 hover:text-white/90 transition-colors duration-200"
    end
  end

  # For mobile bottom nav (e.g., icon-only buttons)
  def nav_active_class(path)
    if current_page?(path)
      "text-transparent bg-gradient-to-r from-pink-500 to-indigo-500 bg-clip-text"
    else
      ""
    end
  end
end
