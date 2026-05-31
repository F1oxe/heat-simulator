# Heat Distribution Simulator

A website where you draw a 2D shape, pin a few fixed temperatures, and watch heat
spread to equilibrium. **The simulation runs entirely in the browser**, so the site
can be put online as a single static page with no server.

The browser simulation (`frontend/src/simulator.js`) is a faithful port of the Java
backend in `backend/` — same averaging rule, same numbers. The Java is your AP CS A
deliverable; the website mirrors it so anyone can try it from a link.

➡️ **To put it online and get a shareable link, see `HOW-TO-PUT-IT-ONLINE.md`.**

```
heat-simulator/
├── HOW-TO-PUT-IT-ONLINE.md   ← deploy guide (Netlify Drop, etc.)
├── website-ready-to-upload/  ← pre-built site; drag this to Netlify
├── backend/                  ← Java (the graded AP CS A project)
│   ├── Pixel.java            your class, unchanged
│   ├── Shape.java            your class, unchanged
│   ├── Settings.java         + a constructor for custom limits
│   ├── Simulator.java        fixed + per-iteration frames + hottest/coldest
│   ├── JsonHelper.java       tiny hand-written JSON (no libraries)
│   ├── Server.java           optional HTTP server (POST /simulate)
│   └── Main.java             your original console test (still works)
└── frontend/                 ← React website source (Vite)
    └── src/
        ├── App.jsx           grid drawing, animation, math section
        ├── App.css
        └── simulator.js      browser port of Simulator.java

```

## Run the website locally (for development)
```bash
cd frontend
npm install      # first time only
npm run dev
```
Open the URL it prints (usually http://localhost:5173).

## Run the Java project (for your AP CS A submission)
```bash
cd backend
javac *.java
java Main        # runs your console test
# or:  java Server   # to expose it over HTTP on port 8080
```

## How to use the simulator
1. **Draw shape** — click and drag to make your 2D object.
2. **Set temperature** — pick a value, click cells inside the shape to fix them.
3. **Run** — watch heat diffuse. Blue = cold, red = hot; cells outside the shape stay dark.
4. **Play / Replay / Pause** and scrub frames with the playback slider.

