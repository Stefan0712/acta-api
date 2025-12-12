**Docket API** is the backend service for the Docket application, built with Node.js, Express, TypeScript, and MongoDB. It features offline-first synchronization capabilities, JWT authentication, and group collaboration tools.

## 🚀 Getting Started

### Prerequisites
* Node.js (v18+)
* MongoDB (Running locally or cloud)

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/yourusername/docket-api.git](https://github.com/yourusername/docket-api.git)
    cd docket-api
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory:
    ```env
    PORT=5000
    MONGO_URI=mongodb://localhost:27017/docket-db
    JWT_SECRET=your_super_secret_key
    JWT_EXPIRE=30d
    FRONT_END_IP=<Your device ip if you try to connect from a separate device on the same network>
    ```

4.  **Run the Server**
    ```bash
    # Development
    npm run dev
    ```

---

## 📡 API Reference

**Base URL:** `http://localhost:5000/api`

| Resource | Method | Path | Key Parameter | Description |
|:---|:---|:---|:---|:---|
|User|POST|/auth/register|{email, username, password}|Create a new user|
|User|POST|/auth/login|{email, password}|Login existing user|
|User|GET|/auth/me|_id|Get all user's data|
|Group|GET|/groups|_id|Get all user's groups|
|Group|POST|/groups|groupData|Create a group|
|Group|DELETE|/groups/:id|Group id|Delete a specific group|
|Group|GET|/groups/:id/leave|User's id, Group's id|Leave a group|
|Group|GET|/groups/:id|_id, data|Update group|
|Group|GET|/groups/invite/lookup|Invite token|Get info about an invite|
|Group|GET|/groups/invite/accept|User's id, Invite token|Accept an invite to join a group|
|Group|GET|/groups/:id/invite/generate|Group's id|Generate an invite|
|List|POST|/lists|List data|Create a new list|
|List|GET|/lists/|Group's id|Get all lists from a group|
|List|GET|/lists/:id|List id|Get a list by id|
|List|PUT|/lists/:id|List id|Update a list|
|List|DELETE|/lists/:id|List id|Delete a list|
|Item|GET|/items|List id|Get all items from a list|
|Item|POST|/items/|Item data|Create an item|
|Item|PUT|/items/:id|Item id|Update an item|
|Item|DELETE|/items/:id|Item id|Delete an item|

