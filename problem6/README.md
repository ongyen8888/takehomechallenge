# Scoreboard API Service Specification

## 1. Overview

This module provides backend services for a **live scoreboard system** that:

* Tracks user scores
* Displays the Top 10 users
* Updates scores in real time
* Prevents unauthorized or malicious score manipulation

The module will be implemented as a backend API service.

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 2. Goals

* Maintain accurate score records
* Provide real-time scoreboard updates
* Prevent unauthorized score inflation
* Support high concurrency
* Be horizontally scalable

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 3. High-Level Architecture

Frontend (Website)
|
| HTTPS REST API
v
Application Server (Score Service)
|
| Publish score update events
v
Message Broker (Redis Pub/Sub or Kafka)
|
v
WebSocket Gateway
|
v
Connected Clients (Live Scoreboard Updates)

Persistent Storage:
Application Server <-> Database (PostgreSQL / MySQL)

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 4. Functional Requirements

## 4.1 Submit Score Action

When a user completes an action:

1. Frontend sends authenticated API request
2. Backend validates request
3. Backend verifies action authenticity
4. Score is incremented
5. Event is published for real-time update
6. Updated leaderboard recalculated
7. Clients receive live update

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## 4.2 Get Top 10 Scores

Endpoint returns:

* Top 10 users
* Sorted by score DESC
* Deterministic tie-breaking (createdAt ASC or userId ASC)

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## 4.3 Real-Time Updates

When score changes:

* Event emitted
* Top 10 recalculated
* Broadcast via WebSocket

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 5. API Specification

## 5.1 Authentication

All endpoints require:

Authorization: Bearer <JWT>

JWT must:

* Be signed (RS256 preferred)
* Contain userId
* Not be expired

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## 5.2 Endpoints

### POST /api/v1/score/submit

Description: Increment score after successful action.

Request:

{
"actionId": "uuid",
"metadata": {}
}

Response:

{
"success": true,
"newScore": 150
}

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

### GET /api/v1/leaderboard/top10

Response:

{
"data": [
{
"userId": "uuid",
"username": "player1",
"score": 999
}
],
"lastUpdated": "timestamp"
}

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

### WebSocket Endpoint

wss://api.example.com/leaderboard

Event: leaderboard:update

Payload:

{
"data": [...top10]
}

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 6. Database Design

## 6.1 users

| Column    | Type      | Notes  |
| --------- | --------- | ------ |
| id        | UUID PK   |        |
| username  | VARCHAR   | unique |
| createdAt | TIMESTAMP |        |

---

## 6.2 scores

| Column    | Type      | Notes     |
| --------- | --------- | --------- |
| userId    | UUID FK   | indexed   |
| score     | BIGINT    | default 0 |
| updatedAt | TIMESTAMP | indexed   |

Index:

* INDEX score_desc_idx (score DESC)

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## 6.3 actions (Anti-cheat)

| Column    | Type      | Notes                 |
| --------- | --------- | --------------------- |
| id        | UUID PK   |                       |
| userId    | UUID      |                       |
| verified  | BOOLEAN   | must be true to score |
| createdAt | TIMESTAMP |                       |

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 7. Security Requirements

## 7.1 Prevent Unauthorized Score Updates

* All endpoints require JWT authentication
* Validate JWT signature
* Verify userId matches token
* Reject expired tokens

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## 7.2 Prevent Score Forgery

Server must:

* Validate actionId exists
* Ensure action not previously used
* Verify action integrity (signature or server-side validation)
* Enforce idempotency

Optional:

* HMAC signature on action
* Nonce validation
* Rate limiting per user
* Replay attack protection

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## 7.3 Rate Limiting

* 10 score submissions per minute per user
* IP-based monitoring
* Automatic ban threshold

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 8. Concurrency & Consistency

Score update must be atomic.

Example SQL:

UPDATE scores
SET score = score + 10
WHERE userId = ?

OR use:

SELECT ... FOR UPDATE

Ensure:

* No race conditions
* No lost updates

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 9. Real-Time Update Strategy

Option A: Redis Pub/Sub
Option B: Kafka
Option C: Direct WebSocket broadcast (small scale)

Recommended:

* Redis for simplicity
* Maintain Top 10 cached in Redis Sorted Set

Redis structure:

ZADD leaderboard score userId

Fetch top 10:

ZREVRANGE leaderboard 0 9 WITHSCORES

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 10. Performance Requirements

* Leaderboard fetch < 100ms
* Score submission < 200ms
* Support 10k concurrent WebSocket connections
* Horizontal scaling supported

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 11. Error Handling

Standard format:

{
"error": {
"code": "INVALID_ACTION",
"message": "Action verification failed"
}
}

HTTP codes:

200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
429 Too Many Requests
500 Internal Error

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 12. Observability

* Structured logging (JSON)
* Distributed tracing (OpenTelemetry)
* Metrics:

  * score_update_latency
  * leaderboard_fetch_latency
  * websocket_connections
  * failed_auth_attempts

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 13. Deployment Considerations

* Containerized (Docker)
* Stateless application server
* Redis cluster for pub/sub + cache
* PostgreSQL primary-replica setup
* Load balancer in front of API

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 14. Flow of Execution Diagram

## 14.1 Score Submission Flow

User Action Completed
|
v
Frontend sends POST /score/submit
|
v
API Server

* Validate JWT
* Validate actionId
* Check replay
* Atomic DB update
  |
  v
  Publish Event (Redis)
  |
  v
  WebSocket Server
  |
  v
  Broadcast Updated Top 10
  |
  v
  Clients update UI

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 15. Non-Functional Requirements

* System must tolerate duplicate requests safely
* Must support horizontal scaling
* Must maintain strong consistency for score increments
* Must degrade gracefully under load

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 16. Additional Recommendations for Improvement

1. Use event sourcing for auditability
2. Store score history table for dispute resolution
3. Use Redis sorted set for O(log N) leaderboard updates
4. Add anomaly detection for cheating
5. Consider eventual consistency tradeoffs
6. Add circuit breaker for DB overload
7. Add CAPTCHA if suspicious activity detected
8. Add admin dashboard for manual moderation

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 17. Open Questions (To Be Clarified)

* What is the scoring rule per action?
* Can scores decrease?
* Are leaderboards global or segmented?
* Do we need seasonal resets?
* Is multi-region deployment required?

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 18. Summary

This module provides:

* Secure score submission
* Real-time leaderboard updates
* Anti-cheat validation
* Atomic and scalable score management
* Production-ready architectural design
