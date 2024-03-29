# KartRider Drift Records

[Link to application on GitHub Pages](https://altivu.github.io/KartRider-Drift-Records/)

## Features

- View information on the various tracks
- View user-submitted records videos that players have set on these tracks
- Add, edit, and delete your own records video submissions (Google login required)
- Track your own records (Google login required)
- View information on various user-created resources to help improve your gameplay experience

## Technologies Used

### Front-End
- React + Vite
- Chakra UI

### "Back-End"
- Supabase

## Changelog

### [1.0.3] - March 22nd, 2023

- Added filters to tracks
  - Search by track name or theme (with 0.5 second delay)
  - Show Speed Grand Prix Tracks Only (some item tracks fall under this category...)
  - Show Records View (strips out extraneous track info and only shows the top saved record details)

### [1.0.2] - March 19th, 2023

- Fixed application not working in Firefox

### [1.0.1] - March 16th, 2023

- Added basic video embed for Bilibili URLs
- Added logged in email information to header dropdown
  - This acts as an additional indicator of what account you're using in case the avatar image does not properly load

### [1.0.0] - March 15th, 2023

General release of application.