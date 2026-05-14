#!/bin/bash
echo "======================================================="
echo "   Starting Airbnb NYC Data Visualization Dashboard"
echo "======================================================="
echo ""
echo "Please wait while we start the local server..."
echo "The dashboard will automatically open in your default browser."
echo ""

# Open the browser based on OS
if which xdg-open > /dev/null
then
  xdg-open "http://localhost:8000/Code/index.html" &
elif which open > /dev/null
then
  open "http://localhost:8000/Code/index.html" &
fi

# Run http-server in the current directory
npx -y http-server . -p 8000
