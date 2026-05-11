export default async function handler(req, res) {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: "Missing query parameter 'q'" });
    }
    
    const encodedQuery = encodeURIComponent(q);
    const response = await fetch(`https://site.web.api.espn.com/apis/search/v2?region=in&lang=en&query=${encodedQuery}&limit=5&type=player`, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
