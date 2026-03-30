# EXERCISE SCREEN FIXES (QA FEEDBACK)

I tested the app and found two issues during the exercises that need fixing:

## 1. UI Fix: Feedback Banner Overflow

When an answer is submitted, the feedback banner ("✓ Bravo !" or "X La bonne réponse était...") overflows the screen boundaries and sticks to the "Continuer" button.

- **Fix:** Wrap the feedback text in a proper Card container. It must respect the screen's main horizontal padding (e.g., 24px), have a `borderRadius` of 16px, and have a `marginBottom` of 16px so it doesn't touch the "Continuer" button. It should look like a distinct, floating feedback alert.

## 2. Logic Fix: Disable Interactive Harakats for specific exercises

Currently, the "Tap to reveal/Hide" global setting for Harakats applies even during lessons *teaching* the Harakats. This allows users to cheat or break the UI by tapping the text.

- **Fix:** Add an override prop (e.g., `disableInteraction` or `forceStaticDisplay`) to the Arabic text component. When an exercise is explicitly testing Harakats or letters (where the diacritics are the core subject), pass this prop to `true`. This must bypass the user's global display settings and render the text statically, exactly as the exercise requires, disabling any `onPress` toggle events.

# THEORY LESSON REDESIGN: FROM SCROLL TO "STORY" FORMAT (STEP-BY-STEP)

The current theory screens (e.g., explaining Fatha, Kasra) suffer from a "False Bottom" UX issue and cognitive overload due to long vertical scrolling. We need to restructure this into a premium, paginated "Story" format (Slide by Slide).

## 1. Global Architecture (No Vertical Scroll)

- Replace the main `ScrollView` with a Step-based renderer (or a horizontal pager `FlatList`).
- **Screen Layout:** Fixed height. The content must fit entirely within the screen between the Header and the Bottom CTA. NO vertical scrolling required.
- **Header:** Keep the progress indicator (e.g., `1 / 3`), but add small dots indicator (Carousel pagination dots) below the title to show the user they are in a multi-step flow.

## 2. Content Breakdown (The 3 Slides Rule)

Break the existing long content into distinct steps:

- **STEP 1: Introduction (The Core Concept)**
    - Hero Area: The large Arabic letter/diacritic centered in the Sand-colored card.
    - Text Below: Only the definition (e.g., "Fatha"), the Sound ("Voyelle courte /a/"), and Position.
    - CTA Button: "Suivant →" (Primary button).
- **STEP 2: Context & Examples**
    - Text Area: The explanatory paragraph (e.g., "La fatha est la voyelle courte la plus fréquente...").
    - Visual Area: The "Sur d'autres lettres" (On other letters) component showing the horizontal list of examples.
    - CTA Button: "Suivant →"
- **STEP 3: Mastery (Comparisons)**
    - Visual Area: The Comparison grid showing the base letter vs. the diacritic versions (e.g., Fatha vs Kasra vs Damma). Keep it clean and aligned.
    - CTA Button: "Commencer les exercices →" (This signals the end of the theory).

## 3. Interaction & Animation

- When clicking "Suivant", transition to the next step using a smooth `FadeInRight` or `SlideInRight` animation (via Reanimated) to mimic flipping a flashcard or moving to the next story slide.
- The Bottom CTA area remains fixed above the safe area. Only the content inside the card changes.

# UI REFINEMENT: THE PHONETIC COMPARISON MATRIX

The current "Comparaison" section uses stacked rows of individual large cards. This takes up too much vertical space and is hard to scan. We need to replace it with a unified, premium "Phonetic Matrix" (Grid) that fits perfectly inside "STEP 3" of our new Story format without scrolling.

## 1. The Container (The Matrix Card)

- Remove all individual card backgrounds for the letters.
- Wrap the entire comparison in ONE large elegant container: Background `background.card` (#FFFFFF), `borderRadius` 16px, `shadow` subtle, and a 1px border `background.group` (#F5F2EA).

## 2. The Grid Layout

- Implement a strict Grid/Table layout (Columns = Base Letters like Ba, Ta, Sa; Rows = Harakats like Fatha, Kasra, Damma).
- **Row Headers (Left column):** Display the Harakat name (e.g., "Fatha") in `text.secondary`, `uiSmall`, vertical-align center. Add a very subtle light background tint (e.g., `brand.light` at 30% opacity) just for this header column to separate it from the data.
- **Cells (The combinations):** Center the content. Large Arabic letter (`arabicBody` ~28px, `text.primary`), with the transliteration (e.g., "ba", "bi", "bu") directly below it in `uiTiny` (`text.secondary`).
- **Separators:** Use ultra-thin 1px lines (`background.group` / #F5F2EA) between rows and columns to create a clean spreadsheet look without visual clutter.

## 3. Interaction & Polish

- Add a micro-interaction: When a user taps a specific cell in the grid, it plays the audio for that specific syllable, and the cell's background briefly flashes `brand.light`.
- Ensure the matrix is compact enough to fit perfectly on standard mobile screens without forcing a vertical scroll on the page.

# DASHBOARD FIXES: STATE MATCHING & SVG MATH

I found several bugs on the Home/Bento screen during testing that need immediate fixing.

## 1. Math Bug: SVG Circular Progress Bar

The progress ring on the "EN COURS" hero card fills up too fast (e.g., at 1/6 it shows 50% full, at 4/6 it shows 100% full).

- **Fix:** Recalculate the SVG `strokeDashoffset` or the Reanimated percentage. The formula must be strictly `(currentLesson / totalLessons) * 100`. Ensure the max circumference and stroke math are perfectly mapped from 0% to 100%.

## 2. State Mismatch: Unlocked Modules

There is a sync issue. The Hero card correctly shows "MODULE 3" as active, but the Module 3 card in the grid below is still visually disabled/grayed out.

- **Fix:** Ensure both components use the EXACT same state reference to determine `isUnlocked`. If `currentModuleIndex >= moduleIndex`, the grid card must be fully opaque and clickable.

## 3. UX Polish: Reverse Grid Order

Currently, completed modules stay at the top of the grid, forcing the user to scroll down to find new content.

- **Fix:** Reverse the rendering order of the module grid. The currently active/new modules should appear at the TOP of the grid (right below the Hero card), and the fully completed modules should be pushed to the bottom. (Alternatively, auto-scroll to the active module on mount).

# UI POLISH: EMOJIS, ACCESSIBILITY, AND CASING FIXES

Please apply these minor yet crucial UI refinements to maintain the premium design standard.

## 1. Replace Standard Emojis with Premium Icons (Screens 1 & 2)

Standard keyboard emojis (🎉, 🌱) look generic and must be replaced with custom, minimalist vector icons (SVG).

- **Screen 1 (Leçon Terminée):** Locate the `🎉` emoji at the top. Replace it with a sleek celebration/party popper vector icon.
    - **Style:** Minimalist, `Gold` color (#D4AF37). Size: ~48px.
- **Screen 2 (Module Complété):** Locate the `🌱` emoji next to the module title. Replace it with a premium seedling/growth vector icon.
    - **Style:** Minimalist, `Emerald` color (#0F624C). Size: Matching text height.

## 2. Accessibility Fix: Text Contrast (Screen 1)

- The sub-text `Temps total : 24s` (and similar dynamic time texts on this screen) is too light. It needs better contrast for readability.
- Change its color from light gray to `text.primary` (#374151) or a compliant `text.secondary` (#6B7280) that meets contrast standards.

## 3. Casing Fix (Screen 4)

- Locate the main title `Leçon Complétée !`. It currently uses English Title Case.
- Change it to correct French sentence case: `Leçon complétée !` (lowercase 'c').

# UI/UX REFINEMENT: REVISION SUMMARY & LOGIC FIXES

Please apply these final refinements to the "Session terminée !" screen (image_b15004.png) to ensure arithmetic logic and design consistency.

## 1. UI Fixes: Alignment

- **Vertical Alignment:** Inside the stats card (under "CRÉER MON COMPTE"), ensure the small `✓` (Check) and `↻` (Refresh) icons are perfectly vertically centered with their corresponding text ("Correctes du premier coup" and "À revoir bientôt"). Adjust the flexbox alignment (`align-items: center`).

## 2. Critical Logic Fix: Arithmetic Mismatch

There is a calculation bug in the state rendering logic on image_b15004.png.

- **Current Issue:** The total shows "15 CARTES RÉVISÉES", but below it claims "15 Correctes du premier coup" AND "1 À revoir". 15 + 1 = 16, which contradicts the total of 15.
- **Fix:** Correct the state calculation logic used to render these numbers. The sum of detailed stats must strictly equal the total.
- **Example Calculation:**
    - If `totalAnswered` is 15 and 1 card was incorrect (needs review), then the count for "Correctes du premier coup" must be displayed as **14** (`15 - 1`). Make sure the UI reflects this logic.

## 3. Fix: Technical Bug Report: Revision Session Queue Shrinking Bug (Negative Feedback Loop)

## Summary
A major logical state management bug in the revision module causes the total number of questions in a session queue to be halved with each new session start, leading to 'ghost' sessions with ever-decreasing totals, eventually ending in a single-question session. This is a critical queue management issue.

## Technical Details
### Symptoms (from user provided sequence)
The issue is NOT a simple internal session counter bug (like 6/29 becoming 7/28). The images show a logical feedback loop where the queue is corrupted across session starts:
- Session N: Begins at 1/29. Progresses to e.g., 6/29.
- Session N+1: *New* session begins at **1/15**.
- Session N+2: *New* session begins at **1/8**.
- Session N+3: *New* session begins at **1/4**.
- Session N+4: *New* session begins at **1/2**.
- Session N+5: *New* session begins at **1/1**.

### Diagnostic
The app is confusing 'remaining questions' from session N-1 with 'total questions' for session N. When a user finishes or transitions between revision sessions, the application's logic appears to take the count of *unreviewed questions* from the current session and mistakenly set it as the *new total* for the subsequent session, instead of just continuing to review from the existing, larger queue.

### Expected Behavior
When a user finishes a revision session or transitions, the total queue count should either remain constant or be refreshed from the master database. A new session should start with the correct remaining questions, not with a newly halved total.

## Steps to Reproduce
1. Launch the app and go to the revision section.
2. Start a revision session with a significant number of questions (e.g., 29).
3. Review several cards (e.g., 6/29).
4. Simulate the transition to the next session (e.g., via the end of session, or by restarting the app after progress).
5. Observe the new session's starting count (it will be e.g., 1/15, showing the bug).
6. Repeat step 4 several times and observe the negative feedback loop.

## Contextual Data (Images)
The provided sequence shows the main 'לِسَان' (Lisaan - Tongue) 3D card on the dashboard, the initial 1/29 revision session, progress at 6/29, and the subsequent 'ghost' sessions starting at 1/15, 1/8, 1/4, 1/2, and 1/1.