# Chirp API



### GET /api/chirps
Returns a list of chirps. Supports filtering by author, if `authorId` query parameter is provided.

**Query Parameters:**
- `authorId` (string, optional): Return chirps from a specific author.


**Examples:**
- `GET /api/chirps`
- `GET /api/chirps?authorId=123`

**Responses:**
- `200 OK`: Returns an array of chirps.
- `400 Bad Request`: Invalid query parameter.
- `500 Internal Server Error`: Server-side error.


### POST /api/chirps
Creates a new chirp.

### **Request Body:**- `body` (string, required): The content of the chirp.


**Examples:**
- `POST /api/chirps` with body `{ "body": "Hello, world!" }`
- `POST /api/chirps` with body `{ "body": "Another chirp!" }`
- `POST /api/chirps` with body `{ "body": "Chirping away!" }`

**Responses:**
- `201 Created`: Chirp successfully created.
- `400 Bad Request`: Missing or invalid request body.
- `401 Unauthorized`: Missing or invalid authentication token.
- `500 Internal Server Error`: Server-side error.
- `404 Not Found`: User not found.
-