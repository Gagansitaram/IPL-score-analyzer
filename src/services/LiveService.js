window.IPL = window.IPL || {};

window.IPL.LiveService = class LiveService {
    constructor() {
        this.rawData = [];
        this.filteredData = [];
        this.API_URL = '/api/scores'; // Proxied through local Python server
    }

    /**
     * Fetch Live/Recent matches from ESPN API
     */
    async fetchLiveMatches(onComplete) {
        try {
            const response = await fetch(this.API_URL);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            this.rawData = this._parseESPNData(data);
            this.filteredData = [...this.rawData];
            
            if (onComplete) onComplete(true);
        } catch (error) {
            console.error("Error fetching live matches:", error);
            if (onComplete) onComplete(false);
        }
    }

    /**
     * Parse ESPN JSON structure into a flat array of match objects
     */
    _parseESPNData(data) {
        const matches = [];
        
        if (!data || !data.scores) return matches;

        data.scores.forEach(league => {
            if (!league.events) return;
            
            league.events.forEach(event => {
                const competition = event.competitions[0];
                const status = event.status;
                const competitors = competition.competitors || [];
                
                // Determine format
                let format = "Other";
                const eventType = competition.class?.eventType || "";
                if (eventType.includes("Test") || eventType.includes("First-class")) format = "Test";
                else if (eventType.includes("ODI") || eventType.includes("List A")) format = "ODI";
                else if (eventType.includes("T20")) format = "T20";

                // Map Competitors
                const team1 = competitors.find(c => c.order === 1) || {};
                const team2 = competitors.find(c => c.order === 2) || {};

                matches.push({
                    id: event.id,
                    name: event.name || competition.description,
                    leagueName: league.name,
                    format: format,
                    date: new Date(competition.date),
                    venue: competition.venue?.fullName || "TBC",
                    state: status.type.state, // 'in' (live), 'post' (finished), 'pre' (upcoming)
                    statusSummary: status.summary || status.type.description,
                    team1: {
                        name: team1.team?.displayName || "TBA",
                        logo: team1.team?.logo || "",
                        score: team1.score || ""
                    },
                    team2: {
                        name: team2.team?.displayName || "TBA",
                        logo: team2.team?.logo || "",
                        score: team2.score || ""
                    }
                });
            });
        });

        // Sort: Live first, then major leagues, then by date (newest first)
        const majorKeywords = ["IPL", "Indian Premier League", "International", "ICC", "World Cup", "T20I", "ODI", "Test", "Trophy"];
        
        return matches.sort((a, b) => {
            // Priority 1: Live matches
            if (a.state === 'in' && b.state !== 'in') return -1;
            if (a.state !== 'in' && b.state === 'in') return 1;
            
            // Priority 2: Major leagues
            const aIsMajor = majorKeywords.some(k => (a.leagueName || "").includes(k));
            const bIsMajor = majorKeywords.some(k => (b.leagueName || "").includes(k));
            if (aIsMajor && !bIsMajor) return -1;
            if (!aIsMajor && bIsMajor) return 1;
            
            // Priority 3: Date
            return b.date - a.date;
        });
    }

    /**
     * Apply UI Filters
     */
    applyFilters(format, state, searchQuery) {
        const query = searchQuery.toLowerCase().trim();
        
        this.filteredData = this.rawData.filter(match => {
            const matchFormat = format === 'All' || match.format === format;
            const matchState = state === 'All' || match.state === state;
            
            let matchSearch = true;
            if (query) {
                const t1 = (match.team1.name || "").toLowerCase();
                const t2 = (match.team2.name || "").toLowerCase();
                const ln = (match.leagueName || "").toLowerCase();
                matchSearch = t1.includes(query) || t2.includes(query) || ln.includes(query);
            }

            return matchFormat && matchState && matchSearch;
        });
    }
};
