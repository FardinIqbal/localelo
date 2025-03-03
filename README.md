📌 User Landing Page After Sign-In (users#show)
Since each gym is independent, there will be no global Elo ranking—only gym-specific rankings. Users will only see their Elo and rank within each gym they belong to.

🔗 Page URL & Navigation
✅ URL: /users/:id (e.g., /users/5 for John Doe)
✅ Controller Action: users#show

🛠 Page Structure (What Should Be On It?)
🔝 1. Navigation Bar (Sticky)
💡 Purpose: Quick access to key sections

✅ Logo (Redirects to /)
✅ Links:

🏆 Leaderboards (/leaderboard)
🏋️ Gyms (/gyms)
📖 Matches (/matches)
🎮 Log a Match (/matches/new)
✅ User Profile Dropdown (Expands with logout/edit options)
✅ Mobile Menu (Slide-in animation for smaller screens)
🎨 UI/UX Features:

Sticky Navbar (always visible)
Hover Effects on Links (underline animation)
Smooth Dropdown for Profile (fades in)
👤 2. Profile Overview Section
💡 Purpose: Show user's basic info, belt rank, and gyms.

✅ User Profile Picture (Circular, Uploadable)
✅ Name & Belt Rank (For BJJ)
✅ Edit Profile Button (/users/:id/edit)

🎨 UI/UX Features:

Profile picture hover effect (slight scale-up).
Fade-in effect when loading the page (opacity-0 → opacity-100).
🏋️ 3. My Gyms Section (For Users in Multiple Gyms)
💡 Purpose: Let users switch between their gyms easily.

✅ "My Gyms" Dropdown or Grid View

Lists all gyms the user is a member of.
Clicking a gym redirects to that gym's page (/gyms/:id).
Default gym = most active gym (most matches logged).
💡 Example UI Layout:
📌 Dropdown Selector (If user has 2+ gyms)
🏋️ Gracie Academy (Los Angeles) 🔗 /gyms/1
🏋️ 10th Planet (San Diego) 🔗 /gyms/2
🏋️ Checkmat NYC 🔗 /gyms/3

📌 Alternative Grid View

Gym Name	Members	My Rank	Go to Gym →
Gracie Academy	30	🥇 #1	🔗 /gyms/1
10th Planet SD	25	🥉 #3	🔗 /gyms/2
Checkmat NYC	40	#5	🔗 /gyms/3
🎨 UI/UX Features:

Gym cards lift slightly when hovered (hover:shadow-lg).
Dropdown expands with animation.
🏆 4. Gym-Specific Elo & Rank
💡 Purpose: Show the user’s ranking inside each gym.

✅ Displays Elo Score & Rank for Each Gym
✅ Quick Link to Gym Leaderboard (/gyms/:id/leaderboard)

💡 Example UI Layout:
🏋️ Gracie Academy: Elo 1890, Rank #1 🔗 /gyms/1/leaderboard
🏋️ 10th Planet SD: Elo 1740, Rank #3 🔗 /gyms/2/leaderboard
🏋️ Checkmat NYC: Elo 1605, Rank #5 🔗 /gyms/3/leaderboard

🎨 UI/UX Features:

Numbers animate up when loaded (0 → 1890).
Rank badges with dynamic color based on placement (🥇🥈🥉).
⚔️ 5. Recent Matches
💡 Purpose: Show latest matches inside each gym.

✅ Table Format:

Winner	Loser	Elo Change	Gym	Date
🥇 John Doe	Carlos Santos	+15/-15	Gracie Academy	2 days ago
Jane Smith	Alice Kim	+10/-10	10th Planet	5 days ago
Mark Lee	John Doe	+20/-20	Checkmat NYC	1 week ago
✅ View Full Match History (/matches?user_id=5)

🎨 UI/UX Features:

Matches slide in one-by-one when loading.
Hovering over a match highlights it slightly.
Winner’s name has a subtle glow effect.
🎮 6. Quick Actions Section
💡 Purpose: Let users take quick actions.

✅ 🎮 Log a Match (/matches/new)
✅ 🏆 View Gym Leaderboard (/gyms/:id/leaderboard)
✅ 📖 Read How Elo Works (/how-it-works)

🎨 UI/UX Features:

Buttons slightly pulse to grab attention.
Hover effects: background color darkens slightly.