# MASTER CODING PROMPT — MINIMAL CINEMATIC MUSIC STREAMING WEB APP

## 1. ROLE

You are a senior full-stack engineer, frontend architect, UI/UX designer, and audio-player engineer.

Your task is to design and build a **production-quality, extremely minimal, responsive music streaming web application**.

The application must feel like a premium combination of:

- Spotify's minimized music player
- Apple Music's clean interaction patterns
- YouTube Music's compact playback experience
- A cinematic full-screen background experience

However, DO NOT copy any company's branding, logos, colors, proprietary UI, or exact design.

The final product must have its own visual identity and must remain extremely simple.

---

# 2. CORE PRODUCT PHILOSOPHY

The entire application should follow one principle:

> **"The background image is the experience. The music player is the only interface."**

Do NOT turn this into a conventional music streaming platform.

The application should NOT contain:

- Login
- Signup
- Authentication
- User accounts
- User profiles
- Social features
- Comments
- Likes
- Followers
- Artist profiles
- Album pages
- Lyrics
- Search
- Recommendations
- Subscription pages
- Payment system
- User-created playlists
- Complex navigation
- Dashboard
- Settings page
- Admin UI
- Unnecessary cards
- Large player
- Unnecessary text
- Feature-heavy UI

The website should immediately load and allow the visitor to play music.

---

# 3. APPLICATION CONCEPT

The website is a **minimal music streaming player**.

When a visitor opens the website:

1. The website loads.
2. The correct responsive background image is displayed.
3. The application loads the available music tracks from Backblaze B2 S3-compatible storage.
4. The default playlist is automatically populated from the available tracks.
5. The user can select a song and play it.
6. A very small compact mini music player remains fixed near the bottom-center of the screen.
7. The background remains visually dominant.
8. Nothing should distract from the background image and music.

The website must feel like a **cinematic ambient music player**, not a traditional streaming service.

---

# 4. RESPONSIVE BACKGROUND IMAGE SYSTEM

The user will manually place TWO background images inside the same project folder.

For example:

/public/backgrounds/
    desktop-background.jpg
    mobile-background.jpg

Use appropriate filenames if necessary, but make the implementation easy to configure.

There are two completely different images:

### Desktop Image

Used for:

- Desktop
- Laptop
- Large tablet / landscape screens

### Mobile Image

Used for:

- Mobile portrait screens
- Small portrait devices

---

## IMPORTANT BACKGROUND REQUIREMENT

DO NOT use the desktop image on mobile.

DO NOT use the mobile image on desktop.

The application must automatically choose the correct image according to viewport/device width.

Use a robust responsive implementation such as:

- `<picture>` with `<source media>`
- CSS media queries
- Or another reliable responsive image strategy

The implementation must be clean and maintainable.

---

# 5. BACKGROUND IMAGE VISUAL BEHAVIOR

The background image is a major part of the application.

The image must:

- Cover the entire viewport
- Remain visually dominant
- Maintain its original aspect ratio
- Never be stretched unnaturally
- Never be distorted
- Avoid unnecessary cropping wherever possible
- Fill the available viewport elegantly
- Work correctly when browser dimensions change
- Work correctly when device orientation changes

Prefer a structure similar to:

```text
App
 └── Background Layer
      └── Responsive Background Image
```

The background should behave like a full-screen cinematic scene.

Do NOT add:

- random gradients
- excessive blur
- heavy dark overlays
- unnecessary color filters

Only use a subtle readability overlay if absolutely necessary for player visibility.

The original image must remain visually clear.

---

# 6. FULL-SCREEN LAYOUT

The application should essentially be one full-screen viewport.

Recommended structure:

```text
<body>
 └── #root
      └── App
           ├── Background
           ├── Minimal UI Layer
           └── Mini Music Player
```

The main application should use:

```css
min-height: 100dvh;
width: 100%;
```

Use modern viewport units such as:

- `100dvh`
- `100svh`
- `100lvh`

where appropriate.

The application must work correctly on mobile browsers where browser address bars dynamically appear/disappear.

---

# 7. MINI MUSIC PLAYER

The mini player is the most important UI element.

It must be:

> **VERY SMALL, COMPACT, PREMIUM, AND UNOBTRUSIVE.**

Think about the minimized player experience found in modern music apps.

The player should NOT look like a large music control panel.

It should feel like a tiny floating playback bar.

---

# 8. MINI PLAYER POSITION

The player must be:

### Desktop

Horizontally centered.

Position:

```text
bottom-center
```

Example conceptual layout:

```text
                    Background Image
                           |
                           |
                           |
                           |
                 ┌────────────────────┐
                 │   MINI PLAYER      │
                 └────────────────────┘
```

### Mobile

Also centered horizontally near the bottom.

The player should respect:

- Safe-area insets
- iPhone bottom home indicator
- Android navigation area

Use something equivalent to:

```css
bottom: calc(12px + env(safe-area-inset-bottom));
```

Adjust spacing appropriately.

---

# 9. MINI PLAYER DIMENSIONS

The player must be compact.

Do NOT create a huge bottom player.

Suggested design:

### Desktop

Approximately:

- Width: 380–500px
- Height: 54–68px

### Mobile

Approximately:

- Width: calc(100vw - 24px)
- Height: 54–64px

These are guidelines, not rigid requirements.

The final result must visually feel compact.

The player should never dominate the background.

---

# 10. MINI PLAYER CONTENT

The mini player should contain only the controls that are actually necessary.

Required controls:

1. Previous
2. Play / Pause
3. Next
4. Playlist
5. Current song information
6. Optional subtle progress indicator

Do NOT add unnecessary controls.

---

# 11. CURRENT SONG INFORMATION

Show only the:

### Song Name

Do NOT display:

- Artist
- Album
- Album artist
- Lyrics
- Genre
- Description
- Release date
- Metadata panels

The UI should remain minimal.

Example:

```text
[Previous] [Play] [Next]   Song Name   [Playlist]
```

Do not overload the player.

---

# 12. PLAY / PAUSE CONTROL

The central playback button must be immediately understandable.

When music is stopped:

```text
▶
```

When music is playing:

```text
Ⅱ
```

Use a clean modern icon library if the project already uses one.

Do NOT use emoji icons.

Prefer SVG icons.

The play/pause button should be visually slightly more prominent than the other buttons while still remaining compact.

---

# 13. PREVIOUS BUTTON

The previous button must:

- Go to the previous track
- Respect the current playlist order
- Work correctly after shuffle/reordering
- Work correctly when the current track has already started

Optional standard behavior:

If the current song has played for more than approximately 3 seconds, pressing Previous can restart the current song.

If the current song has barely started, Previous should move to the previous track.

Keep this behavior predictable.

---

# 14. NEXT BUTTON

The Next button must:

- Immediately stop the current track
- Move to the next track
- Start playing the next track
- Follow the current playlist order
- Respect user reordering
- Correctly handle the end of the playlist

If the final track finishes and there is no next track, the behavior should be clearly defined.

Recommended:

```text
last track → first track
```

This creates continuous playlist playback.

---

# 15. AUTOMATIC NEXT TRACK

When the current audio track finishes:

```text
Track A
   ↓
ended
   ↓
Track B
   ↓
Track C
```

The next song must automatically start.

Do not require the user to manually press Next.

Use the native HTML5 Audio `ended` event or an equivalent reliable audio state mechanism.

---

# 16. PLAYLIST SYSTEM

There must be exactly ONE default playlist.

The user cannot:

- Create playlists
- Delete playlists
- Rename playlists
- Create folders
- Save multiple playlists
- Manage playlists

The playlist is controlled by the website owner/developer.

---

# 17. PLAYLIST BUTTON

The mini player must contain a small playlist icon/button.

When the user clicks it:

The playlist UI should expand.

Do NOT navigate to a completely separate website page.

Prefer an elegant:

- bottom sheet
- compact expanded panel
- modal
- drawer

depending on the screen size.

---

# 18. EXPANDED PLAYLIST EXPERIENCE

When opened, the playlist should display the available songs.

Example:

```text
Playlist

01  Song One
02  Song Two
03  Song Three
04  Song Four
05  Song Five
```

The playlist should remain visually consistent with the cinematic background.

The playlist should NOT become a huge conventional dashboard.

---

# 19. SONG REORDERING

The user must be able to change song sequence.

For example:

Initial:

```text
1. Song A
2. Song B
3. Song C
4. Song D
```

User changes order:

```text
1. Song C
2. Song A
3. Song D
4. Song B
```

Playback must follow the new order.

Implement drag-and-drop reordering.

Recommended approach:

- HTML5 drag-and-drop
- Pointer events
- Or a lightweight drag-and-drop library

Choose the simplest reliable implementation.

---

# 20. IMPORTANT REORDERING RULE

The user is NOT creating a new permanent playlist.

They are only changing the playback order for the current session.

The default playlist remains the source playlist.

Optionally persist the order using:

```text
localStorage
```

if that improves user experience.

However, do NOT introduce an account system.

---

# 21. PLAYLIST SONG SELECTION

Clicking a song in the playlist should:

1. Select the song
2. Update current song title
3. Load the audio
4. Start playback
5. Close the expanded playlist or keep it open depending on UX
6. Return to the compact player state

Prefer automatically closing the playlist after selecting a song on mobile.

On desktop, either behavior is acceptable if visually clean.

---

# 22. CURRENT SONG HIGHLIGHT

The currently playing song should be subtly highlighted.

Do NOT use a huge active card.

Use something minimal:

- slight opacity change
- subtle background
- small indicator
- tiny animated playing indicator

Example:

```text
01  Song A
02  Song B   ← currently playing
03  Song C
```

Keep it subtle.

---

# 23. DRAG AND DROP UX

When the user drags a song:

- Show a subtle drag state
- Do not create excessive animations
- Keep the interface responsive
- Maintain accessibility
- Update the playback queue correctly

After dropping:

```text
new order → playback follows new order
```

---

# 24. AUDIO LOOP / REPEAT BEHAVIOR

Clarification:

Individual songs should NOT continuously repeat forever.

Instead:

```text
Song A finishes
        ↓
Song B starts
        ↓
Song C starts
        ↓
Song D starts
```

So the application should behave as:

> **Continuous playlist playback, not single-song infinite repeat.**

Do not enable:

```html
audio.loop = true
```

for each individual track.

Instead use the `ended` event to advance to the next track.

---

# 25. SHUFFLE REQUIREMENT

The user said they should be able to shuffle/prioritize the sequence.

Interpret this primarily as:

### Manual playlist reordering

The user can drag songs up/down and define playback order.

If you add a shuffle button, keep it extremely minimal and optional.

Do NOT add unnecessary playback modes.

The core requirement is:

> User-defined sequence must control playback.

---

# 26. BACKBLAZE B2 STORAGE INTEGRATION

The application will use:

> **Backblaze B2 with S3-compatible storage**

Music files will be stored remotely.

The application should automatically discover the available music files.

For example:

```text
Backblaze B2 Bucket
│
├── song-01.mp3
├── song-02.mp3
├── song-03.mp3
├── song-04.mp3
└── song-05.mp3
```

The website should dynamically obtain the available songs rather than requiring every song to be manually hardcoded.

---

# 27. VERY IMPORTANT SECURITY REQUIREMENT

NEVER expose Backblaze B2 credentials in browser/client-side code.

Do NOT put:

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
B2_APPLICATION_KEY
B2_APPLICATION_KEY_ID
```

inside:

```text
React components
JavaScript bundles
client-side environment variables
public files
GitHub repository
```

Do NOT expose secrets through `VITE_*`, `NEXT_PUBLIC_*`, or equivalent public environment variables.

---

# 28. RECOMMENDED STORAGE ARCHITECTURE

Use a secure architecture.

Preferred:

```text
Browser
   ↓
Application API / Serverless Function
   ↓
Backblaze B2 S3-compatible API
   ↓
Music Files
```

The server/API layer is responsible for:

- Listing music files
- Generating safe URLs
- Handling private bucket access if required
- Returning only necessary metadata
- Protecting credentials

The frontend should only receive what it needs.

---

# 29. PUBLIC VS PRIVATE BUCKET

Support both approaches if practical.

### Option A — Public Music Bucket

If the music files are intentionally public:

```text
Frontend
   ↓
Public B2 file URL
   ↓
Audio streaming
```

This is the simplest architecture.

### Option B — Private Bucket

If the bucket is private:

```text
Frontend
   ↓
API
   ↓
Generate signed URL
   ↓
Audio element
```

Prefer signed URLs when private storage is required.

---

# 30. AUDIO STREAMING

Use the native HTML5 audio system wherever possible.

Example conceptual implementation:

```html
<audio />
```

The player should support:

- MP3
- M4A/AAC where browser supported
- WAV where practical
- Other browser-supported audio formats

Do not build an unnecessary custom streaming engine.

---

# 31. AUDIO URL HANDLING

The application should receive something conceptually like:

```json
[
  {
    "name": "Song One",
    "url": "https://..."
  },
  {
    "name": "Song Two",
    "url": "https://..."
  }
]
```

Only return fields actually required by the application.

Do not expose unnecessary B2 metadata.

---

# 32. AUTOMATIC SONG DISCOVERY

The app should automatically load the songs available in the configured storage location.

Do NOT require the developer to update the frontend every time a new song is uploaded.

Example:

Today:

```text
Song A
Song B
Song C
```

Tomorrow I upload:

```text
Song D
```

The website should automatically discover:

```text
Song A
Song B
Song C
Song D
```

---

# 33. FILE FILTERING

Only audio files should become playlist entries.

Recognize common audio extensions such as:

```text
.mp3
.m4a
.aac
.wav
.ogg
.flac
```

Only include formats actually supported by the browser/player.

Ignore:

```text
.jpg
.jpeg
.png
.webp
.txt
.json
.pdf
.zip
```

and other non-audio files.

---

# 34. SONG NAME GENERATION

If a file is:

```text
my-awesome-song.mp3
```

Display:

```text
my-awesome-song
```

Remove the extension.

Optionally convert filename formatting into a cleaner display name, but do not modify the actual file path.

---

# 35. STORAGE CONFIGURATION

Use environment variables.

Example conceptual variables:

```env
B2_ENDPOINT=
B2_REGION=
B2_BUCKET_NAME=
B2_APPLICATION_KEY_ID=
B2_APPLICATION_KEY=
```

Never commit the actual values.

Create:

```text
.env.example
```

with placeholder values.

---

# 36. ERROR HANDLING

If Backblaze is unavailable:

Show a minimal message such as:

```text
Music is temporarily unavailable.
```

Do NOT show:

- stack traces
- API errors
- credentials
- technical debugging information

Development console may contain useful technical errors, but production UI must remain clean.

---

# 37. EMPTY PLAYLIST STATE

If no music is available:

Display a minimal state:

```text
No music available.
```

Do not crash.

---

# 38. AUDIO ERROR STATE

If a particular song cannot load:

The player should:

1. Detect the error
2. Avoid freezing
3. Optionally skip to the next valid track
4. Continue playback if possible

Do not let one broken file break the entire playlist.

---

# 39. LOADING STATE

When the application is loading songs:

Do NOT show a huge loading screen.

Use a subtle minimal indicator.

The background image should preferably load independently and remain visible.

---

# 40. AUTOPLAY POLICY

Do NOT aggressively force autoplay on initial page load because modern browsers commonly block autoplay with sound.

Correct behavior:

- Load playlist automatically
- Display the mini player
- Allow user interaction
- Start playback after a valid user gesture

If browser policy allows autoplay, it may be used, but the application must still work correctly when autoplay is blocked.

Never create an infinite autoplay retry loop.

---

# 41. PERSISTENT PLAYER STATE

Use local browser state where useful.

Potentially persist:

- Current song
- Current playback order
- Volume
- Last selected track

Do NOT persist sensitive information.

Do NOT create accounts.

Do NOT send user behavior to a backend unless explicitly required.

---

# 42. NO AUTHENTICATION

This website must have:

```text
NO LOGIN
NO SIGNUP
NO AUTH
NO ACCOUNT
NO USER PROFILE
NO PASSWORD
NO SOCIAL LOGIN
```

A visitor must be able to open the website and use the player immediately.

---

# 43. NO DATABASE FOR USERS

Do not create a user database.

There is no need for:

```text
users
profiles
sessions
passwords
subscriptions
```

The only dynamic data required is the music catalogue/playlist information.

---

# 44. UI STYLE

The visual style should be:

- Minimal
- Premium
- Cinematic
- Modern
- Elegant
- Clean
- Quiet
- Distraction-free

Avoid:

- excessive gradients
- excessive glassmorphism
- neon colors
- large typography
- huge cards
- unnecessary shadows
- excessive borders
- excessive animations
- dashboard-like UI

---

# 45. PLAYER VISUAL DESIGN

The player may use a subtle translucent surface.

For example:

```text
background: rgba(...)
backdrop-filter: blur(...)
border: subtle
border-radius: compact
```

But do not overuse glassmorphism.

The player should visually integrate with the background.

The player should feel like it belongs to the scene.

---

# 46. PLAYER LAYOUT

Recommended conceptual structure:

```text
┌─────────────────────────────────────────────┐
│                                             │
│   ‹     ▶     ›     Song Name       ♬      │
│                                             │
└─────────────────────────────────────────────┘
```

The exact UI can be improved by the agent.

However:

- Previous
- Play/Pause
- Next
- Song title
- Playlist

must remain available.

---

# 47. RESPONSIVE PLAYER BEHAVIOR

Desktop:

```text
         ┌─────────────────────────────┐
         │  ‹  ▶  ›   Song Name   ☷   │
         └─────────────────────────────┘
```

Mobile:

```text
┌───────────────────────────────┐
│ ‹  ▶  ›  Song Name       ☷   │
└───────────────────────────────┘
```

The player must fit comfortably on narrow screens.

If the song name is too long:

- Use ellipsis
- Do not wrap into multiple lines

Example:

```text
Very Long Song Nam...
```

---

# 48. ACCESSIBILITY

Even though the UI is minimal, it must remain accessible.

Every icon button must have:

```text
aria-label
```

Examples:

```text
Play
Pause
Previous song
Next song
Open playlist
Close playlist
```

Support:

- Keyboard navigation
- Focus states
- Enter/Space interaction
- Screen readers

Do not sacrifice accessibility for minimalism.

---

# 49. TOUCH INTERACTION

On mobile:

- Buttons must be easy to tap
- Avoid tiny inaccessible touch targets
- Maintain compact visual appearance while providing sufficient invisible/actual hit area

Use approximately 40–44px touch targets where appropriate, even if the visible icon is smaller.

---

# 50. ANIMATION

Animations should be subtle.

Allowed:

- Player appearance
- Playlist expansion
- Playlist closing
- Song transition
- Hover states
- Button interaction
- Drag-and-drop movement

Use:

```text
150–250ms
```

as a general starting point.

Avoid:

- huge page transitions
- bouncing buttons
- flashy effects
- unnecessary particle effects

---

# 51. MOTION PRINCIPLE

The background is static.

The interface should feel alive but restrained.

Use motion only when it communicates:

- state change
- interaction
- hierarchy
- playback state

---

# 52. DESKTOP BEHAVIOR

On desktop:

- Background fills viewport
- Mini player bottom-center
- Player remains fixed
- Playlist opens elegantly
- Keyboard controls work
- Mouse hover states work
- Drag-and-drop works

Do not create a traditional left sidebar.

---

# 53. MOBILE BEHAVIOR

On mobile:

- Use mobile-specific background
- Full viewport
- Mini player bottom-center
- Respect safe area
- Playlist should preferably appear as a bottom sheet
- No horizontal overflow
- No desktop layout squeezed into mobile

---

# 54. MOBILE BACKGROUND LOGIC

Example:

```css
/* Desktop */
.desktop-background {
  display: block;
}

/* Mobile */
@media (max-width: 767px) {
  .desktop-background {
    display: none;
  }

  .mobile-background {
    display: block;
  }
}
```

However, prefer a semantically correct responsive image implementation instead of unnecessarily loading both large images.

The mobile browser should preferably avoid downloading the desktop background if it is not needed.

---

# 55. PERFORMANCE

Performance is extremely important.

Optimize:

- Background image loading
- Audio loading
- JavaScript bundle
- React rendering
- Playlist rendering
- API calls
- Network requests

Do NOT preload every audio file.

Only load the current track and use reasonable preloading behavior.

Recommended:

```html
<audio preload="metadata">
```

or an equivalent strategy.

---

# 56. DO NOT DOWNLOAD ALL SONGS

The app is a streaming application.

Do NOT:

- fetch every MP3 into memory
- convert files to blobs unnecessarily
- download the entire playlist
- store songs in localStorage
- preload all tracks

Only load the required audio resource.

---

# 57. BROWSER AUDIO STATE

Implement a reliable audio state model.

Track at least:

```text
currentTrack
isPlaying
currentTime
duration
playlist
currentIndex
isPlaylistOpen
isLoading
error
```

Avoid unnecessary global state complexity.

Use a clean architecture such as:

```text
Audio Engine
     ↓
Player State
     ↓
UI
```

---

# 58. SINGLE AUDIO INSTANCE

Prefer using one persistent HTMLAudioElement rather than creating multiple audio elements for each song.

Conceptually:

```text
Audio Engine
     |
     └── HTMLAudioElement
```

When track changes:

```text
audio.src = newTrack.url
audio.load()
audio.play()
```

This prevents multiple songs playing simultaneously.

---

# 59. PLAYBACK RACE CONDITIONS

Handle situations such as:

- User presses Next multiple times
- User changes tracks rapidly
- Playlist is reordered while playing
- Audio fails
- User presses Play immediately after Next
- Component rerenders

The player must never create multiple simultaneous audio instances.

---

# 60. QUEUE / INDEX LOGIC

Maintain a reliable current playlist order.

Example:

```text
playlist:
[
  Song A,
  Song B,
  Song C,
  Song D
]

currentIndex = 1
```

If the user reorders the playlist, update the queue safely.

Do not accidentally reset the current track.

---

# 61. PLAYER CONTROL LOGIC

Implement:

```text
Play
Pause
Previous
Next
Select Track
Reorder Tracks
Automatic Next
Playlist Open
Playlist Close
```

Every interaction must have deterministic behavior.

---

# 62. PROGRESS INDICATOR

A subtle progress indicator may be included.

It should NOT become a large traditional seek bar.

A thin progress line is preferred.

If implementing seeking:

- clicking/tapping the progress area should seek
- keyboard accessibility should work
- progress should update smoothly

If the progress UI makes the player visually too large, simplify it.

---

# 63. VOLUME

Do NOT add a large volume control.

Desktop may optionally support volume via keyboard or a subtle control.

Mobile should prioritize the compact player.

Do not add unnecessary audio settings.

---

# 64. PLAYLIST PANEL DESIGN

The expanded playlist should feel like an extension of the player.

Example:

```text
        ┌─────────────────────────────┐
        │ Playlist                    │
        │                             │
        │ ≡  Song One                 │
        │ ≡  Song Two                 │
        │ ≡  Song Three               │
        │ ≡  Song Four                │
        │                             │
        └─────────────────────────────┘
```

Do not make it look like an admin table.

---

# 65. PLAYLIST CLOSE

Provide a minimal close interaction.

The user should be able to:

- Click close
- Press Escape
- Tap outside the panel where appropriate

---

# 66. URL / ROUTING

Keep routing extremely simple.

A single-page application is preferred.

No unnecessary routes.

Potentially:

```text
/
```

is enough.

Do not create:

```text
/login
/signup
/profile
/library
/settings
/discover
```

---

# 67. SEO

Implement basic SEO.

Include:

- title
- description
- favicon
- Open Graph metadata if useful

Do not overcomplicate SEO.

Example conceptual title:

```text
Minimal Music Player
```

The final branding/name can be configured later.

---

# 68. PROJECT STRUCTURE

Use a clean maintainable architecture.

For example:

```text
src/
├── components/
│   ├── Background/
│   ├── MiniPlayer/
│   ├── Playlist/
│   └── icons/
│
├── hooks/
│   ├── useAudioPlayer
│   ├── usePlaylist
│   └── useResponsiveBackground
│
├── services/
│   ├── musicService
│   └── storageService
│
├── types/
│   └── music.ts
│
├── utils/
│
├── App
└── main
```

The exact structure can be improved if needed.

---

# 69. TYPESCRIPT

If using React, use TypeScript.

Create proper types.

Example conceptual type:

```ts
type Track = {
  id: string;
  name: string;
  url: string;
};
```

Do not use `any` unnecessarily.

---

# 70. FRONTEND STACK

Use a modern stable frontend stack.

Preferred:

```text
React
TypeScript
Vite
Tailwind CSS
```

If an existing project already exists, inspect it first and adapt to the existing stack instead of unnecessarily replacing everything.

---

# 71. ICONS

Use a lightweight SVG icon library if needed.

Examples:

- Lucide
- Heroicons

Do not use:

- emoji icons
- raster icon images
- huge icon libraries unnecessarily

---

# 72. DESIGN SYSTEM

Use a small set of reusable design tokens.

For example:

```text
player height
player radius
player spacing
icon size
background transition
panel opacity
animation duration
```

Avoid random values everywhere.

---

# 73. NO EXCESSIVE COMPONENTIZATION

Do not create dozens of tiny components just for the sake of architecture.

Keep the project clean and understandable.

---

# 74. LOCAL DEVELOPMENT

The application must run with:

```bash
npm install
npm run dev
```

Build must work with:

```bash
npm run build
```

Production preview should work with:

```bash
npm run preview
```

---

# 75. ENVIRONMENT CONFIGURATION

Create:

```text
.env.example
```

Document every required environment variable.

Never commit:

```text
.env
```

or actual secrets.

Add appropriate entries to:

```text
.gitignore
```

---

# 76. SECURITY CHECKLIST

Before considering the project complete, verify:

- No B2 secret appears in frontend source
- No secret appears in Git history
- No secret appears in browser network responses
- No secret is embedded in JavaScript bundle
- Environment variables are correctly separated
- API validates requests
- CORS is configured appropriately
- Signed URLs expire appropriately if private storage is used

---

# 77. CORS

Ensure the chosen Backblaze architecture supports browser audio streaming.

Configure:

- CORS
- Range requests
- Content-Type
- Accept-Ranges where required

Audio seeking should work correctly when the storage/provider supports HTTP range requests.

---

# 78. HTTP RANGE REQUESTS

Streaming audio should support HTTP byte ranges when possible.

This is important for:

- seeking
- efficient playback
- large audio files

Do not proxy entire large audio files through memory unnecessarily.

---

# 79. CACHING

Use reasonable caching.

Cache:

- music catalogue/listing for a short period if appropriate
- static assets
- background images

Do not cache private signed URLs beyond their useful lifetime.

---

# 80. ERROR RESILIENCE

The application must gracefully handle:

```text
No internet
B2 unavailable
Invalid audio URL
Corrupt audio file
Unsupported format
Expired signed URL
Empty bucket
Slow network
Mobile network switching
```

The UI must remain stable.

---

# 81. IMPORTANT: DO NOT OVERENGINEER

This is NOT a large SaaS application.

Do not introduce unnecessary:

- Redux
- complex backend architecture
- microservices
- databases
- authentication systems
- analytics systems
- complicated state machines
- unnecessary APIs

Use the simplest production-quality architecture that satisfies the requirements.

---

# 82. BACKGROUND + PLAYER Z-INDEX

Use a clean layering system.

Conceptually:

```text
Layer 0 → Background
Layer 10 → optional readability overlay
Layer 20 → Playlist
Layer 30 → Mini Player
```

The player must always remain visible above the background.

---

# 83. BODY / PAGE SCROLLING

The main page should generally NOT scroll.

Use:

```css
overflow: hidden;
```

for the viewport where appropriate.

The playlist itself may scroll internally if there are many tracks.

Do not allow accidental horizontal scrolling.

---

# 84. LARGE PLAYLIST HANDLING

If the playlist contains:

```text
100+
500+
1000+
```

songs:

Do not render huge unnecessary DOM trees if avoidable.

Use efficient rendering.

A normal list may be sufficient initially, but structure the code so virtualization can be added later if the playlist becomes extremely large.

---

# 85. PLAYLIST SORTING

Default order should come from the storage listing or configured playlist order.

Do not randomly reorder songs on every page load.

The user-controlled order should be deterministic.

---

# 86. FILE ORDER

If the storage provider returns files in an unpredictable order, normalize the order.

Possible strategy:

- alphabetical filename order
- explicit numeric prefix
- configured order

Prefer a predictable deterministic order.

---

# 87. OPTIONAL NUMERIC FILE NAMING

Support filenames such as:

```text
01-song.mp3
02-song.mp3
03-song.mp3
```

so the owner can control default order.

Display:

```text
song
```

rather than:

```text
01-song
```

if practical.

---

# 88. INITIAL PLAYER STATE

On first load:

```text
No song selected
```

or select the first track without automatically playing it, depending on browser autoplay restrictions.

The UI should clearly show the available playlist.

After the user clicks Play:

```text
First track → playback starts
```

---

# 89. KEYBOARD SHORTCUTS

Optional but recommended for desktop:

```text
Space → Play/Pause
Arrow Right → Next
Arrow Left → Previous
Escape → Close playlist
```

Do not interfere with typing/input fields.

---

# 90. VISUAL QUALITY STANDARD

The final UI must look like a professionally designed product.

It should NOT look like:

- a coding tutorial
- a generic Tailwind demo
- an admin dashboard
- a default HTML audio player
- an unfinished prototype

Pay special attention to:

- spacing
- typography
- icon alignment
- player dimensions
- background composition
- responsive behavior
- touch interaction
- visual hierarchy

---

# 91. RESPONSIVE BREAKPOINTS

Do not blindly use standard breakpoints.

Test the design across:

```text
320px
375px
390px
414px
768px
1024px
1280px
1440px
1920px
```

The application must remain visually balanced.

---

# 92. MOBILE SAFE AREA

Support devices with:

```text
notches
home indicators
rounded corners
browser UI
```

Use:

```css
env(safe-area-inset-bottom)
```

where appropriate.

---

# 93. DESKTOP PLAYER POSITIONING

The player should not be glued to the extreme screen edge.

Maintain a subtle bottom margin.

Example:

```text
bottom: 16px–24px
```

Adjust responsively.

---

# 94. MOBILE PLAYER POSITIONING

On mobile:

```text
bottom: safe-area + approximately 12px
```

The player must remain comfortably reachable.

---

# 95. PLAYLIST PANEL RESPONSIVENESS

Desktop:

- compact centered panel or bottom sheet

Mobile:

- bottom sheet
- almost full width
- rounded top corners
- scrollable list

Do not cover the entire screen unnecessarily.

---

# 96. PLAYER EXPANSION

The default state is:

```text
MINI PLAYER
```

The player should NOT become a full-screen player.

The playlist is the only expandable interface.

Keep the core player compact.

---

# 97. NO ALBUM ART REQUIREMENT

Do not assume that each song has album art.

The primary player does not need a large artwork image.

The background image is the visual artwork for the application.

---

# 98. NO ARTIST METADATA

Do not create UI for artist metadata.

Only show:

```text
Song Name
```

---

# 99. NO LYRICS

Do not implement lyrics.

---

# 100. NO SEARCH

Do not implement search.

The playlist is the complete music catalogue.

---

# 101. NO USER PLAYLIST CREATION

This is critical.

The user can reorder the provided playlist, but cannot create a new playlist.

---

# 102. NO AUTHENTICATION AGAIN

The website must be completely frictionless.

Expected flow:

```text
Open website
     ↓
See cinematic background
     ↓
See tiny player
     ↓
Click Play
     ↓
Music starts
```

That is the entire core experience.

---

# 103. FINAL USER EXPERIENCE

The finished application should feel like:

> "I opened a beautiful cinematic scene and there is a tiny music player floating at the bottom."

Not:

> "I opened a complicated music streaming dashboard."

---

# 104. DEVELOPMENT WORKFLOW

Do NOT immediately start writing random code.

Follow this process:

## Phase 1 — Inspect

First inspect the existing project directory.

Determine:

- existing framework
- package manager
- existing files
- existing dependencies
- existing configuration
- current routing
- current styling system

Do not destroy existing work unnecessarily.

---

## Phase 2 — Architecture

Before implementation, define:

- component architecture
- audio state architecture
- storage/API architecture
- responsive background strategy
- playlist data flow
- security model

Keep the architecture simple.

---

## Phase 3 — Background

Implement the two responsive background images first.

Verify:

- desktop shows desktop image
- mobile shows mobile image
- correct aspect ratio
- no distortion
- no unnecessary image downloads

---

## Phase 4 — Audio Engine

Implement the audio engine.

Verify:

- play
- pause
- next
- previous
- ended event
- current track
- duration
- error handling

---

## Phase 5 — Backblaze Integration

Implement secure Backblaze B2 S3-compatible integration.

Verify:

- music listing
- audio URLs
- CORS
- range requests
- private/public storage behavior
- environment variables
- no secret exposure

---

## Phase 6 — Mini Player

Build the compact player.

Verify:

- desktop positioning
- mobile positioning
- responsive width
- icons
- song title
- playback state
- safe-area behavior

---

## Phase 7 — Playlist

Implement:

- playlist button
- expanded playlist
- track selection
- current track indicator
- drag-and-drop ordering
- responsive playlist UI

---

## Phase 8 — Playback Queue

Connect playlist ordering with playback.

Test:

```text
A → B → C
```

Then reorder:

```text
C → A → B
```

Playback must follow:

```text
C → A → B
```

---

## Phase 9 — Polish

Improve:

- typography
- spacing
- icon alignment
- animations
- accessibility
- loading states
- error states
- responsive behavior

---

## Phase 10 — Testing

Test all critical flows.

---

# 105. TESTING CHECKLIST

Test:

- [ ] Desktop background loads correctly
- [ ] Mobile background loads correctly
- [ ] Desktop image is not used on mobile
- [ ] Mobile image is not used on desktop unnecessarily
- [ ] Background fills viewport
- [ ] Background is not distorted
- [ ] Player is bottom-center
- [ ] Player remains compact
- [ ] Play works
- [ ] Pause works
- [ ] Next works
- [ ] Previous works
- [ ] Automatic next works
- [ ] End of playlist works
- [ ] Playlist opens
- [ ] Playlist closes
- [ ] Song selection works
- [ ] Drag-and-drop works
- [ ] Reordered sequence affects playback
- [ ] Broken audio does not crash application
- [ ] Empty playlist works
- [ ] Backblaze listing works
- [ ] Audio streaming works
- [ ] Seeking works where supported
- [ ] No B2 secrets are exposed
- [ ] Mobile safe area works
- [ ] Keyboard navigation works
- [ ] No horizontal scrolling
- [ ] No unnecessary routes
- [ ] No authentication
- [ ] Production build succeeds

---

# 106. SECURITY TEST

Before completion, inspect the final browser bundle and network requests.

Confirm that these NEVER appear in client-side code:

```text
B2_APPLICATION_KEY
B2_APPLICATION_KEY_ID
AWS_SECRET_ACCESS_KEY
private credentials
secret tokens
```

If a secret is exposed, stop and fix the architecture before continuing.

---

# 107. CODE QUALITY

Code must be:

- readable
- maintainable
- typed
- modular
- production-ready
- commented only where useful

Avoid excessive comments that simply describe obvious code.

---

# 108. DO NOT CHANGE THE PRODUCT SCOPE

Do NOT add additional features just because they are common in music applications.

Do not add:

```text
Search
Login
Signup
Accounts
Favorites
Likes
Artists
Albums
Lyrics
Recommendations
Subscriptions
Payments
Comments
Social sharing
User playlists
Notifications
Complex settings
```

The simplicity is intentional.

---

# 109. FINAL VISUAL TARGET

The final visual hierarchy should be approximately:

```text
100%
│
├── 95% → Cinematic background experience
│
└── 5% → Minimal music interaction
```

The player should be present but visually quiet.

---

# 110. FINAL IMPLEMENTATION PRINCIPLE

When making a design or engineering decision, ask:

> "Does this make the music player simpler and more elegant?"

If YES:

Implement it.

If NO:

Do not implement it.

---

# 111. IMPORTANT IMPLEMENTATION RULE

Do not stop after creating a visual mockup.

The application must have real working functionality.

The following must actually work:

```text
Backblaze B2
     ↓
Music discovery
     ↓
Playlist
     ↓
Audio streaming
     ↓
Play/Pause
     ↓
Previous/Next
     ↓
Automatic next
     ↓
User-defined ordering
```

This must be a functioning music streaming application, not merely a UI prototype.

---

# 112. FINAL DELIVERABLE

When implementation is complete, provide:

1. Working application
2. Clean project structure
3. `.env.example`
4. Backblaze configuration instructions
5. Required CORS configuration
6. Local development instructions
7. Production build instructions
8. Explanation of how new songs are automatically discovered
9. Explanation of how desktop/mobile backgrounds are selected
10. Explanation of the audio playback architecture
11. Explanation of the security model
12. Testing summary

Do not claim functionality works unless it has actually been tested.

---

# FINAL PRODUCT SUMMARY

Build a:

**Minimal + Cinematic + Responsive + No-login + Free-to-use Music Streaming Web App**

with:

```text
Full-screen background
        +
Desktop-specific background
        +
Mobile-specific background
        +
Tiny bottom-center mini player
        +
Play/Pause
        +
Previous
        +
Next
        +
Current song name
        +
Playlist button
        +
Expandable playlist
        +
Drag-and-drop song ordering
        +
Automatic next-track playback
        +
Backblaze B2 S3-compatible music storage
        +
Secure storage integration
        +
No authentication
        +
No accounts
        +
No unnecessary features
```

The final result should feel **premium, cinematic, extremely clean, fast, responsive, and intentionally minimal**.

Do not turn this into Spotify.

Do not turn this into a dashboard.

Do not add features that were not requested.

Build exactly the minimal music experience described above, with production-quality engineering underneath.