import sys
import time
import json
import os

sys.path.insert(0, 'ai/app')
from main import app
import uvicorn
import threading
import requests

# Start FastAPI server in a thread
server_thread = threading.Thread(target=lambda: uvicorn.run(app, host='127.0.0.1', port=8001, log_level='error'))
server_thread.daemon = True
server_thread.start()

# Wait for server to start
time.sleep(2)

# Verify server is up
try:
    r = requests.get('http://127.0.0.1:8001/health', timeout=5)
    print(f"Health check: {r.status_code} {r.text}")
except Exception as e:
    print(f"Health check failed: {e}")
    sys.exit(1)

# Define AI endpoints to test
endpoints = [
    ('GET', '/health'),
    ('POST', '/api/ai/sales-prediction'),
    ('POST', '/api/ai/inventory-prediction'),
    ('POST', '/api/ai/customer-analysis'),
    ('POST', '/api/ai/recommendations'),
    ('POST', '/api/ai/anomaly-detection'),
    ('POST', '/api/ai/chatbot'),
]

# For endpoints requiring internal key, skip if no key configured
internal_key = os.environ.get('AI_SERVICE_INTERNAL_KEY', '')
headers = {}
if internal_key:
    headers['X-Internal-Key'] = internal_key

# Make requests and capture log output
log_file = 'ai/logs/fastapi_test.log'
os.makedirs('ai/logs', exist_ok=True)

results = []
for method, path in endpoints:
    try:
        url = f'http://127.0.0.1:8001{path}'
        start = time.time()
        
        if method == 'GET':
            r = requests.get(url, headers=headers, timeout=10)
        else:
            # Some endpoints require body, skip if no body specified
            if 'chatbot' in path:
                r = requests.post(url, json={'message': 'test', 'page': 'dashboard'}, headers=headers, timeout=10)
            elif 'sales-prediction' in path:
                from app.schemas.requests import SalesPredictionRequest
                # Skip complex requests without full schema
                r = requests.post(url, headers=headers, timeout=10)
            else:
                r = requests.post(url, headers=headers, timeout=10)
        
        elapsed = int((time.time() - start) * 1000)
        status = r.status_code
        
        # Check the log file for our entry
        log_found = False
        if os.path.exists(log_file):
            with open(log_file, 'r') as f:
                for line in f:
                    if f'[AI] {method} {path} {status} {elapsed}ms' in line:
                        log_found = True
                        break
        
        result = f"[{method}] {path} -> {status} {elapsed}ms -> Log: {'YES' if log_found else 'NO'}"
        results.append(result)
        print(result)
    except Exception as e:
        result = f"[{method}] {path} -> ERROR: {e}"
        results.append(result)
        print(result)
    
    # Small delay
    time.sleep(0.5)
    
# Final summary
print(f"\n{'='*60}")
print("FASTAPI LOGGING VERIFICATION SUMMARY")
print(f"{'='*60}")
log_found_count = sum(1 for r in results if 'Log: YES' in r)
print(f"Total endpoints: {len(results)}")
print(f"Log entries found: {log_found_count}")
if log_found_count == len(results):
    print("STATUS: PASS - All FastAPI endpoints produce log entries")
else:
    print("STATUS: FAIL - Some endpoints missing log entries")

# Cleanup
server_thread._stop()
print("\nTest complete.")