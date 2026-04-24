"""End-to-end smoke test for TaskFlow API."""

import json
import urllib.request
import urllib.error

BASE = "http://127.0.0.1:8000"


def req(method, path, body=None, token=None):
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


# 1. Signup
status, body = req("POST", "/auth/signup", {"email": "test@taskflow.dev", "password": "secret123"})
print(f"[{status}] Signup: {body.get('email', body)}")
assert status == 201, f"Signup failed: {body}"

# 2. Login
status, body = req("POST", "/auth/login", {"email": "test@taskflow.dev", "password": "secret123"})
token = body.get("access_token")
print(f"[{status}] Login: token={str(token)[:30]}...")
assert status == 200 and token, f"Login failed: {body}"

# 3. Create Board
status, body = req("POST", "/boards", {"title": "My Kanban Board"}, token)
board_id = body.get("id")
print(f"[{status}] Create Board: id={board_id}")
assert status == 201 and board_id, f"Create board failed: {body}"

# 4. Add Column
status, body = req("POST", f"/boards/{board_id}/columns", {"title": "To Do"}, token)
col_id = body.get("id")
print(f"[{status}] Add Column: id={col_id}, position={body.get('position')}")
assert status == 201 and col_id, f"Add column failed: {body}"

# 5. Add a second column (tests auto-position increment)
status, body2 = req("POST", f"/boards/{board_id}/columns", {"title": "In Progress"}, token)
print(f"[{status}] Add Column 2: position={body2.get('position')}")
assert body2.get("position", 0) > body.get("position", 0), "Position not incrementing!"

# 6. Add Card
status, body = req("POST", f"/columns/{col_id}/cards", {"title": "First Task", "description": "Build the UI"}, token)
card_id = body.get("id")
print(f"[{status}] Add Card: id={card_id}, position={body.get('position')}")
assert status == 201 and card_id, f"Add card failed: {body}"

# 7. Add second Card (tests auto-position increment)
status, body2 = req("POST", f"/columns/{col_id}/cards", {"title": "Second Task"}, token)
print(f"[{status}] Add Card 2: position={body2.get('position')}")
assert body2.get("position", 0) > body.get("position", 0), "Card position not incrementing!"

# 8. Fetch full board (nested + sorted)
status, body = req("GET", f"/boards/{board_id}", token=token)
cols = body.get("columns", [])
cards = cols[0].get("cards", []) if cols else []
print(f"[{status}] Board detail: {len(cols)} column(s), {len(cards)} card(s)")
print(f"    Column 1: '{cols[0]['title']}' pos={cols[0]['position']}")
print(f"    Column 2: '{cols[1]['title']}' pos={cols[1]['position']}")
print(f"    Card 1:   '{cards[0]['title']}' pos={cards[0]['position']}")
print(f"    Card 2:   '{cards[1]['title']}' pos={cards[1]['position']}")
assert cols[0]["position"] < cols[1]["position"], "Columns not sorted by position!"
assert cards[0]["position"] < cards[1]["position"], "Cards not sorted by position!"

# 9. PATCH card (reorder using midpoint)
mid = (cards[0]["position"] + cards[1]["position"]) / 2
status, body = req("PATCH", f"/cards/{cards[1]['id']}", {"position": mid}, token)
print(f"[{status}] Reorder Card: new position={body.get('position')} (midpoint={mid})")
assert status == 200, f"Reorder failed: {body}"

print()
print("=" * 40)
print("  All tests passed!")
print("=" * 40)
