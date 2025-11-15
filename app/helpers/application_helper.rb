module ApplicationHelper
  # For desktop nav links
  def active_nav_class(path)
    if current_page?(path)
      "px-4 py-2 rounded-lg text-sm font-medium text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-700/70 border border-slate-300 dark:border-slate-600"
    else
      "px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all duration-200"
    end
  end

  # For mobile bottom nav
  def nav_active_class(path)
    if current_page?(path)
      "text-purple-500 dark:text-purple-400"
    else
      "text-slate-600 dark:text-slate-400"
    end
  end
end
