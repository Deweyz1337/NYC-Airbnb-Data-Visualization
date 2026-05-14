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
