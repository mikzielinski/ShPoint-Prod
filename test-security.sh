#!/bin/bash

# 🧪 Security Testing Script for ShPoint
# Test DDoS protection, rate limiting, and security headers

BASE_URL="https://shpoint-prod.onrender.com"
FRONTEND_URL="https://shpoint.netlify.app"

echo "🔒 Testing ShPoint Security..."
echo "================================"

# Test 1: Rate Limiting - Auth endpoints
echo "📊 Test 1: Rate Limiting (Auth endpoints)"
echo "Testing /auth/google endpoint..."
for i in {1..12}; do
  echo -n "Request $i: "
  response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/google")
  echo "HTTP $response"
  if [ "$response" = "429" ]; then
    echo "✅ Rate limiting working! Blocked after $i requests"
    break
  fi
  sleep 1
done

echo ""

# Test 2: Rate Limiting - API endpoints
echo "📊 Test 2: Rate Limiting (API endpoints)"
echo "Testing /api/me endpoint..."
for i in {1..105}; do
  echo -n "Request $i: "
  response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/me")
  echo "HTTP $response"
  if [ "$response" = "429" ]; then
    echo "✅ API rate limiting working! Blocked after $i requests"
    break
  fi
  if [ $((i % 20)) -eq 0 ]; then
    echo "  ... $i requests sent"
  fi
done

echo ""

# Test 3: Security Headers
echo "🔒 Test 3: Security Headers"
echo "Checking security headers..."
headers=$(curl -s -I "$BASE_URL/health")
echo "$headers" | grep -E "(X-Frame-Options|X-Content-Type-Options|X-XSS-Protection|Strict-Transport-Security|Content-Security-Policy)"

echo ""

# Test 4: DDoS Detection
echo "🚨 Test 4: DDoS Detection"
echo "Sending rapid requests to trigger DDoS detection..."
for i in {1..50}; do
  curl -s -o /dev/null "$BASE_URL/health" &
done
wait
echo "Sent 50 concurrent requests"
echo "Check server logs for DDoS detection messages"

echo ""

# Test 5: Brute Force Protection
echo "🔐 Test 5: Brute Force Protection"
echo "Testing multiple auth attempts..."
for i in {1..8}; do
  echo -n "Auth attempt $i: "
  response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/google")
  echo "HTTP $response"
  if [ "$response" = "429" ]; then
    echo "✅ Brute force protection working! Blocked after $i attempts"
    break
  fi
  sleep 2
done

echo ""

# Test 6: API Token Authentication
echo "🔑 Test 6: API Token Authentication"
echo "Testing Bearer token endpoints..."
echo "Note: This requires a valid API token"
echo "GET /api/v1/characters (should require Bearer token)"
response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/characters")
echo "Without token: HTTP $response (should be 401)"

echo ""

# Test 7: Environment Validation
echo "🔧 Test 7: Environment Validation"
echo "Testing health endpoint..."
response=$(curl -s "$BASE_URL/health")
echo "Health check response: $response"

echo ""

# Test 8: CORS Protection
echo "🌐 Test 8: CORS Protection"
echo "Testing CORS headers..."
cors_headers=$(curl -s -H "Origin: https://malicious-site.com" -I "$BASE_URL/api/me")
echo "$cors_headers" | grep -E "(Access-Control-Allow-Origin|Access-Control-Allow-Credentials)"

echo ""
echo "🎯 Security Testing Complete!"
echo "Check the results above and server logs for detailed information."
