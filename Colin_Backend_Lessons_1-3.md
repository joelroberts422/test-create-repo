# Backend Lessons 1–3 — FastAPI → Persist → SQLite

*Same teaching structure as the earlier modules. Each lesson turns part of Colin's existing map/locations app into an API-backed version, driven by a real pain. Adapt component names (`LocationsPage`, etc.) to whatever his app actually calls them.*

## The setup you're now in (say this first)
Two programs, two terminals, two languages, one data flow:
- **Frontend** — the Vite React app, `npm run dev`, on `http://localhost:5173`.
- **Backend** — a FastAPI server, `uvicorn main:app --reload`, on `http://localhost:8000`.
- They talk over HTTP with **JSON** as the wire format. The frontend asks (`fetch`), the backend answers (`return`).

Mental model in Lesson-0 terms: the backend is **communication + information** living on a server the frontend can reach, instead of baked into the frontend itself.

One-time backend setup:
```bash
mkdir backend && cd backend
pip install fastapi "uvicorn[standard]"
```
Run the server (from the `backend` folder, with the code in `main.py`):
```bash
uvicorn main:app --reload
```
Free win to show Colin: open `http://localhost:8000/docs` — FastAPI auto-generates interactive API docs from your code. Great for testing endpoints without touching the frontend.

---

# Lesson 1 — Move hardcoded data to the API

*`useEffect` with an empty dependency array. Read-only for now — creating comes in Lesson 2.*

**Pain.** The locations are hardcoded in the React component (`const locations = [...]`). The data is trapped inside the frontend — there's nowhere to persist it, and every visitor gets the same baked-in list. We want the data to *come from somewhere*.

**Concept.** Separate the data from the component. Put the list on a server; have the frontend fetch it when the page loads. This is where `useEffect` arrives — its job is "run a side effect (like a fetch) after the component renders."

### Worked example (I do)

Backend — `main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Let the Vite dev frontend call this server (without this, the browser blocks it: CORS).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# The data — moved OFF the frontend, onto the server.
locations = [
    {"id": 1, "name": "Harbor Lights", "lat": 43.04, "lng": -87.91},
    {"id": 2, "name": "Red Barn",      "lat": 43.25, "lng": -89.42},
]

@app.get("/api/locations")   # when someone GETs this URL...
def get_locations():
    return locations          # ...send back the list (FastAPI turns it into JSON)
```

Test it before touching the frontend: run the server, open `http://localhost:8000/api/locations` — raw JSON in the browser.

Frontend — the locations component:
```jsx
import { useEffect, useState } from "react";

export default function LocationsPage() {
  const [locations, setLocations] = useState([]);  // starts empty, not hardcoded
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/locations")
      .then((res) => res.json())      // parse the JSON body
      .then((data) => {
        setLocations(data);           // put it in state → triggers a re-render
        setLoading(false);
      });
  }, []);   // [] = run ONCE, right after the component first mounts

  if (loading) return <p>Loading…</p>;

  return (
    <ul>
      {locations.map((loc) => (
        <li key={loc.id}>{loc.name}</li>
      ))}
    </ul>
  );
}
```

**Narrate.**
- The list is now `useState([])` — empty at first. It fills in *after* the fetch.
- `useEffect(() => {...}, [])` = "after this component renders, run this once." The `[]` is the rule: no dependencies, so run once and never again.
- The page renders **empty first**, the fetch resolves a moment later, `setLocations` updates state, React **re-renders**, and the list appears. That two-beat (render empty → data arrives → re-render) is the whole idea.
- `async def` exists in FastAPI, but we're using plain `def` for now — async is a later conversation.

### Faded practice (we do)
Add a single-location endpoint together — you write the shape, he fills the body:
```python
@app.get("/api/locations/{loc_id}")
def get_location(loc_id: int):
    # his turn: find and return the one location whose id matches loc_id
    ...
```
(FastAPI binds `{loc_id}` from the URL and, because it's typed `int`, converts it for you — a nice thing to point out.)

### Independent (you do)
Add a **third** location to the backend `locations` list. Hard-refresh the frontend. The new one appears — proving the data now comes from the API, not the old hardcoded array. Deadline it.

### Mastery check
He can explain, without looking: *why does the page load empty and then the locations appear?* (effect runs after render → fetch → setState → re-render). And: *what happens if you delete the `[]`?* (the effect runs after every render, so every re-render fetches again, forever — a live bug worth showing once).

### Boundary
The backend list lives in memory — it survives client reloads now, but it will vanish when the **server** restarts. That's intentional; it's the hook for the database. And CORS is a one-time incantation — don't rabbit-hole into it, just know it's "let the browser trust this cross-origin request."

---

# Lesson 2 — Persist new locations (POST + `useEffect` with a dependency)

**Pain.** Colin can now *read* from the server, but "create a location" still only lives in the browser — add one, reload, it's gone. The create action needs to reach the backend.

**Concept.** The create action sends a **POST** to the backend, which appends to the list; then the frontend re-loads the list so the new one shows. This introduces two things: a POST endpoint with a **request body**, and the `useEffect` **dependency array** (re-run when something changes).

### Worked example (I do)

Backend — add a typed request body and a POST route:
```python
from pydantic import BaseModel

# Describes the JSON the frontend must send. FastAPI validates it automatically.
class LocationCreate(BaseModel):
    name: str
    lat: float
    lng: float

@app.post("/api/locations")
def create_location(loc: LocationCreate):
    new_id = max([l["id"] for l in locations], default=0) + 1
    new_location = {"id": new_id, "name": loc.name, "lat": loc.lat, "lng": loc.lng}
    locations.append(new_location)
    return new_location   # send the created item back (now it has an id)
```

Frontend — POST on create, then refetch by bumping a dependency:
```jsx
const [locations, setLocations] = useState([]);
const [refresh, setRefresh] = useState(0);

useEffect(() => {
  fetch("http://localhost:8000/api/locations")
    .then((res) => res.json())
    .then(setLocations);
}, [refresh]);   // re-run WHENEVER `refresh` changes (not just on mount)

function addLocation(name, lat, lng) {
  fetch("http://localhost:8000/api/locations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, lat, lng }),
  })
    .then((res) => res.json())
    .then(() => setRefresh((n) => n + 1));  // bump → effect re-runs → list reloads
}
```

**Narrate.**
- **GET vs POST:** GET asks for data, POST sends data to create something. The `method`, `headers`, and `body` are how you send JSON.
- The **dependency array** is the star: `[refresh]` means "re-run this effect whenever `refresh` changes." Bumping the counter is a simple way to say "something changed, reload." The loop: create → POST → bump `refresh` → effect re-runs → refetch → re-render.
- Honest aside: bumping a counter to force a refetch is a teaching device. You *could* instead do `setLocations([...locations, created])` with the returned object and skip the refetch. Show the dependency pattern because that's the concept; mention the alternative exists.

### Faded practice (we do) — the natural dependency case: search
This is where a dependency array really shines. You scaffold, he fills:
```python
# backend: accept an optional ?search= and filter
@app.get("/api/locations")
def get_locations(search: str | None = None):
    if search:
        return [l for l in locations if search.lower() in l["name"].lower()]
    return locations
```
```jsx
// frontend: his turn
const [searchTerm, setSearchTerm] = useState("");
useEffect(() => {
  // fetch `/api/locations?search=${searchTerm}` and setLocations
  ...
}, [searchTerm]);   // re-fetch every time the search box changes
```
Point out the loop: user types → `searchTerm` updates → dependency changed → effect re-runs → new results.

### Independent (you do)
Wire the real "create location" button on the map to `addLocation`. Create one, reload the page — it's still there. Then **restart the backend server** and reload — it's gone. Have him narrate why.

### Mastery check
He can explain the create→refetch loop and the difference between GET and POST, and can answer: *why does a new location survive a browser reload but not a server restart?* (It's in the server's memory, not saved anywhere permanent.)

### Boundary
Still an in-memory list — the server restart wipes it. That loss is the entire motivation for Lesson 3. Pydantic is doing input validation for free here (send a bad body, FastAPI rejects it); we lean on that more later.

---

# Lesson 3 — Add the database (SQLite)

*Raw SQL, no ORM yet — feel the SQL before the abstraction.*

**Pain.** Restart the server and the in-memory list is gone. Data that only lives in RAM isn't real persistence.

**Concept.** Save to a real database **file** on disk. SQLite is a genuine relational database with no server to run and no credentials — it's just a file (`locations.db`). Crucially, the **API contract doesn't change** (same `/api/locations` GET and POST), so the *frontend barely changes at all*. Only the backend's data source swaps from a Python list to a database.

### Worked example (I do)

Backend — `main.py` using Python's built-in `sqlite3` (no install needed):
```python
import sqlite3
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"], allow_headers=["*"],
)

DB = "locations.db"

def db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row   # makes rows behave like dicts
    return conn

# Create the table once, when the server starts (runs on import).
def init_db():
    conn = db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS locations (
            id   INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT    NOT NULL,
            lat  REAL    NOT NULL,
            lng  REAL    NOT NULL
        )
    """)
    conn.commit()
    conn.close()

init_db()

class LocationCreate(BaseModel):
    name: str
    lat: float
    lng: float

@app.get("/api/locations")
def get_locations():
    conn = db()
    rows = conn.execute("SELECT id, name, lat, lng FROM locations").fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.post("/api/locations")
def create_location(loc: LocationCreate):
    conn = db()
    cursor = conn.execute(
        "INSERT INTO locations (name, lat, lng) VALUES (?, ?, ?)",  # ? placeholders
        (loc.name, loc.lat, loc.lng),
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return {"id": new_id, "name": loc.name, "lat": loc.lat, "lng": loc.lng}
```

**Narrate.**
- **The schema is the lesson.** `CREATE TABLE` defines the shape of your data: columns and their types (`TEXT`, `REAL`), and `id INTEGER PRIMARY KEY AUTOINCREMENT` — every row gets a unique id automatically. Designing this well up front matters.
- **Three layers now:** frontend ↔ backend ↔ database. The frontend never talks to the database; the backend is the middle layer that translates HTTP requests into SQL.
- **`?` placeholders, not string formatting.** Never paste user input directly into a SQL string — use `?` and pass values separately. That's how you prevent SQL injection. (First real security habit; ties to the validation thread.)
- **The frontend didn't change.** Same endpoints, same JSON. That's the payoff of a stable API contract — you can swap the guts of the backend without touching the client.

### Faded practice (we do) — a DELETE endpoint
You scaffold, he writes the SQL:
```python
@app.delete("/api/locations/{loc_id}")
def delete_location(loc_id: int):
    conn = db()
    # his turn: DELETE the row WHERE id = loc_id  (use a ? placeholder)
    ...
    conn.commit()
    conn.close()
    return {"deleted": loc_id}
```

### Independent (you do)
Restart the backend server, reload the frontend — the locations are **still there**. That's the whole point; have him feel it. Then, from a cheat sheet of SQL keywords only, add a `GET /api/locations/{loc_id}` backed by `SELECT ... WHERE id = ?`.

### Mastery check
He can explain the three layers and why the frontend barely changed; what a primary key is; why `?` placeholders instead of string-building; and *why data now survives a server restart* (it's on disk, not in RAM).

### Boundary
Two frictions are now visible, and each is a future lesson — name them but don't solve them:
- Writing `SELECT`/`INSERT` strings everywhere gets repetitive and error-prone → that's what the **ORM (Lesson 4)** fixes.
- Changing the schema later (adding a column) means altering or dropping the table, risking your data → that's what **migrations / Alembic (Lesson 5)** fix.
- Also simplified for teaching: we open a fresh connection per request. Fine for SQLite and this scale; not how you'd pool connections in a big app.

---

## Where this leaves Colin
He now has the full loop working for real: a React frontend that fetches and creates locations, a FastAPI backend, and a SQLite database that persists across both client and server restarts. Every piece was motivated by losing data. Next up (Lesson 4): the raw SQL is starting to repeat — introduce SQLAlchemy so queries become Python objects instead of hand-written strings.
