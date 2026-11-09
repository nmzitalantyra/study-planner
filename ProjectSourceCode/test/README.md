# Testing

## Setup commands
From `ProjectSourceCode/`:

    docker compose -p lab10-tests -f docker-compose.test.yaml run --rm --no-deps tests npm ci
    docker compose -p lab10-tests -f docker-compose.test.yaml up --abort-on-container-exit --exit-code-from tests
    docker compose -p lab10-tests -f docker-compose.test.yaml down

## Registration contract

| Item | Contract |
|---|---|
| Endpoint | POST /register |
| Request | JSON containing username, email, and password |
| Valid username | A nonempty string, at most 32 characters |
| Valid email | A string matching the format check in create.sql |
| Valid password | A string of at least 8 characters |
| Success | 201 and {"message":"Registration successful"} |
| Missing password | 400 and {"message":"Invalid input"} |
| Duplicate username or email | 409 and {"message":"Username or email already exists"} |
| Persistence | One row in users; password_hash stores an argon2 hash |

## Cleanup
Each registration test deletes its own test user before and after running.