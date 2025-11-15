Read all md files in root to understand what we did. DO not use emojis any where in the code base. IF you see any emojis remove it.Follow this framework The Essence of Software: Why Concepts Matter for Great Design
Abstract 
This book presents a new theory of software design centered on the idea that the "essence" of a software product is its concepts—the underlying behaviors, structures, and purposes that define its functionality. The author, Daniel Jackson, argues that usability, elegance, and power in software are not primarily the result of code quality (internal design) or visual polish (physical/linguistic design), but rather the clarity, coherence, and soundness of its conceptual model .
The book is structured in three parts. Part I: Motivations introduces the core problem: that software design lacks a formal language and theory, unlike other design disciplines. It establishes that concepts form a "conceptual core" that characterizes and differentiates applications, such as the layer concept in Photoshop or the formula concept in VisiCalc.
Part II: Essentials provides a formal structure for defining, analyzing, and composing concepts. A concept is defined by five components: its Name, its Purpose (the "why," or the user need it fulfills), its State (the data it tracks), its Actions (the behaviors it offers), and its Operational Principle (the key scenario demonstrating how it fulfills its purpose) . This part details how applications are built by composing individual concepts using synchronization, categorized as free, collaborative, or synergistic composition .
Part III: Principles outlines three fundamental principles for good concept design:
Specificity: Concepts and purposes must have a one-to-one relationship. This principle is used to diagnose common design flaws like overloading (one concept for multiple purposes, e.g., Twitter's old favorite) and redundancy (multiple concepts for one purpose, e.g., Gmail's labels and categories) .
Familiarity: Designers should reuse well-understood, existing concepts rather than inventing novel ones for the same purpose, as this makes software more intuitive .
Integrity: When concepts are composed, one concept must not break or violate the rules of another (e.g., how modern typeface concepts break the simple format toggle concept) .
The book concludes by offering a new framework for all software practitioners—from strategists to programmers—to analyze, critique, and build software with greater clarity and intellectual confidence, ultimately leading to better and more usable designs.


The Core Philosophy of Concept-Driven Design
This curriculum begins with the foundational "why" of the book: the central argument for a new way to think about software design.
The Crisis in Software Design
The author argues that while software has advanced, the discipline of designing it—specifically its user-facing behavior—lacks a coherent theory and language.
The Failures of Existing Disciplines
Traditional fields have failed to provide a "theory of software design" that explains why some products feel natural and elegant while others are cluttered, complex, and inconsistent .
Software Engineering (SE) & Programming Languages: These fields have a rich theory for internal design (code structure, maintainability, performance) . However, this internal design does not determine the user's experience. Research in SE has narrowed its focus to "defect elimination" (bugs), but you cannot fix a bad design by removing bugs .
Human-Computer Interaction (HCI): This field has shifted its focus to novel interaction technologies, tools, and social/psychological questions (the user) rather than the inherent structure of the software itself.
Agile & Design Thinking: These are valuable processes, but they are "content-free". They tell you how to iterate (e.g., "diverge and converge") but not what to design or what makes a design good or bad .
The Author's Central Claim: Clarity is the Essence
The author's core thesis is that the primary determinant of success in software development is clarity. The "essence" of a software product is its conceptual model—the underlying structure of its behaviors as seen by the user .
The goal of concept-driven design is to align three things:
The designer's explicit Conceptual Model.
The user's Mental Model (their understanding of how it works).
The System Image (the UI—buttons, labels, etc.) which projects the conceptual model to the user.
The Three Levels of Design
To understand concept design, we must first separate design into three distinct levels. Most usability problems are incorrectly attributed to the lower levels (a bad icon or button) when they are actually flaws in the highest level (a broken concept).
Level 1: The Physical Level
This level concerns the physical qualities of the artifact and the physical capabilities of humans.
Concerns: Color, size, layout, type, touch, sound, accessibility.
Guiding Principles: This level is governed by physical laws and human physiology.
Example: Fitts's Law. This law predicts the time to move a pointer to a target. It explains why the macOS menu bar (at the screen edge, offering an "infinite" target) is physically faster to access than a Windows menu bar (which is inside a window) .
Level 2: The Linguistic Level
This level concerns the use of language—icons, labels, and text—to communicate behavior and state to the user.
Concerns: Icons, labels, tooltips, messages, cultural differences .
Guiding Principles: Consistency is the primary rule at this level. The same word or icon should mean the same thing everywhere.
Example: Google's Inconsistent Icons. Google once used two nearly identical grid icons for "Google Apps" and "Grid view," violating linguistic consistency and causing confusion .
Level 3: The Conceptual Level
This is the highest, most abstract, and most important level. It is the focus of the entire book.
Concerns: The underlying behavior, semantics, actions, data model, and purpose of the software . It is the essence of the interaction, independent of the specific buttons (physical) or icons (linguistic) used to represent it .
Example: Dropbox's Flaw. The confusion over Dropbox deletion (see Section 5) is not a flaw in the "delete" button (Physical) or its label (Linguistic). It is a flaw in the conceptual design of its folder concept, which most users misunderstand .
How Concepts Help (The "Why")
Focusing on concepts provides a powerful framework for strategy, design, and analysis.
Concepts Characterize and Differentiate Products
Characterize Apps: An app is its collection of key concepts.
Facebook is characterized by its concepts of post, comment, like, and friend .
Characterize Families: Entire classes of applications are unified by their shared concepts.
Text Editors share line and character concepts.
Word Processors add the paragraph and format concepts.
Desktop Publishing (DTP) apps (like InDesign) add the text flow concept (linking text boxes across pages) .
Differentiate Products: A single, novel concept is often the root of a product's success.
VisiCalc (the first spreadsheet) was differentiated by its formula concept.
Photoshop became dominant due to its layer and mask concepts, which enabled non-destructive editing.
The World Wide Web was differentiated not by hypertext (which existed) but by the URL concept—a global, unique name for any document.
Concepts Structure Business and Development
Define Businesses: "Digital transformation" is not about adopting new tech (like AI or blockchain) but about identifying, consolidating, and extending a company's core business concepts .
Example: Apple's success with music was unifying the experience into a single song concept. In contrast, the airline business is built on an obscure and user-hostile seat concept .
Separate Concerns: Concepts provide the most effective way to "separate concerns" in user-facing design.
Example: A "group forum" app can be broken down into separate, smaller concepts like group (membership), post (composing), invitation, and moderation, which can be designed and built independently .
Enable Reuse: Identifying a generic concept (like upvote) allows a designer to reuse a well-understood solution rather than reinventing it, saving effort and preserving familiarity .
Concepts Ensure Safety and Ground Critique
Ensure Safety & Security: Security is not an add-on; it is a set of core concepts.
Examples: Authentication, authorization, auditing, and two-factor authentication are all concepts . Flaws in these concepts (or their interactions) are the root of security vulnerabilities.
Ground Design Critique: Concepts give designers a shared, substantive language to critique work, moving beyond subjective preference .

The Fundamental Unit: Defining a Concept
To design with concepts, one must first be able to precisely define them. A concept is not just a vague idea; it is a formal structure with five specific components .
The Five Components of a Concept Definition
1. Name
The concept's name often includes generic type variables (placeholders) to show it can be applied in different contexts.
Example: trash [Item]. In a file system, Item becomes File; in an email client, Item becomes Message .
2. Purpose
The Purpose is the single most important component. It is the "why," the justification for the concept's existence, and the yardstick for its success.
Variation / detail: Criteria for a Good Purpose
A well-defined purpose must be:
Cogent: It must express an intelligible need.
Bad Example: Google Docs' help for "sections" says it's to "break up ideas," which is vague.
Good Example: A cogent purpose would be "to allow different margins or page numberings for different parts of a document".
Need-Focused: It must express a user need, not just describe the behavior.
Bad Example: The purpose of a browser bookmark is not "to mark a page" (that's the behavior).
Good Example: The purpose is "to make it easier to revisit a page later".
Specific: It must be specific enough to be useful, not a generic good like "make the user happy" .
Evaluable: It must act as a clear yardstick to measure the concept against.
Variation / detail: Purpose vs. Goal vs. Metaphor
It is critical to distinguish a concept's Purpose from related, but incorrect, ideas.
Purpose vs. Goal: A Goal is a specific task a user might perform, while a Purpose is the core need the concept was designed to fulfill .
Example: A user's goal might be to delete a file. But the purpose of the trash concept is not deletion (a simpler delete command would do that); its purpose is to allow the undoing of deletion.
Purpose vs. Metaphor: Metaphors are often misleading and are not the purpose .
Example: The trash concept is not a metaphor for a physical trash can. A physical trash can's purpose is to stage removal (so you don't walk to the dumpster for every item). The software concept's purpose is undo.
3. State
The State defines the data, objects, and relationships that a concept needs to track to support its actions . It is a local data model for that concept alone.
Example: The trash concept's state consists of two sets of items: accessible and trashed.
4. Actions
Actions describe the dynamics—the behaviors that change the concept's state.
Definition: Actions include preconditions (the "when") that specify the state in which an action is allowed to occur.
Formal Semantics: A concept can be formally modeled as a state machine, where Actions are transition relations that move the concept from one state to another.
5. Operational Principle
The Operational Principle is the key to understanding the concept. It is an archetypal usage scenario that demonstrates how the actions and state work together to fulfill the Purpose.
It is not just any scenario: It is the minimal essential scenario that motivates the concept's entire design.
It is not a "Use Case": Use cases often list many scenarios, including errors. The operational principle is the single, core story that justifies the concept's existence .
Formal Semantics: This can be expressed formally using logic (e.g., dynamic logic) .
Example: For reservation, the principle "after reserving, if you don't cancel, you can use the resource" can be written as: reserve(u, r); (not cancel(u, r))* { can use(u, r) }.
Core Examples of Concept Definitions
The book uses three core examples to illustrate this five-part structure.
Example 1: The trash Concept
Name: trash [Item]
Purpose: To allow undoing of deletions.
State:
accessible: a set of Item
trashed: a set of Item
Actions:
create(x): Adds x to accessible .
delete(x): Moves x from accessible to trashed .
restore(x): Moves x from trashed to accessible .
empty(): Removes all items from trashed .
Operational Principle: after delete(x), can restore(x) and then x in accessible AND after delete(x), can empty() and then x not in accessible or trashed.
Example 2: The style Concept
Name: style [Element, Format]
Purpose: Easing consistent formatting of elements.
State:
assigned: a mapping from Element to one Style
defined: a mapping from Style to one Format
format: a derived mapping (assigned.defined)
Actions:
assign(e, s): Sets the style of element e to s .
define(s, f): Sets the format of style s to f .
Operational Principle: after define(s, f), assign(e1, s), assign(e2, s) and define(s, f'), e1 and e2 have format f' (i.e., changing a style's definition updates all elements assigned to it).
Example 3: The reservation Concept
Name: reservation [User, Resource]
Purpose: To manage the efficient use of limited resources.
State:
available: a set of Resource
reservations: a mapping from User to a set of Resource
Actions:
provide(r): Adds r to available .
reserve(u, r): Associates u with r in reservations and removes r from available .
cancel(u, r): Removes the association and adds r back to available .
use(u, r): Allows u to use r (if reserved) .
Operational Principle: after reserve(u, r) and not cancel(u, r), can use(u, r).

The Three Principles of Good Concept Design
These three principles (Specificity, Familiarity, Integrity) form the core "rules" for evaluating and creating good concepts.
Principle 1: Specificity (One-to-One)
The Specificity Principle states that concepts and purposes should be in a one-to-one correspondence. This is the most profound and frequent-acting principle.
"For every concept there should be exactly one purpose that motivates it, and for every purpose of the product, there should be exactly one concept that fulfills it."
Violations of this principle are the most common source of design flaws.
Violation Type 1: Purposes Without Concepts
This occurs when an essential user need is identified, but no concept exists in the product to fulfill it.
Example: No correspondent Concept in Email. Email lacks a concept for unique sender identities. This omission is the root cause of spam (forged senders) and makes searching for a person's emails unreliable (you get results for "Claudia Marbach (Google Docs)" and "Claudia Jackson Marbach") .
Example: No deletion tracking in Backup. Backup utilities like Backblaze back up new files, but they don't have a concept to track and warn about deletions. This means a file could be accidentally deleted, the deletion backed up, and the file permanently lost without the user ever knowing.
Violation Type 2: Concepts Without Purposes
This occurs when a concept exists that has no clear, compelling user need. It is often a sign of an internal implementation detail being exposed to the user.
Example: The editor buffer Concept. Old apps forced users to "Save". The buffer (the unsaved state) was a mechanism to deal with slow disks, not a concept that served a user purpose. Modern apps like Apple's auto-save, eliminating the purposeless buffer .
Example: The poke in Facebook. A feature so famously purposeless that Facebook's own help page joked about it.
Violation Type 3: Redundant Concepts (Many-to-One)
This occurs when multiple concepts exist to serve the same purpose, confusing users and wasting development effort.
Example: Gmail's Labels and Categories. The purpose of Categories (Primary, Social, Promotions) is "to support the automatic classification of incoming emails" . This is the exact same purpose already served by Labels and Filters. Categories is a redundant concept that just adds complexity.
Example: Zoom's Chat and Broadcast. The purpose is "to send a message to participants." Zoom has two concepts for this (Chat and Broadcast) with arbitrarily different and incompatible behaviors (e.g., one persists, one doesn't; one can cross breakout rooms, the other can't) . A single, well-designed chat concept should have served this purpose.
Violation Type 4: Overloaded Concepts (One-to-Many)
This is the most complex and interesting violation. It occurs when a single concept is forced to serve multiple, distinct purposes . The concept gets pulled in conflicting directions and ends up serving none of its purposes well.
There are four primary causes of overloading:
Variation / detail: Cause 1: False Convergence
The designer mistakenly assumes two distinct purposes are the same.
Example: Facebook's friend Concept. This concept overloads two purposes:
Filtering: Showing you posts from people you care about.
Access Control: Letting people you trust see your posts.
The Conflict: These purposes align for most users, but not for celebrities. A celebrity wants to see posts from their real friends (Purpose 1) but be seen by millions of fans (Purpose 2). The single friend concept cannot serve both, which is why Facebook had to create a separate follower concept.
Variation / detail: Cause 2: Denied Purposes
The designer rejects a valid user purpose, so users hijack an existing concept to serve that need, creating an overload .
Example: Twitter's old favorite (star) Concept.
Designer's Purpose: Public approval / ranking (a like) .
User's (Denied) Purpose: Private bookmarking ("save for later").
The Conflict: Users "favorited" tweets for private reading, but this action was public, broadcasting the tweet to their followers. This led to users unintentionally endorsing tweets they disagreed with .
The Fix (Applying Specificity): Twitter split the concept. They replaced favorite with two new concepts, each with one purpose: 1) like (heart) for public approval and 2) bookmark for private saving .
Variation / detail: Cause 3: Emergent Purposes
Users invent new, unanticipated purposes for a concept over time.
Example: The Email subject line Concept.
Original Purpose: Precis (a summary of the message).
Emergent Purpose 1: Listserv Identifier (e.g., [csail-related] ...).
Emergent Purpose 2: Conversation Grouping Key (e.g., Re: ...).
The Conflict: These purposes now conflict. A user who replies to a listserv email and changes the subject (to better match the new topic) breaks the grouping, causing the message to "lose" its thread.
Variation / detail: Cause 4: Piggybacking
A designer intentionally overloads a concept by forcing a new purpose onto it to avoid the work of creating a new, separate concept .
Example: Epson's paper size Concept.
Original Purpose: To define the dimensions of the paper (e.g., "US Letter").
Piggybacked Purpose: To select the paper feed source (e.g., "Top" or "Front").
The Conflict: The printer driver lists paper sizes like "US Letter (Manual - Front)". This creates havoc. You can't create a custom paper size and assign a feed. Worse, an application (like Lightroom) that saves a printer preset (Purpose 1) also permanently and invisibly saves the paper feed (Purpose 2), leading to errors when printing to a different paper .
Example: Fujifilm's image size Concept. This concept wrongly piggybacks aspect ratio (e.g., "1x1" square) onto JPEG size (e.g., "L" for Large) . This makes it impossible to select a square aspect ratio when shooting in RAW format, because RAW doesn't have a "size" .
Variation / detail: The Solution to Overloading: Split the Concept
When a concept is overloaded, the solution is to split it into multiple, simpler concepts, each with one purpose.
Example: Facebook's like concept is overloaded with at least three purposes: 1) Reaction (social signal), 2) Recommendation (curate your feed), 3) Profiling (target ads) . These conflict: you might be "Angry" (Reaction) at a post, but Facebook's algorithm treats this as "Engagement" (Recommendation), showing you more of that content . These should be three separate concepts.
Principle 2: Familiarity (Reuse)
The Familiarity Principle states that designers should reuse existing, familiar concepts whenever possible, rather than inventing novel ones to solve the same problem.
Benefit to Designer: Reusing a concept (like trash or upvote) means reusing a proven, polished solution that already accounts for many edge cases.
Benefit to User: The app is immediately intuitive because the user already understands how its concepts work from other applications.
Violation: Inventing Novel, Unfamiliar Concepts
This violation occurs when a designer creates a new, custom concept for a purpose that a familiar concept already serves well.
Example: Grouping Slides.
The Purpose: To organize a long presentation into hierarchical groups.
Familiar Concept (Apple Keynote): Keynote reuses the universally familiar outline tree / folder concept. You just indent slides to group them . It's simple, predictable, and familiar.
Novel Concept (Microsoft PowerPoint): PowerPoint invented a novel and unfamiliar section concept. Its behavior is complex and unpredictable. (e.g., "Add Section" creates two sections and includes all slides to the end of the presentation) .
Violation: Breaking Familiarity with Extensions
This occurs when a familiar concept is extended with new functionality in a way that makes it behave unpredictably, breaking the user's expectations.
Example: Adobe Lightroom's export preset.
Familiar Concept: A preset, whose purpose is to save and recall settings for a command .
The Violation: Lightroom's designers added a new purpose (batch exporting to multiple presets at once). They implemented this by adding a checkbox next to the preset name.
The Conflict: Now, clicking the name behaves the old, familiar way (recalls settings), but clicking the checkbox behaves in a new, unfamiliar way (loads settings but grays out the dialog, prepares for batch). This breaks familiarity and confuses users. This is also a classic Overloading violation.
Principle 3: Integrity (Composition)
The Integrity Principle states that when concepts are composed, the specification and behavior of one concept must not be broken or violated by another .
Integrity vs. Synchronization: Synchronization (see Section 4) is a good form of composition. It constrains when actions can occur (e.g., "you can't review until you reserve") but it doesn't change what the review action does.
A Violation: An integrity violation happens when one concept's internals are modified by another, causing it to break its own rules.
Violation Example: Font Formatting
This is a deep, long-standing integrity violation in most text editors.
Concept 1: format toggle .
Specification: Applying the bold action twice returns the text to its original state.
Concept 2: typeface .
Specification: Allows selection of a font variant (e.g., "Helvetica Light", "Helvetica Bold", "Helvetica Regular").
The Violation: The typeface concept breaks the format toggle concept.
Start with text in "Helvetica Light".
Apply bold action. Text becomes "Helvetica Bold".
Apply bold action again. The format toggle specification says it should return to "Helvetica Light".
Instead, it returns to "Helvetica Regular". The format toggle concept's integrity has been violated.
Violation Example: Google Drive Synchronization
This is a critical violation that can lead to data loss .
Concept 1: synchronization.
Specification: Maintains two equivalent, complete copies of a file in two places (cloud and client).
Concept 2: cloud app (e.g., Google Docs).
Specification: The "file" is an editable entity in the cloud.
The Violation: Google Drive composes these, but the cloud app concept breaks the synchronization concept. For a Google Doc, the "synced" local file is not a real copy; it is just a link/stub pointing to the cloud version.
The Consequence: A user, believing the synchronization spec was intact, moved their "local" Google Doc files to an external drive (thinking they were moving their copy) and then deleted the cloud versions to save space. Because the local files were just links, they lost all of their data .

The System View: Assembling Applications
This section details how to build an application from a set of concepts, moving from individual units to a complete, functioning system.
Concept Composition
Applications are built by composing concepts. Traditional "client-service" composition doesn't work, because all concepts are user-facing . The mechanism for composition is Synchronization.
Synchronization is a mechanism that ties actions from different concepts together, constraining them to happen in a specific order or at the same time . It removes possible interleavings but never adds new behaviors.
There are three types of composition, from simple to complex.
Type 1: Free Composition
This is the loosest form, where concepts are merged but operate mostly independently. Synchronization is used only for "bookkeeping" to ensure consistency.
Example: todo + label Concepts.
A todo app has add(t) and delete(t) actions.
A label app has affix(i, l) and clear(i) actions.
In a free composition, you only add one synchronization: sync todo.delete(t) with label.clear(t).
Result: This ensures that when a task is deleted, its labels are also cleared. Otherwise, the concepts are "orthogonal" and unaware of each other. This is also called "existence coupling".
Type 2: Collaborative Composition
This is a tighter form where concepts are connected to provide new functionality or automation that neither concept could provide by itself.
Example: todo + email Concepts.
Goal: Create a new todo task by sending an email.
Synchronization: sync email.receive(user, m) with todo.add(m.content).
Result: A new behavior is created from the collaboration of two separate concepts.
Other Uses:
Logging: Syncing app actions with a log concept's record action.
Suppression/Access Control: Syncing an action (e.g., deletePost) with an accessControl concept's grantAccess action .
Mitigation: Editing a YouTube comment (Concept 1) automatically unpins it (Concept 2) .
Type 3: Synergistic Composition
This is the richest and most powerful form of composition. Concepts are so tightly intertwined that one concept enhances the purpose of another, or one concept's mechanism is used to implement another . The resulting whole is greater than the sum of its parts.
Example: todo + label (Synergistic).
Instead of todo having its own pending/done state, we represent that state using the label concept.
Synchronization:
sync todo.add(t) with label.affix(t, 'pending').
sync todo.complete(t) with label.detach(t, 'pending') and label.affix(t, 'done').
Result: This is a synergy. The todo concept is simplified. The label concept is now more powerful, as its find('pending') action (which it already had) is now the way to implement the "show pending tasks" feature.
Prime Example: trash + folder Concepts.
The trash concept (as defined in Section 2) is just a set of items.
In practice (e.g., on a Mac), trash is implemented as a folder.
Result: This synergy is beautiful. The trash concept gets all the folder concept's features for free: users can view items, sort them, etc. A folder action like "Sort by Date Added" synergistically becomes "Sort by Date Deleted" when applied to the trash folder.
Composition Problems
Choosing the wrong level of synchronization is a common design flaw.
Over-Synchronization
This is when concepts are "too tightly coupled," taking control away from the user and forbidding reasonable behaviors.
Example: Apple Calendar's delete and decline.
The Flaw: Originally, Apple Calendar synced the event.delete action with the invitation.decline action .
The Problem: A user could not simply delete an event to tidy their calendar. Deleting always sent a "decline" notice, which was bad for spam invitations (it confirmed your email was active) or social invitations (it seemed rude) .
The Fix: Apple decoupled them (reduced synchronization) and added a dialog: "Delete and Notify" or "Delete and Don't Notify".
Under-Synchronization
This is when concepts are "too loosely coupled," burdening the user with manual work that should be automated.
Example: Google Groups' permission and visibility.
The Flaw: Google Groups had a permission concept ("Who can join?") and a separate directory (visibility) concept ("Who can see group?") .
The Problem: A user could set "Anyone can ask" to join, but if the visibility was set to "Members only," no one could find the group to ask to join. The lack of synchronization between these two settings made the "ask to join" feature useless.
Concept Dependence
Once you have your concepts, you must structure them. Concept Dependence is a contextual relationship, not a code one.
Definition: Concept A "depends" on Concept B if in the context of this specific app, Concept A would not make sense to include without Concept B .
Example: In a social media app, the comment concept depends on the post concept, because you need something to comment on.
The Concept Dependence Diagram
This is a simple diagram that maps these relationships, with arrows pointing from the dependent concept to the one it depends on (e.g., comment -> post).
Core Concepts: The concepts at the bottom of the diagram (with no outgoing dependencies) are the core concepts of the app.
Facebook Core: post
Safari Browser Core: url
Keynote Core: slide
Benefits of the Diagram:
Defines Valid Subsets: Any group of concepts forms a valid, buildable app, as long as there are no dependency arrows pointing out of the group.
Defines a Product Line: The diagram reveals all the possible "lite" and "pro" versions of your product.
Defines an Explanation Order: To teach a user the app, you must explain the concepts from the bottom up (e.g., explain post before you explain comment) .

The Application Layer: Mapping Concepts to the UI
This section covers how the abstract, invisible concepts are connected to the concrete user interface (buttons, screens, etc.). The UI is the mapping from the concept to its physical and linguistic form .
A simple concept can be ruined by a bad mapping.
Mapping Problems and Solutions
Problem: Ambiguous Mappings
The mapping is unclear, leaving the user confused about what action will occur.
Example: Java Installer. A dialog for an upgrade offered two buttons: "Install" and "Remove". This is ambiguous. Does "Remove" remove the old version and install the new one (i.e., a clean install)? Or does it just remove the old version and abort the upgrade? The mapping fails to clarify the underlying actions .
Problem: Complex Concepts
If a concept is inherently complex, the mapping must work to clarify it, often by including an "in-line user manual."
Example: Backblaze's Backup Message.
The Concept: Backblaze's backup process is complex: 1) a periodic scan lists files, 2) a backup uploads those files, 3) a transfer moves them to the restore area .
Bad Mapping: The UI simply said, "You are backed up as of: Today, 1:05 PM". This is false. It implies all files saved before 1:05 PM are safe, but files saved between the scan and the backup are not safe.
Good Mapping: A better mapping would add explanatory text: "Last backup: Today, 1:05 PM. This backup included all files saved prior to the scan that began at 12:48 PM".
Problem: Mapping Complex Compositions (Mismatches)
The hardest mapping problems occur when composing complex concepts. A common failure is to simplify the UI in a way that creates a mismatch with the underlying conceptual structure.
Example: Gmail's Label + Conversation Composition.
Conceptual Reality: The label concept applies to individual messages. The conversation concept groups messages.
The Faulty Mapping: The Gmail UI displays the labels at the conversation level. A conversation shows a label if any message within it has that label.
The Consequence: The mapping is a lie. A user sees a conversation with "hacking" and "meetups" labels. They search for label:hacking AND label:meetups and the conversation disappears. This is because one message had "hacking" and a different message had "meetups," but the UI mapping wrongly implied the conversation had both.
Problem: Unusable "Live" Mappings
A mapping must account for typical usage patterns, even if it means not showing the live state.
Example: The "Live Filtering" Dilemma.
The Scenario: A user filters for "Flagged" emails. They click a message to unflag it .
Naive (Bad) Mapping: The app detects the state change and immediately removes the message from the filtered view.
The Problem: This is unusable. If the unflag was a mistake, the user cannot re-flag it because it has disappeared .
Good Mapping (Apple Mail): The mapping intentionally lies. When the user unflags the message, the flag icon vanishes, but the message stays in the list . It is only removed when the user leaves and re-enters the view. This prioritizes usability over "live" accuracy.
Problem: Dark Patterns (Intentional Obfuscation)
This is when a mapping is intentionally designed to deceive the user and nudge them into actions that benefit the company, not the user.
Example: change.org's "Chip In" Feature.
The Deception: After signing a petition, the user is asked to "chip in $2". The mapping implies this donation is for the petition organizer.
The Reality: The money goes directly to change.org (a for-profit company) to pay for advertising. The mapping obfuscates the true purpose of the donation concept.
Example: Amazon Prime's Signup.
The Deception: Amazon presented two buttons: "Try Prime FREE" and "Continue with FREE One-Day Delivery" .
The Reality: Users seeking to "continue without Prime" would click the "Continue..." button, but both buttons were mapped to the same action: signing the user up for Prime.

Actionable Frameworks for Practitioners
This final section reorganizes the book's key ideas (from Chapter 12) into a series of actionable questions for specific roles.
For Strategists, Analysts, and Consultants
What are the key concepts of our product?
Build a Concept Inventory and a Concept Dependence Diagram . This gives you a bird's-eye view of your functionality and identifies your core concepts.
What are the key concepts of our competitors?
How do they differ? Is their success due to a single, powerful concept?
What is the purpose of each concept?
Does this purpose align with the product's larger goals? .
Are our concepts shared across our product family?
Are the style and format concepts in Word, Excel, and PowerPoint consistent? Or do arbitrary differences create friction for users?.
For Interaction Designers & Product Managers
Are the concepts consistently conveyed?
Does our UI (the "system image") successfully teach the user the correct conceptual model?.
Are any of our concepts overloaded? (Principle of Specificity)
Is there a concept (like Twitter's old favorite) that serves multiple, conflicting purposes?.
If so, split it into simpler, more coherent concepts.
Are any of our concepts redundant? (Principle of Specificity)
Do we have two features (like Gmail's labels and categories) that do the same job?.
If so, eliminate one and unify the design.
Are any of our concepts unfamiliar? (Principle of Familiarity)
Did we invent a novel concept (like PowerPoint sections) when a familiar one (like Keynote's groups) would have worked better?.
Do we have over- or under-synchronization? (Composition)
Are we taking away user control by coupling concepts too tightly? (e.g., Apple's delete and decline) .
Are we burdening the user by failing to couple concepts? (e.g., Google's permission and visibility) .
Are we preserving Concept Integrity? (Principle of Integrity)
Does one concept's behavior (like typeface) break the rules of another (like format toggle)? .
Is our concept wisdom documented?
The subtle design decisions behind a concept (like Apple Numbers' range concept) can be lost forever during a rewrite if not explicitly documented . Maintain a concept catalog.
For Technical Writers, Trainers & Marketers
Are our support materials organized around concepts?
Don't organize by UI. Organize by the user's need and the concept that serves it.
Do we give clear purposes for concepts?
Never just explain what a button does. Always explain why the concept exists—what purpose it fulfills for the user.
Do we explain the operational principle?
Don't just list actions. Show the user the key archetypal scenario for using the concept to achieve its purpose.
For Programmers and Architects
What set of concepts forms the Minimum Viable Product (MVP)?
Use the Concept Dependence Diagram to find a "consistent subset" (a set of core concepts with no outward dependencies) to build first .
Can we avoid reinventing the wheel?
By implementing a familiar concept, you can often reuse existing libraries or proven design patterns.
Is our code modularized by concept?
Code should be structured around concepts, not just data objects .
Warning: A traditional Object-Oriented approach can get this "upside-down". For example, a Post object might have an addComment method. This creates a code dependency Post -> Comment. But the concept dependency is Comment -> Post. This mismatch makes code brittle and hard to subset .
How are synchronizations implemented?
Complex synchronizations might suggest an event bus, callbacks, or an implicit invocation architecture rather than hard-coded calls .
Can concept design flaws be detected in code?
Complex, conditional logic in an action might be a "code smell" that indicates an overloaded concept .

Also, this is the project I am trying to build
SBU Academics Management (SAM) - Design Document v2

Team: Full Stack Overflow
Date: 2025-11-13
Based on: Project Requirements (2025-11-12) & The Essence of Software

1. Overview & Core Principles

This document outlines the design for the SBU Academics Management (SAM) system. The previous design focused on a microservice architecture and database schema. This revised design is "concept-first," based on the principles of The Essence of Software (EoS) [cite: 8-14].

Our core principle is that a successful design is built from a set of clear, independent, and user-facing concepts. The implementation (API, database, algorithms) is chosen to serve these concepts, not define them [cite: 17351-17356].

The core purpose of SAM is to enable students and staff to successfully manage the entire academic lifecycle, from course planning and registration to degree completion, while ensuring all university rules are enforced.

To achieve this, we have identified a set of core concepts. The system's architecture is defined by how these concepts are composed and presented to the user.

2. Concept Inventory & Dependence Diagram

The functionality of SAM is broken down into a "concept inventory" (EoS, Chapter 3) [cite: 662-841]. Each concept is a self-contained unit of functionality with a single, clear purpose (EoS, Specificity Principle, Chapter 9) [cite: 3014-3037].

The diagram below (EoS, Chapter 7) [cite: 2470-2521] shows the dependencies between these concepts. An arrow from A to B means that concept A depends on concept B to fulfill its purpose (i.e., A wouldn't make sense to include in the app without B).

Core Concepts (The Foundation):

User: The core concept for identity and roles (Student, Advisor, etc.).

Course_Catalog: The source of truth for all course information.

Class_Schedule: The source of truth for all term-specific class offerings.

Dependent Concepts (Building on the Core):

Student_Profile: Depends on User to track academic-specific data (GPA, credits).

Degree_Requirement: Depends on Course_Catalog to define the rules for a program.

Academic_Program: Depends on User and Degree_Requirement to manage a student's declared majors/minors.

Registration: The central "action" concept. Depends on User (who is registering), Class_Schedule (what they register for), and Student_Profile (to check standing).

Registration_Hold: Depends on User. Its purpose is to block Registration.

Waitlist: Depends on Class_Schedule. Its purpose is to manage demand for full classes, interfacing with Registration.

Waiver: Depends on User and Degree_Requirement (or Course_Catalog for prereqs). Its purpose is to officially override a rule.

Academic_Plan: Depends on User, Course_Catalog, and Degree_Requirement to enable future planning.

Audit_Log: Depends on User (and all other concepts) to track changes.

This "concept-centric" view replaces the original microservice diagram as the primary architectural artifact. The implementation can still use microservices, but each service should be responsible for one or more of these concepts, not just a random collection of functions.

3. Detailed Concept Definitions

This section provides the formal definition for each key concept, following the structure from EoS, Chapter 4 [cite: 856-962].

3.1. Concept: User

Purpose (Req 2) [cite: 3516-3525]: To establish and manage the identity and permissions of all people who interact with the system.

State:

users: A set of all users.

roles: A mapping from each User to their single role (Student, Instructor, Advisor, Registrar).

advisor_details: A mapping for Users with role Advisor to their level (University, College, Department) and affiliation (SBU, CAS, CSE).

Actions:

import_users(file): (Registrar) Creates new users from a YAML file. Warns if a user (by SBU ID) already exists.

search_users(query): (Registrar, Advisor) Finds users by name, role, major, etc.

export_user(user): (Registrar) Exports a single user's data as a YAML file.

authenticate(token): (All Users) Verifies Google OAuth token and identifies the system User.

Operational Principle: A Registrar can import_users(file) to create a new User with role Student. That Student can then authenticate() to access the system. The Registrar can then search_users(name) to find that student and export_user() to get their data.

3.2. Concept: Course_Catalog

Purpose (Req 3.1) [cite: 3540-3548]: To be the single source of truth for all courses, including their descriptions, credits, and rules (prerequisites, corequisites, anti-requisites).

State:

courses_by_term: A mapping from a Term to the set of Courses available in that catalog.

course_data: A mapping from each Course to its data (subject, number, name, description, credits, prereq_rules, coreq_rules, anti_req_rules, sbcs, classie_link).

Actions:

scrape_catalog(term, subjects): (Registrar) Populates the courses_by_term and course_data for a given term and subject list by scraping the SBU website. This action is idempotent (can only be run once per term/subject) to ensure stability (Req 3.1) [cite: 3540-3548].

search_catalog(query): (All Users) Finds courses matching criteria (subject, SBC, keyword).

get_course_info(course, term): (System) Finds the course_data for a course. If the requested term catalog is missing, it returns data from the nearest available term (Req 3.1) [cite: 3540-3548].

Operational Principle: A Registrar scrape_catalog('Fall 2025', ['CSE']). A Student can then search_catalog(SBC='TECH') and see 'CSE 416'. The system will then use get_course_info('CSE 416', 'Fall 2025') to retrieve its prerequisites during registration.

3.3. Concept: Class_Schedule

Purpose (Req 3.2) [cite: 3549-3551]: To define the specific offerings of courses in a given term, including their times, locations, and instructors.

State:

classes_by_term: A mapping from a Term to a set of Classes.

class_data: A mapping from each Class to its details (course_ref, section_num, instructor, meetings, capacity, room_id).

room_capacities: A mapping from room_id to a capacity (loaded from YAML).

Actions:

import_schedule(file, term, subjects): (Registrar) Parses a PDF file to populate classes_by_term and class_data. Drops old data for that term. Sets capacity from room_capacities or defaults to 20.

edit_capacity(class, new_capacity): (Registrar) Updates the capacity for a single Class.

search_schedule(query): (All Users) Finds classes matching criteria (term, subject, day, instructor).

Operational Principle: A Registrar import_schedule('Fall2025.pdf', 'Fall 2025'). The system creates a Class for 'CSE 416-01' with capacity = 120 (from the room DB). The Registrar can then edit_capacity('CSE 416-01', 130).

3.4. Concept: Registration

Purpose (Req 6) [cite: 3592-3619]: To allow a student to enroll in a class, drop a class, or withdraw from a class, provided all rules are met.

State:

enrollments: A mapping from a Class to the set of Students registered in it.

enrollment_status: A mapping from a Student and Class to their status (registered, dropped, withdrawn, completed).

Actions:

register(student, class): (Student) Adds student to enrollments(class) and sets status to 'registered'.

drop(student, class): (Student) Removes student from enrollments(class) and sets status to 'dropped' (if before add/drop deadline).

withdraw(student, class): (Student) Removes student from enrollments(class) and sets status to 'withdrawn' (if after add/drop deadline but before W deadline).

override_enroll(student, class): (Registrar) A special action that adds student to enrollments(class) directly (Req 6.6) [cite: 3615-3619].

Operational Principle: A Student register(student, 'CSE 416-01'). The enrollments for 'CSE 416-01' now include the student. Later, the Student can drop(student, 'CSE 416-01'), which removes them.

3.5. Concept: Registration_Hold

Purpose (Req 6.5) [cite: 3611-3614]: To block a student from registering for classes until a specific condition is resolved.

State:

active_holds: A mapping from a Student to a set of Holds.

hold_data: A mapping from a Hold to its type (Academic, Financial) and details.

Actions:

place_hold(student, type, note): (Advisor, Registrar) Adds a new Hold to active_holds(student).

remove_hold(hold): (Advisor, Registrar) Removes a Hold from active_holds.

check_holds(student): (System) Returns true if active_holds(student) is not empty.

Operational Principle: An Advisor place_hold('student_A', 'Academic'). The system, seeing an active hold, will now block any Registration.register actions from 'student_A'. Once the Advisor remove_hold(hold), the student can register again.

3.6. Concept: Waitlist

Purpose (Req 6.6) [cite: 3615-3619]: To manage student demand for a full class in a fair, first-in-first-out manner.

State:

waitlists: A mapping from a Class to an ordered list of Students.

waitlist_capacity: A mapping from a Class to its max waitlist size (20% of class capacity).

Actions:

add_to_waitlist(student, class): (System) Appends student to the waitlists(class) list, if space is available.

remove_from_waitlist(student, class): (Student) Removes student from waitlists(class).

get_next_student(class): (System) Returns the first Student from waitlists(class).

promote(student, class): (System) An action that signifies the student has been moved from the waitlist to registered.

Operational Principle: A Student attempts to register for a full class. The system add_to_waitlist(student, class). When another student drops, the system get_next_student(class) (which returns our student) and automatically promote(student, class).

3.7. Concept: Academic_Plan

Purpose (Req 8) [cite: 3620-3638]: To allow a student to plan a schedule for all future terms up to graduation and check its validity against all academic requirements.

State:

plans: A mapping from a Student to their Plan (a set of Courses for future Terms).

plan_preferences: A mapping from a Student to their preferences (desired_courses, avoid_courses, workload_limits, grad_term).

Actions:

update_plan(student, new_plan): (Student) Replaces the student's Plan.

update_preferences(student, new_prefs): (Student) Replaces the student's plan_preferences.

validate_plan(student): (Student) Checks the student's Plan against all known requirements (prereqs, degree rules, time conflicts) and returns a list of issues.

auto_plan(student): (Student) Generates a new Plan based on the student's plan_preferences and current Student_Profile (transcript, declared programs).

Operational Principle: A Student sets their update_preferences(grad_term='Spring 2027'). They then run auto_plan(), which generates a Plan. The student update_plan() to accept it. They can then run validate_plan() at any time to see if changes to the Course_Catalog have affected it.

(Note: Other concepts like Degree_Requirement, Student_Profile, Waiver, and Audit_Log would be defined in this same rigorous format.)

4. Concept Composition & Synchronization

The real functionality of SAM comes from composing these simple concepts (EoS, Chapter 6) [cite: 1984-2005]. Our architecture is not a set of siloed services, but a single system where concept actions are synchronized.

This approach replaces complex, monolithic algorithms with clear, composable rules.

4.1. The Registration Composition (Req 6) [cite: 3592-3619]

This is the most critical composition in the system. The student's simple Registration.register(student, class) action is synchronized with many other concepts.

Original Design Issue: Your v1 design had an overloaded Registration concept [cite: 5851-5883] trying to do everything.

EoS Solution: We use Collaborative Composition (EoS, Chapter 6) [cite: 2064-2131]. The Registration concept is simple (add/remove from a set), and a central "Rules Engine" (your name for it, which is good) synchronizes it with other concepts.

When a Student executes Registration.register(student, class):

Sync (Trigger): The system first triggers Registration_Hold.check_holds(student).

Rule: If true, the Registration.register action is blocked. This avoids an Integrity Violation (EoS, Chapter 11) [cite: 2984-3013] where a student with a hold could register.

Sync (Trigger): The system then triggers checks against Course_Catalog and Student_Profile (for prereqs, coreqs, anti-reqs) and Class_Schedule (for time conflicts).

Rule: If any rule fails, the system checks for a Waiver. If no Waiver exists, Registration.register is blocked.

Sync (Trigger): The system then checks Class_Schedule.class_data(class).capacity against Registration.enrollments(class).count.

If (space available): The Registration.register action proceeds.

If (full): The Registration.register action is blocked and the system synchronously triggers Waitlist.add_to_waitlist(student, class).

This is a critical insight: The user's single click (register) is mapped to two different concept actions (register or add_to_waitlist) based on the state of the system. This is a clean Concept Mapping (EoS, Chapter 8) [cite: 2602-2713].

4.2. The Waitlist Promotion Composition

Under-synchronization Risk (EoS, Chapter 6) [cite: 2261-2311]: If a student Registration.drop's a class, how does the waitlisted student get in? If this is not automatic, it's a usability failure.

EoS Solution: We create a synchronization:

When Registration.drop(student_A, class) OR Registration.withdraw(student_A, class) occurs:

Sync (Trigger): The system get_next_student(class) from the Waitlist.

Sync (Trigger): If a student_B is returned, the system automatically executes Waitlist.promote(student_B, class), which is synchronized with Registration.register(student_B, class).

A notification is sent to student_B.

4.3. The Plan and Catalog Validation Composition

Integrity Violation Risk (EoS, Chapter 11) [cite: 2984-3013]: A student has a valid Academic_Plan. A Registrar then scrape_catalog() for a new term, changing a prerequisite for a planned course. The student's plan is now silently invalid.

EoS Solution: We create a synchronization to maintain Concept Integrity:

When scrape_catalog() OR import_schedule() OR import_degree_requirements() occurs:

Sync (Trigger): The system finds all Students whose Academic_Plan depends on the changed data.

Sync (Trigger): The system automatically re-runs Academic_Plan.validate_plan(student) for all affected students.

Sync (Trigger): The Student_Profile for these students is updated with a "Plan is invalid" status, and a notification is sent.

5. Concept Mapping (UI & API)

This section re-frames the UI, API, and Algorithms sections from the original design as the mapping of our abstract concepts to a concrete implementation (EoS, Chapter 8) [cite: 2602-2713].

5.1. UI Design Rationale

The UI's primary goal is to make the state and actions of the underlying concepts visible and intelligible to the user.

Clarity over Density: The old SOLAR system fails because it's a "purposeless" UI (EoS, Chapter 5) [cite: 1229-1262]. It's just a raw mapping to database fields.

Our Design: The SAM UI will be organized around concepts.

The "Registration" page is a mapping of the Registration, Class_Schedule, and Waitlist concepts. When a student clicks "Register" on a full class, the UI will not show an error, but will show a success message: "You have been added to the waitlist (Position #3)." [cite: 2602-2713] This clearly maps the user's single action to the correct underlying concept.

The "Degree Audit" page is a mapping of the Student_Profile (transcript) and Degree_Requirement concepts.

The "Plan" page is a mapping of the Academic_Plan concept. The auto_plan action will be a primary button, fulfilling its purpose.

5.2. Backend API

The API is the technical mapping of concept actions. The original API design is largely good, but we will refactor it to be concept-oriented.

Old API: POST /students/{studentId}/plan/auto

New (Concept-mapped) API: POST /api/concept/Academic_Plan/actions/auto_plan

(Note: A resource-based REST API like POST /api/students/{id}/plan/generate is also fine, as long as the implementation in the controller cleanly calls the Academic_Plan.auto_plan() action.)

The key is that the "Planner Engine" service implements the Academic_Plan concept. The "Registration" service implements the Registration, Waitlist, and Hold concepts and their composition.

5.3. Algorithms (Auto-Planner)

The algorithms in the original design's Section 6 are an implementation of the Academic_Plan.auto_plan() action.

Concept: Academic_Plan

Action: auto_plan(student)

Implementation: The described algorithm (build graph, find needed, greedy set cover, place term-by-term) [cite: 5218-5849] is a sound implementation for this action. It correctly uses other concepts as data sources (e.g., it reads state from Course_Catalog, Degree_Requirement, and Student_Profile). This algorithm is not the design; it is the implementation of one action within the design.

6. Persistence Model

The SQL schema from the original design (Sections 9) [cite: 6185-7561] is a reasonable persistence strategy for the state of our concepts.

EoS Principle: The database stores the state of the concepts [cite: 902-911]. The CREATE TABLE enrollments... CREATE TABLE waitlist_entries is the SQL implementation of the Registration.enrollments and Waitlist.waitlists concept states.

Refinement: We will add a version column to tables that map to editable concepts (like Academic_Plan or Class_Schedule) to enable the optimistic concurrency control mentioned in Section 11 [cite: 8251-8299]. This is a good implementation detail that supports the integrity of the concepts.

7. Concurrency & Integrity

The original document's Concurrency section (Section 11) [cite: 8251-8299] is a good analysis of implementation risks. In EoS terms, this is about preserving Concept Integrity (EoS, Chapter 11) [cite: 2984-3013] at the code level.

Race Conditions: The example of two students registering for the last seat is a potential integrity violation of the Class_Schedule concept's capacity state.

Solution: The v1 design's solution (optimistic concurrency, locks for imports) is sound. A database-level transaction (BEGIN... COMMIT) that wraps the *entire composition
 this is what my professor gave me Project Requirements: SBU Academics Management (SAM)
CSE 416: Software Engineering, Fall 2025
Professor Scott D. Stoller
version: 2025-11-12
1 Overview
SAM supports class registration and checking degree requirements, as detailed below.  It will be used by students, instructors, academic advisors, and registrars.  Its functionality should be consistent with SBU policies and practice except for the limitations stated below.  It’s sufficient for SAM to support undergraduate degree programs in CAS and CEAS.  SAM does not explicitly exclude other colleges and schools but does not need to support any additional features (e.g., additional kinds of degree requirements) required to fully support them.
2 User Management
SAM supports four roles: student, instructor, academic advisor, and registrar.  Each user has exactly one role.  Academic advisors have a level: university, college, or department.  Each advisor is affiliated with an academic unit: SBU for university-level advisors, a college/school for college-level advisors, and a subject for department-level (a.k.a. subject-level) advisors.
2.1 Import user data. Registrars can import user data from an uploaded YAML file, whose format is defined by the sample data file users1.yaml in Google Classroom.  Users are uniquely identified by their SBU ID.  If a user listed in the file already exists in the database, SAM displays a warning and does not import the entry for that user.  During import of user data, if a student’s class schedule is inconsistent with previously imported class schedules for the relevant terms, display warnings indicating the inconsistencies, but keep the student’s class schedule unchanged.  Similarly, a student’s imported class schedule may include terms for which no class schedule has been imported.  Degree requirement checking should ignore these inconsistencies.
2.2 Search for users.  Registrars can search for users by name (including matching a prefix of the name), role, etc.  Registrars and academic advisors can search for students using a variety of filter criteria: name, major, minor, etc.
2.3 Export user data.  A registrar can download a yaml file, in the format defined by users1.yaml,  containing data about a selected user.
3 Course catalogs, class schedules, and academic calendars
SAM provides searchable course catalogs and class schedules.  A class is an offering of a course: a particular section in a particular term.  A term is identified by semester and year.   The searches are performed on SAM’s internal database, which is populated by importing data.  SAM does not provide a UI for editing course catalogs, class schedules, or academic calendars, except that the registrar can edit class capacities (enrollment limits).  When importing a course catalog or class schedule, the registrar specifies the term it is for and a set of subjects (e.g., MAT); SAM imports courses or classes for only those subjects.  If a class schedule for the same term was previously imported, the old data is dropped before the new data is imported.
3.1 Scrape course catalog.  A registrar can scrape part of the online undergraduate course catalog for a term.  The registrar specifies a term and a set of subjects.  SAM scrapes information about all courses in those subjects from SBU’s online course catalog and associates it with the specified term.  For example,  information about CSE courses can be scraped from this page.  Scraped information includes the subject (e.g., CSE), course number, course name, description, prerequisites, corequisites, anti-requisites, advisory prerequisites, SBCs satisfied, and number of credits.  Displayed information about a course includes a link that opens a new tab showing evaluations of offerings of the course in Classie; for example, the entry for CSE 416 would include this link (the student needs to login to Classie manually).  If SAM needs course information for a term whose course catalog has not been scraped, SAM uses the information from the nearest term for which a course catalog is available.  For example, if only the Fall 2025 course catalog has been scraped, then SAM will use the information from it when checking prerequisites for classes in other terms as well.  SAM can prohibit changes to the course catalog for a given subject and term by allowing it to be scraped at most once.
It's sufficient for SAM to correctly interpret course descriptions for the following subjects: BIO PSY CSE ECO AMS POL (based on data from here, these are the 6 largest majors in CAS or CEAS).  For courses in other subjects whose prerequisites (or other information) are in a format different from those in the subjects listed above, it's OK for the system to print a warning and mark the information as unknown.  SAM simplifies prerequisites involving placement exams, with a warning.  For example, for AMS 103, the prerequisite “Level 2+ or higher on the mathematics placement examination or MAT 123 or higher” should be simplified to "MAT 123 or higher", with a warning. 
3.2 Import class schedule and edit class capacity.  A registrar can import the schedule of undergraduate classes for a term by uploading a PDF obtained from SBU’s Course Offerings by Term page and optionally specifying a set of subjects for which class schedules should be imported (by default, classes for all subjects are imported).  SAM allows importing classes whose instructors are not listed in the user database.  A registrar can edit the capacity of a class.  For simplicity, SAM can prohibit changes to the class schedules for a term after class registration for that term has opened.  SAM should allow changes to a class schedule after the schedule has been used in the construction of some students' plans for the next term and before registration for that term has opened.
3.3 Search the course catalog and class schedule.  Users can search the course catalog and class schedule on multiple fields simultaneously, for example, search a class schedule for classes whose course description includes “AI”, SBCs include TECH, and days-of-week are among Tue,Thu,Fri.
3.4 Import academic calendar.  A registrar can import the academic calendar for a term by uploading a YAML file whose format is defined by the sample data file academic_calendar_Fall2025.yaml in Google Classroom.  SAM does not support time-of-day deadlines in academic calendars; for example, a student can add or drop a course any time (even after 4pm) on the day that late registration ends.
4 Degree requirements, majors, and minors
4.1 Import degree requirements.  Registrars can import degree requirements for majors and minors from an uploaded YAML file.  The file also specifies the requirements for admission to restricted majors and minors.  The file should specify the requirements version, i.e., the term in which those requirements went into effect.  The format is left to the discretion of SAM’s developers.   It is sufficient for the format to be flexible enough to express the degree and admission requirements for majors and minors in the six subjects listed in Section 3.1 (for BIO and PSY, it is sufficient to support the BA).  File(s) containing the requirements for those 6 subjects should be included in your hw9-code3 submission.  Use the current (Fall 2025) degree requirements, except use the Fall 2024 degree requirements for CSE.  SAM can prohibit changes to these requirements for a given term by allowing them to be imported at most once.  University-level degree requirements, such as the Stony Brook Curriculum (SBC) and minimum total credits for graduation, are read from a YAML file on the server, whose format is defined by the sample data file graduation_requirements.yaml in Google Classroom.  SAM can assume the university-level graduation requirements do not change.
4.2 Declare majors and minors. Students can declare up to 2 majors and 3 minors, consistent with the policies in the Undergraduate Bulletin, especially the Selecting an Academic Program section.  Requests to declare a major or minor effective in a particular term can be submitted between the dates specified in the university’s academic calendars and require approval from a department-level academic advisor.  Restricted majors and minors (such as CSE) have course requirements or GPA requirements for admission; department-level academic advisors can waive these requirements.  Requests to transfer into CEAS (where all majors are restricted), by declaring an AOI or a major in CEAS without currently being an AOI or a major in CEAS, requires approval of a CEAS academic advisor.   SAM does not support honors programs, specializations, or 5-year BS/MS programs.
5 Student profiles
SAM displays student profiles that contain the following information.  A student’s profile is visible to the student, registrars, and all academic advisors at all levels (not only academic advisors in the student’s department or college; this supports advising students considering changing majors or colleges).
•	all of the kinds of information about students in user data files.
•	term GPA, cumulative GPA and cumulative credits as of the end of each completed term
•	class schedule, with class meeting times and locations, for any term for which the schedule of classes is available
•	status of each requirement for admission to the student’s declared or planned restricted majors and restricted minors.  
•	status of each degree requirement for the student’s declared or planned majors and minors, indicating the specific class(es) used to satisfy the requirements, where appropriate.  Registrars can waive and un-waive degree requirements (see details below).
•	class standing  (U1-U4)
•	registration holds
•	waived time conflicts
The status of a requirement can be “satisfied”, “pending” (will be satisfied if an ongoing class is completed with an adequate grade), or “unsatisfied”.
A profile also includes an audit log of all changes to a student’s declared majors and minors, major and minor requirement versions, waived degree requirements, class schedule, registration holds, waived course prerequisites and corequisites, waived time conflicts, and grades.  Each log entry includes the performing user and a timestamp.  When a registrar or academic advisor performs one of these logged actions, they can write a note that is included in the log entry.  When a student or academic advisor views a log entry for an action performed by a registrar, the performing user is shown simply as “registrar”.
The registrar waives a degree requirement indirectly, by waiving individual courses as if the student had taken the courses and received an adequate grade.  Such courses contribute to satisfying major-specific degree requirements such as "at least 12 credits of upper-division CSE classes".  They do not contribute to satisfying the university-level minimum credits needed for graduation.  They do not affect the student's GPA.  SAM does not need to allow the registrar to waive other types of degree requirements, such as the mandatory minor within CAS for the BIO BA.
6 Registration for and withdrawal from classes
Students can register for and withdraw from classes, consistent with the policies in the Records & Registration section of the Undergraduate Bulletin, except that (for simplicity) SAM does not support (1) restrictions on registering for a class to retake it or (2) section/credit changes (using the Section/Credit Change Form).  
6.1 Registration schedule. Registrars specify the enrollment period for each category of students.  The categories of students are defined by class standing and registrar-specified thresholds on cumulative credits.  It is sufficient to support one credit threshold for each class standing, e.g., U4 with < 100 credits and U4 with >= 100 credits, and similarly for U3, U2, and U1 (as announced in the Google Group on Oct 18).
6.2 Class capacity.  Unfortunately, class schedule PDFs do not show class capacities.  Therefore, SAM determines the capacity of each class based on its location specified in the schedule of classes.  If the location is a room in SAM’s room capacity database, the capacity is set to the room capacity, otherwise it is set to 20.  Registrars can manually edit class capacities, since these defaults are not always correct.  Room capacities are read from a YAML file stored on the server.  The format is defined by the sample data file rooms1.yaml in Google Classroom.  
6.3 Prerequisites, corequisites and anti-requisites.  SAM enforces prerequisites, corequisites and anti-requisites of all forms (courses completed with at least a specified grade, U3 standing, etc.), except prerequisites involving D.E.C. categories, placement exams and other forms of placement, membership in honors programs and similar programs, prerequisites of the form “any other course satisfying the … requirement”, and, for teaching practicums, the grade in the course for which the student will be a TA.  Registrars and academic advisors can waive and un-waive prerequisites, corequisites, and anti-requisites.  Department-level academic advisors can grant department permission to register for courses in the subject for which they are an advisor.  Note that a student can register for a class with its prerequisites in progress.  If the student does not complete those prerequisites with the required grade, SAM should remove the student from the class and notify the student.  It's fine for SAM to do this when the unacceptable grade for the prerequisite is submitted, or for SAM to allow the registrar to run a prerequisite check between terms for this purpose.
6.4 Time conflicts.  SAM prevents time conflicts in class schedules, except when a student requests a waiver of a time conflict, and the request is approved by the instructors of both conflicting classes and a department-level academic advisor (it should actually be the undergraduate program director; this is close enough); see these PDF forms for reference but replace them with a web-based version.  
6.5 Registration holds. SAM supports two types of registration holds: academic advising holds, managed by academic advisors, and financial holds, managed by registrars. An advising hold can be placed or removed by a university-level academic advisor, a college-level academic advisor in the same college as the student, or a department-level advisor in the same department as a student, based on the student’s majors.  SAM does not track academic standing or restrict registration for classes based on academic standing.
6.6 Waitlists. SAM, like SOLAR, supports automated waitlists.  The waitlist capacity is 20% of the class capacity.  Note that registrars can give a student permission to register for a class, even if the class is full (thereby overriding its capacity) and students are on the waitlist.
7 Rosters and Grading
SAM supports the grades listed in the Grading and the Grading System section of the Undergraduate Bulletin, except the Q grade.  All rosters are visible to registrars.  Academic advisors can view rosters for classes in their academic unit.  An instructor can view rosters for their classes and submit grades.  Submitted grades are visible in rosters and student profiles.
SAM handles Incompletes in the following simpler manner.  An instructor can submit a final grade to replace an I at any time; this does not require approval of the registrar.  SAM does not support grade changes for grades other than I.
8 Class Schedule Planning
SAM allows students to enter planned schedules (“plans”) for future semesters.  SAM warns of unsatisfied course prerequisites and corequisites, and violated anti-requisites, and shows the expected final status of each degree requirement, i.e., the status after the last term in the plan, assuming all classes are completed with adequate grades.  SAM can also highlight non-required classes in a plan, i.e., classes that do not contribute to satisfying a prerequisite or a degree requirement other than the minimum required credits for graduation.
In addition, SAM features an auto-planner that tries to complete a student’s (empty or partially completed) plan to satisfy all graduation requirements and degree requirements except the minimum required credits for graduation (course selection to satisfy that requirement is easy).  The student may specify a set of courses to include, a.k.a. desired courses, and set of courses to avoid. The auto-planner adds to a plan only desired courses and courses that contribute to satisfying a prerequisite, corequisite, graduation requirement or degree requirement.  The auto-planner displays the proposed plan and asks the student whether it is satisfactory.  If so, the student’s plan is updated; if not, it is left unchanged.
The student must specify their planned term of graduation and a limit on the workload in each term.  The limit can be different in different terms; for example, it may be zero in a summer term in which the student plans to do an internship.   By default, the workload in a term is the number of credits taken in that term.  Students can customize this by providing workload estimates for selected courses; for example, a student may specify that the workload of CSE 416 is 3.2 (instead of the number of credits, 3).
The auto-planner assumes that the most recent available course catalog remains unchanged in subsequent terms.  It ensures the proposed plan is consistent with class schedules in future terms for which the class schedule is available.  It assumes that the courses offered in a term whose class schedule is unavailable are the same (though not necessarily in the same timeslots) as in the most recent class schedule for a term with the same semester.  For example, it assumes that the courses offered in Fall 2026 are the same as in Fall 2025 (regardless of whether a Spring 2026 class schedule is available).  It optimistically ignores the possibility of time conflicts in terms for which the class schedule is unavailable.
A plan might become invalid if a new class schedule or course catalog is uploaded, the student receives a low grade, etc.  A student can run a “validate plan" function that checks whether the student’s plan is valid and, if it is invalid, lists the reasons.
9 Other requirements
9.1 Authentication.  All users login with Google.  In deployment, login would be limited to Google accounts with @stonybrook.edu email addresses.  To simplify testing, your system can allow login with any Google account.  For convenience during testing, especially automated testing and testing during demos (which involves numerous users), it is recommended for SAM to support a configuration option that bypasses Google login.
9.2 Usability.  The system provides an easy-to-use, user-friendly web interface consistent with established UI design principles. The system handles invalid inputs gracefully and provides informative error messages.  For example, if an imported YAML file contains some invalid entries, the system imports the valid entries and alerts the user about which entries are invalid and why. The system displays help text to guide users where appropriate.
9.3 Current date.  To support testing, SAM always determines the current date by calling a wrapper around the relevant library function.  SAM provides a UI that allows registrars to configure the wrapper function to return the actual current date or a manually specified date
9.4 Deployment.  End users access SAM through a web interface.  They do not need to install any software, other than a web browser, on their computer.
