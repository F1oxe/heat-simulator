# Putting the simulator online (so you can just send a link)

Your whole simulator now runs in the browser, so it's a normal static website —
no server to host. The folder **`website-ready-to-upload/`** is already built and
ready to go.

## Easiest way — Netlify Drop (no account, ~30 seconds)
1. Go to **https://app.netlify.com/drop**
2. Drag the **`website-ready-to-upload`** folder onto the page.
3. It uploads and gives you a public link like `https://random-name-123.netlify.app`.
4. Send that link to anyone — it works on phones and computers.

That temporary link works immediately with no account. If you want it to stay up
permanently and get a nicer name, click **Sign up** (free), then **Site settings →
Change site name** to pick something like `marco-heat-sim.netlify.app`.

## If you'd rather use Vercel
1. Make a free account at **https://vercel.com**.
2. Click **Add New → Project → Deploy** and drag the same `website-ready-to-upload` folder,
   or connect a GitHub repo of the `frontend/` folder.
3. You get a `*.vercel.app` link.

## If you change the website later
The ready-to-upload folder is a *built snapshot*. To make changes, edit the source in
`frontend/`, then rebuild:
```bash
cd frontend
npm install      # first time only
npm run build    # creates a fresh "dist" folder
```
Then drag the new `dist` folder onto your Netlify site's Deploys page to update it.

## Note for your AP CS A submission
The live website runs `frontend/src/simulator.js`, which is a **direct port of your
Java `Simulator.java`** — same averaging rule, same stopping conditions, same numbers
(verified: a 3×3 square converges in 61 iterations to an identical gradient in both).
Your Java project in `backend/` is still the real, graded implementation; the website
just mirrors it so people can try it in a browser.
