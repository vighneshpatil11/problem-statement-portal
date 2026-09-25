# Problem Statement Team Formation Portal

A simple website where students can:

1. Add a problem statement.
2. Enter a description, name and roll number.
3. Automatically become Member 1 of the team.
4. Browse existing problem statements.
5. Join an existing team if interested.
6. Build teams of up to 5 members.

## Current version

This version is a **frontend demo** and stores data in the browser's `localStorage`.

That means:
- It works immediately on GitHub Pages.
- Data persists after refreshing on the same browser/device.
- Different students/devices will NOT see the same data.

## GitHub Pages deployment

1. Create a GitHub repository.
2. Upload:
   - `index.html`
   - `style.css`
   - `script.js`
   - `README.md`
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/ (root)`.
6. Save.
7. GitHub will provide the Pages URL.

## Important: shared student data

For an actual college-wide version, replace localStorage with a shared backend such as Firebase or Supabase.

Recommended production structure:

- GitHub Pages → frontend hosting
- Supabase/Firebase → shared database
- Database → problem statements + members
- Security rules → prevent duplicate roll numbers and prevent more than 5 members

The UI and JavaScript are already structured so the storage layer can be replaced later.
