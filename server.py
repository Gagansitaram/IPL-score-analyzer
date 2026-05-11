import http.server
import socketserver
import urllib.request
import urllib.parse
import json

PORT = 8000

class ProxyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Intercept API calls to bypass browser CORS and WAF restrictions
        parsed_path = urllib.parse.urlparse(self.path)
        
        if parsed_path.path == '/api/scores':
            try:
                print("Fetching live scores from ESPN API...")
                req = urllib.request.Request(
                    'https://site.api.espn.com/apis/site/v2/sports/cricket/scorepanel', 
                    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
                )
                with urllib.request.urlopen(req) as response:
                    data = response.read()
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(data)
            except Exception as e:
                print(f"Proxy Error: {e}")
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
        
        elif parsed_path.path == '/api/search-player':
            try:
                query = urllib.parse.parse_qs(parsed_path.query).get('q', [''])[0]
                encoded_query = urllib.parse.quote_plus(query)
                print(f"Searching for player: {query}...")
                
                req = urllib.request.Request(
                    f'https://site.web.api.espn.com/apis/search/v2?region=in&lang=en&query={encoded_query}&limit=5&type=player', 
                    headers={'User-Agent': 'Mozilla/5.0'}
                )
                with urllib.request.urlopen(req) as response:
                    data = response.read()
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(data)
            except Exception as e:
                print(f"Proxy Error: {e}")
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
                
        elif parsed_path.path == '/api/player-data':
            try:
                player_id = urllib.parse.parse_qs(parsed_path.query).get('id', [''])[0]
                print(f"Fetching player data for ID: {player_id}...")
                
                req = urllib.request.Request(
                    f'https://site.web.api.espn.com/apis/common/v3/sports/cricket/athletes/{player_id}', 
                    headers={'User-Agent': 'Mozilla/5.0'}
                )
                with urllib.request.urlopen(req) as response:
                    data = response.read()
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(data)
            except Exception as e:
                print(f"Proxy Error: {e}")
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
        else:
            # Serve static files (index.html, JS, CSS) normally
            super().do_GET()

    def end_headers(self):
        # Prevent browser caching of all files so JS changes take effect immediately
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

# Allow restarting the server quickly without "Address already in use" errors
socketserver.TCPServer.allow_reuse_address = True

with socketserver.TCPServer(("", PORT), ProxyHTTPRequestHandler) as httpd:
    print(f"Universal Cricket Dashboard Server running at http://localhost:{PORT}")
    print("Serving files and proxying API requests...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
