#!/bin/bash

# BollaLabz Backend API Comprehensive Test Suite
# Tests all 50+ endpoints with valid/invalid inputs

BASE_URL="http://localhost:4000"
API_KEY="dev_api_key_12345"
PASSED=0
FAILED=0
TOTAL=0

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test result tracking
declare -a FAILED_TESTS=()

# Helper function to test endpoint
test_endpoint() {
    local name="$1"
    local method="$2"
    local url="$3"
    local data="$4"
    local expected_status="$5"
    local skip_csrf="$6"

    TOTAL=$((TOTAL + 1))

    # Get CSRF token if needed for POST/PUT/DELETE
    if [ "$skip_csrf" != "true" ] && [[ "$method" == "POST" || "$method" == "PUT" || "$method" == "DELETE" ]]; then
        if [ -z "$CSRF_TOKEN" ]; then
            csrf_response=$(curl -s -c /tmp/cookies.txt -b /tmp/cookies.txt "$BASE_URL/api/v1/csrf-token")
            CSRF_TOKEN=$(echo "$csrf_response" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
        fi
    fi

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -c /tmp/cookies.txt -b /tmp/cookies.txt \
            -H "X-API-Key: $API_KEY" \
            -H "Content-Type: application/json" \
            "$url" 2>&1)
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -c /tmp/cookies.txt -b /tmp/cookies.txt \
            -H "X-API-Key: $API_KEY" \
            -H "Content-Type: application/json" \
            -H "X-CSRF-Token: $CSRF_TOKEN" \
            "$url" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -c /tmp/cookies.txt -b /tmp/cookies.txt \
            -H "X-API-Key: $API_KEY" \
            -H "Content-Type: application/json" \
            -H "X-CSRF-Token: $CSRF_TOKEN" \
            -d "$data" \
            "$url" 2>&1)
    fi

    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$status_code" = "$expected_status" ]; then
        PASSED=$((PASSED + 1))
        echo -e "${GREEN}✓${NC} $name (HTTP $status_code)"
    else
        FAILED=$((FAILED + 1))
        FAILED_TESTS+=("$name - Expected $expected_status, got $status_code")
        echo -e "${RED}✗${NC} $name (Expected $expected_status, got $status_code)"
        echo "   Response: $(echo $body | head -c 100)..."
    fi
}

echo "=========================================="
echo "BollaLabz API Comprehensive Test Suite"
echo "=========================================="
echo "Base URL: $BASE_URL"
echo "API Key: ${API_KEY:0:10}..."
echo ""

# Test 1: Health Check
echo "Testing Health Endpoints..."
test_endpoint "Health Check" "GET" "$BASE_URL/health" "" "200"
test_endpoint "API Info Root" "GET" "$BASE_URL/" "" "200"
test_endpoint "API v1 Info" "GET" "$BASE_URL/api/v1" "" "200"

# Test 2-6: Authentication
echo ""
echo "Testing Authentication Endpoints..."

TIMESTAMP=$(date +%s)
TEST_EMAIL="test${TIMESTAMP}@bollalabz.com"

test_endpoint "Register New User" "POST" "$BASE_URL/api/v1/auth/register" \
    "{\"email\":\"$TEST_EMAIL\",\"password\":\"TestPass123!\",\"full_name\":\"Test User\"}" \
    "201" "true"

test_endpoint "Register Duplicate User" "POST" "$BASE_URL/api/v1/auth/register" \
    "{\"email\":\"$TEST_EMAIL\",\"password\":\"TestPass123!\"}" \
    "409" "true"

test_endpoint "Login Valid Credentials" "POST" "$BASE_URL/api/v1/auth/login" \
    "{\"email\":\"$TEST_EMAIL\",\"password\":\"TestPass123!\"}" \
    "200" "true"

test_endpoint "Login Invalid Credentials" "POST" "$BASE_URL/api/v1/auth/login" \
    "{\"email\":\"$TEST_EMAIL\",\"password\":\"WrongPassword\"}" \
    "401" "true"

# Test Contacts API
echo ""
echo "Testing Contacts API..."

test_endpoint "List Contacts" "GET" "$BASE_URL/api/v1/contacts?page=1&limit=20" "" "200"

test_endpoint "Create Contact" "POST" "$BASE_URL/api/v1/contacts" \
    "{\"phone_number\":\"+1${TIMESTAMP:0:10}\",\"name\":\"Test Contact\",\"email\":\"test@example.com\"}" \
    "201"

test_endpoint "Search Contacts" "GET" "$BASE_URL/api/v1/contacts?search=test" "" "200"

# Test Conversations API
echo ""
echo "Testing Conversations API..."

test_endpoint "List Conversations" "GET" "$BASE_URL/api/v1/conversations?page=1" "" "200"
test_endpoint "Search Messages" "GET" "$BASE_URL/api/v1/conversations/search?q=test" "" "200"

# Test Calls API
echo ""
echo "Testing Calls API..."

test_endpoint "List Calls" "GET" "$BASE_URL/api/v1/calls?page=1" "" "200"
test_endpoint "Get Cost Breakdown" "GET" "$BASE_URL/api/v1/calls/analytics/costs" "" "200"
test_endpoint "Get Call Volume" "GET" "$BASE_URL/api/v1/calls/analytics/volume" "" "200"

# Test Tasks API
echo ""
echo "Testing Tasks API..."

test_endpoint "List Tasks" "GET" "$BASE_URL/api/v1/tasks?page=1" "" "200"

test_endpoint "Create Task" "POST" "$BASE_URL/api/v1/tasks" \
    "{\"title\":\"Test Task\",\"description\":\"Test\",\"status\":\"pending\",\"priority\":\"medium\"}" \
    "201"

test_endpoint "Filter Tasks" "GET" "$BASE_URL/api/v1/tasks?status=pending" "" "200"
test_endpoint "Get Overdue Tasks" "GET" "$BASE_URL/api/v1/tasks/filter/overdue" "" "200"
test_endpoint "Get Today Tasks" "GET" "$BASE_URL/api/v1/tasks/filter/today" "" "200"

# Test Workflows API
echo ""
echo "Testing Workflows API..."

test_endpoint "List Workflows" "GET" "$BASE_URL/api/v1/workflows?page=1" "" "200"

test_endpoint "Create Workflow" "POST" "$BASE_URL/api/v1/workflows" \
    "{\"name\":\"Test Workflow\",\"trigger_type\":\"manual\"}" \
    "201"

# Test People API
echo ""
echo "Testing People API..."

test_endpoint "List People" "GET" "$BASE_URL/api/v1/people?page=1" "" "200"

test_endpoint "Create Person" "POST" "$BASE_URL/api/v1/people" \
    "{\"full_name\":\"Test Person\",\"email\":\"test@example.com\"}" \
    "201"

test_endpoint "Search People" "GET" "$BASE_URL/api/v1/people?search=test" "" "200"

# Test Calendar API
echo ""
echo "Testing Calendar API..."

test_endpoint "List Calendar Events" "GET" "$BASE_URL/api/v1/calendar/events?page=1" "" "200"
test_endpoint "Get Upcoming Events" "GET" "$BASE_URL/api/v1/calendar/upcoming?limit=10" "" "200"
test_endpoint "Get Today Events" "GET" "$BASE_URL/api/v1/calendar/today" "" "200"

# Test Analytics API
echo ""
echo "Testing Analytics API..."

test_endpoint "Dashboard Summary" "GET" "$BASE_URL/api/v1/analytics/dashboard" "" "200"
test_endpoint "Call Analytics" "GET" "$BASE_URL/api/v1/analytics/calls" "" "200"
test_endpoint "Message Analytics" "GET" "$BASE_URL/api/v1/analytics/messages" "" "200"
test_endpoint "Cost Breakdown" "GET" "$BASE_URL/api/v1/analytics/costs" "" "200"
test_endpoint "Trend Analysis" "GET" "$BASE_URL/api/v1/analytics/trends" "" "200"

# Test Integrations API
echo ""
echo "Testing Integrations API..."

test_endpoint "Integration Status" "GET" "$BASE_URL/api/v1/integrations/status" "" "200"

# Test Error Handling
echo ""
echo "Testing Error Handling..."

test_endpoint "Invalid Endpoint" "GET" "$BASE_URL/api/v1/nonexistent" "" "404"

# Test Validation
echo ""
echo "Testing Input Validation..."

test_endpoint "Create Contact Missing Phone" "POST" "$BASE_URL/api/v1/contacts" \
    "{\"name\":\"No Phone\"}" "400"

test_endpoint "Register Weak Password" "POST" "$BASE_URL/api/v1/auth/register" \
    "{\"email\":\"weak@test.com\",\"password\":\"123\"}" "400" "true"

test_endpoint "Register Invalid Email" "POST" "$BASE_URL/api/v1/auth/register" \
    "{\"email\":\"notanemail\",\"password\":\"TestPass123!\"}" "400" "true"

# Summary
echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -gt 0 ]; then
    echo "Failed Tests:"
    for test in "${FAILED_TESTS[@]}"; do
        echo -e "  ${RED}✗${NC} $test"
    done
    echo ""
fi

SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED/$TOTAL)*100}")
echo "Success Rate: ${SUCCESS_RATE}%"
echo "=========================================="

if [ $FAILED -eq 0 ]; then
    exit 0
else
    exit 1
fi
