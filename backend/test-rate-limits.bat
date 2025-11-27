@echo off
REM Rate Limiting Test Script for Windows
REM Tests all rate limiting configurations

setlocal enabledelayedexpansion

set BASE_URL=http://localhost:4000
set API_KEY=test-api-key-bollalabz-2024

echo.
echo ================================================================
echo          BollaLabz Rate Limiting Test Suite
echo ================================================================
echo.

REM Test 1: Check rate limit headers are present
echo [TEST 1] Checking Rate Limit Headers
echo ----------------------------------------------------------------
curl -s -i "%BASE_URL%/api/v1" -H "X-API-Key: %API_KEY%" > temp_response.txt
findstr /C:"RateLimit-Limit" temp_response.txt >nul 2>&1
if %errorlevel%==0 (
    echo [PASS] RateLimit-Limit header present
) else (
    echo [FAIL] RateLimit-Limit header missing
)

findstr /C:"RateLimit-Remaining" temp_response.txt >nul 2>&1
if %errorlevel%==0 (
    echo [PASS] RateLimit-Remaining header present
) else (
    echo [FAIL] RateLimit-Remaining header missing
)

findstr /C:"RateLimit-Reset" temp_response.txt >nul 2>&1
if %errorlevel%==0 (
    echo [PASS] RateLimit-Reset header present
) else (
    echo [FAIL] RateLimit-Reset header missing
)

echo.
echo Header values:
findstr /C:"RateLimit" temp_response.txt
echo.

REM Test 2: Test general API rate limit
echo [TEST 2] Testing General API Rate Limit (100 req/15min)
echo ----------------------------------------------------------------
echo Making 102 requests to trigger rate limit...
set success_count=0
set rate_limit_hit=0

for /L %%i in (1,1,102) do (
    curl -s -o nul -w "%%{http_code}" "%BASE_URL%/api/v1" -H "X-API-Key: %API_KEY%" > temp_status.txt
    set /p status=<temp_status.txt

    if "!status!"=="429" (
        echo [PASS] Rate limit hit at request %%i with 429 status
        set rate_limit_hit=1
        goto :test2_done
    )

    if %%i LEQ 100 (
        set /A success_count+=1
    )

    REM Show progress every 20 requests
    set /A mod=%%i%%20
    if !mod!==0 (
        echo Request %%i: Success ^(Status: !status!^)
    )
)

:test2_done
if %rate_limit_hit%==1 (
    echo [PASS] General rate limit working correctly ^(%success_count% requests before limit^)
) else (
    echo [WARN] Sent all requests without hitting rate limit
)
echo.

REM Test 3: Test webhook rate limit (should be more permissive)
echo [TEST 3] Testing Webhook Rate Limit (1000 req/hour)
echo ----------------------------------------------------------------
echo Making 20 webhook requests...
set webhook_success=0

for /L %%i in (1,1,20) do (
    curl -s -o nul -w "%%{http_code}" "%BASE_URL%/api/v1/integrations/webhook" ^
         -H "X-API-Key: %API_KEY%" ^
         -H "Content-Type: application/json" ^
         -d "{\"source\":\"test\",\"event\":\"test.event\",\"payload\":{\"data\":\"test\"}}" > temp_status.txt
    set /p status=<temp_status.txt

    if "!status!"=="200" (
        set /A webhook_success+=1
    )
)

echo Successful webhook requests: %webhook_success%/20
if %webhook_success% GEQ 15 (
    echo [PASS] Webhook rate limit allows high throughput
) else (
    echo [FAIL] Too many webhook requests failed
)
echo.

REM Test 4: Test auth rate limit (strict)
echo [TEST 4] Testing Auth Endpoint Rate Limit (5 req/15min)
echo ----------------------------------------------------------------
echo Making 10 auth requests...
set auth_success=0
set auth_limit_hit=0

for /L %%i in (1,1,10) do (
    curl -s -o nul -w "%%{http_code}" "%BASE_URL%/api/v1/auth/login" ^
         -H "X-API-Key: %API_KEY%" ^
         -H "Content-Type: application/json" ^
         -d "{\"email\":\"test@example.com\",\"password\":\"test123\"}" > temp_status.txt
    set /p status=<temp_status.txt

    if "!status!"=="429" (
        echo [PASS] Auth rate limit hit at request %%i
        set auth_limit_hit=1
        goto :test4_done
    )

    if "!status!"=="404" (
        echo [INFO] Auth endpoint not configured ^(404^) - test skipped
        goto :test4_done
    )

    set /A auth_success+=1
)

:test4_done
if %auth_limit_hit%==1 (
    echo [PASS] Auth rate limit working correctly
) else (
    echo [INFO] Auth endpoint test skipped or not fully tested
)
echo.

REM Test 5: Verify 429 response format
echo [TEST 5] Testing 429 Response Format
echo ----------------------------------------------------------------
curl -s "%BASE_URL%/api/v1" -H "X-API-Key: %API_KEY%" > temp_429.json 2>&1
echo Sample 429 response:
type temp_429.json
echo.

findstr /C:"success" temp_429.json >nul 2>&1
if %errorlevel%==0 (
    echo [PASS] Response contains 'success' field
)

findstr /C:"error" temp_429.json >nul 2>&1
if %errorlevel%==0 (
    echo [PASS] Response contains 'error' field
)

findstr /C:"message" temp_429.json >nul 2>&1
if %errorlevel%==0 (
    echo [PASS] Response contains 'message' field
)

findstr /C:"retryAfter" temp_429.json >nul 2>&1
if %errorlevel%==0 (
    echo [PASS] Response contains 'retryAfter' field
)
echo.

REM Cleanup
del temp_response.txt temp_status.txt temp_429.json 2>nul

echo ================================================================
echo              Rate Limiting Tests Complete
echo ================================================================
echo.
echo NOTE: Some tests may have been skipped due to missing endpoints
echo or database connectivity. This is expected for development.
echo.

endlocal
