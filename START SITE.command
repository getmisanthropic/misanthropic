#!/bin/bash
cd "$(dirname "$0")"
PORT=8765

# Kill stale server on this port
lsof -ti :$PORT | xargs kill -9 2>/dev/null
sleep 0.5

# Try python3 first, fallback to python
if command -v python3 >/dev/null 2>&1; then
  PYTHON_CMD=python3
elif command -v python >/dev/null 2>&1; then
  PYTHON_CMD=python
else
  echo "Error: Python not found. Please install Python or try 'python3 --version' from Terminal."
  read -p "Press Enter to close..."
  exit 1
fi

$PYTHON_CMD -m http.server $PORT &
SERVER_PID=$!
sleep 1.1

open "http://127.0.0.1:$PORT" 2>/dev/null || open "http://localhost:$PORT" 2>/dev/null

echo ""
echo "========================================"
echo "  MISANTHROPIC SITE READY"
echo "========================================"
echo ""
echo "  >>> IMPORTANT: DO NOT PASTE INTO GOOGLE <<<"
echo "  Click the address bar at the VERY TOP of your browser (the url bar),"
echo "  delete what is there and paste exactly this:"
echo ""
echo "     http://127.0.0.1:$PORT"
echo ""
echo "  Or try:"
echo "     http://localhost:$PORT"
echo ""
echo "  ⚠️ Do not type only 'localhost' → you must add the port (:$PORT)"
echo "  ⚠️ 127.0.0.1 is more reliable"
echo ""
echo "  (See HOW_TO_OPEN.txt in the folder for full instructions)"
echo ""
echo "  Press ENTER in this window to stop the server."
echo "========================================"
echo ""
read -p "Press Enter to close... "

kill $SERVER_PID 2>/dev/null || lsof -ti :$PORT | xargs kill -9 2>/dev/null