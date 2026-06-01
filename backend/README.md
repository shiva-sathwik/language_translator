# Language Translator Backend

This is a clean, modular, and beginner-friendly Node.js/Express backend developed for the Language Translator Web Application. It acts as an API bridge, receiving translation queries from the frontend, delegating them to the public MyMemory Translation API via Axios, and serving the formatted translation back to the client application.

---

## Folder Structure

```
backend/
├── server.js                 # Entry point of the Express application
├── package.json              # Project dependencies and script runner configurations
├── .env                      # Local environment variable configs (ignored by Git)
├── .env.example              # Template file showing available env parameters
├── routes/
│   └── translateRoutes.js    # Express route declarations (mapping URI paths to controllers)
├── controllers/
│   └── translateController.js # Request body parsing, parameter validation, and routing orchestration
├── services/
│   └── translatorService.js  # Service logic for making Axios API calls to MyMemory API
└── middleware/
    └── errorHandler.js       # Centralized global catch-all middleware for Express errors
```

---

## Getting Started

### Prerequisites

* Ensure you have [Node.js](https://nodejs.org/) installed (v16.0.0 or higher recommended).

### Installation

1. Open your terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install all required dependencies specified in `package.json`:
   ```bash
   npm install
   ```

### Configuration

1. Create a `.env` file by duplicating the provided `.env.example` file:
   ```bash
   cp .env.example .env
   ```

2. Open the `.env` file and customize the variables:
   * `PORT`: The network port the server listens on (defaults to `5000`).
   * `MYMEMORY_EMAIL`: (Optional) Registering your email boosts the MyMemory translation quota to 1,000 words per day.

---

## Running the Server

### Development Mode

Runs the application with **Nodemon** for live, auto-reloading upon file modifications:
```bash
npm run dev
```

### Production Mode

Starts the backend server standardly using Node:
```bash
npm start
```

---

## API Documentation

### 1. Health Check
Checks if the server is alive and functioning.

* **URL:** `/api/health`
* **Method:** `GET`
* **Response Format:** `JSON`
* **Success Response (200 OK):**
  ```json
  {
    "status": "ok",
    "message": "Language Translator Backend is running!",
    "timestamp": "2026-06-01T11:05:00.000Z"
  }
  ```

---

### 2. Translate Text
Performs translation on input text.

* **URL:** `/api/translate`
* **Method:** `POST`
* **Headers:** `Content-Type: application/json`
* **Request Body Parameters:**
  * `text` (String, Required): The text string to translate.
  * `source` (String, Required): ISO code of the source language (e.g. `en` for English).
  * `target` (String, Required): ISO code of the destination language (e.g. `hi` for Hindi).

* **Example Request Payload:**
  ```json
  {
    "text": "Hello, how are you?",
    "source": "en",
    "target": "hi"
  }
  ```

* **Success Response (200 OK):**
  ```json
  {
    "translatedText": "नमस्ते, आप कैसे हैं?"
  }
  ```

* **Error Responses:**
  * **400 Bad Request:** Missing fields, empty inputs, or non-string attributes.
    ```json
    {
      "error": "The \"text\" field is required."
    }
    ```
  * **429 Too Many Requests:** MyMemory API rate limits exceeded.
    ```json
    {
      "error": "Translation API rate limit exceeded or warning received."
    }
    ```
  * **502 Bad Gateway:** Downstream MyMemory network or service error.
    ```json
    {
      "error": "Translation API server error."
    }
    ```
