#!/usr/bin/env bash
# Usage: ./generate_env.sh [output_path]
OUTPUT_FILE="${1:-.env}"
echo "Outputting to $OUTPUT_FILE"

if command -v openssl >/dev/null 2>&1; then
    SESSION_SECRET="$(openssl rand -hex 32)"
else
    SESSION_SECRET="$(LC_ALL=C tr -dc 'a-f0-9' < /dev/urandom | head -c 64)"
fi

cat > "$OUTPUT_FILE" <<EOF
    POSTGRES_HOST=db
    POSTGRES_USER=postgres
    POSTGRES_PASSWORD=password
    POSTGRES_DB=study_sprout
    SESSION_SECRET=${SESSION_SECRET}
EOF

echo "Created $OUTPUT_FILE"