import urllib.request
import re

req = urllib.request.Request('https://html.duckduckgo.com/html/?q="raw.githubusercontent.com"+deliveries.csv+ipl', headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')
matches = re.findall(r'https://raw\.githubusercontent\.com[^\s"\'<>]+', html)
for m in set(matches):
    print(m)
