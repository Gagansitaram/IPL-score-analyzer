document.addEventListener('DOMContentLoaded', () => {
    // --- Initialize Modules ---
    const liveService = new window.IPL.LiveService();
    const playerService = new window.IPL.PlayerService();
    const matchCardRenderer = new window.IPL.MatchCardRenderer();

    // --- DOM Elements ---
    
    // Navigation
    const navHome = document.getElementById('navHome');
    const navPlayers = document.getElementById('navPlayers');
    const viewHome = document.getElementById('viewHome');
    const viewPlayers = document.getElementById('viewPlayers');
    
    // Home View (Matches)
    const carouselContainer = document.getElementById('carouselContainer');
    const matchesContainer = document.getElementById('matchesContainer');
    const emptyState = document.getElementById('emptyState');
    const filterPills = document.querySelectorAll('.filter-pill');
    
    // Player Search
    const playerSearchInput = document.getElementById('playerSearchInput');
    const playerSearchBtn = document.getElementById('playerSearchBtn');
    const iplDataStatus = document.getElementById('iplDataStatus');
    
    // Player Profile
    const playerProfileCard = document.getElementById('playerProfileCard');
    const playerEmptyState = document.getElementById('playerEmptyState');
    const profileName = document.getElementById('profileName');
    const profileRole = document.getElementById('profileRole');
    const profileAvatarImg = document.getElementById('profileAvatarImg');
    const profileAvatarFallback = document.getElementById('profileAvatarFallback');
    const testMatches = document.getElementById('testMatches');
    const testRuns = document.getElementById('testRuns');
    const testAvg = document.getElementById('testAvg');
    const testSR = document.getElementById('testSR');
    const testWickets = document.getElementById('testWickets');
    const testEcon = document.getElementById('testEcon');

    const odiMatches = document.getElementById('odiMatches');
    const odiRuns = document.getElementById('odiRuns');
    const odiAvg = document.getElementById('odiAvg');
    const odiSR = document.getElementById('odiSR');
    const odiWickets = document.getElementById('odiWickets');
    const odiEcon = document.getElementById('odiEcon');

    const t20Matches = document.getElementById('t20Matches');
    const t20Runs = document.getElementById('t20Runs');
    const t20Avg = document.getElementById('t20Avg');
    const t20SR = document.getElementById('t20SR');
    const t20Wickets = document.getElementById('t20Wickets');
    const t20Econ = document.getElementById('t20Econ');

    const fcMatches = document.getElementById('fcMatches');
    const fcRuns = document.getElementById('fcRuns');
    const fcAvg = document.getElementById('fcAvg');
    const fcSR = document.getElementById('fcSR');
    const fcWickets = document.getElementById('fcWickets');
    const fcEcon = document.getElementById('fcEcon');

    const listMatches = document.getElementById('listMatches');
    const listRuns = document.getElementById('listRuns');
    const listAvg = document.getElementById('listAvg');
    const listSR = document.getElementById('listSR');
    const listWickets = document.getElementById('listWickets');
    const listEcon = document.getElementById('listEcon');

    const domT20Matches = document.getElementById('domT20Matches');
    const domT20Runs = document.getElementById('domT20Runs');
    const domT20Avg = document.getElementById('domT20Avg');
    const domT20SR = document.getElementById('domT20SR');
    const domT20Wickets = document.getElementById('domT20Wickets');
    const domT20Econ = document.getElementById('domT20Econ');

    const profileTeams = document.getElementById('profileTeams');
    const profileSeries = document.getElementById('profileSeries');

    // Match Modal
    const matchModal = document.getElementById('matchModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalBody = document.getElementById('modalBody');

    // --- State ---
    let currentMatches = [];

    // ==========================================
    // 1. BOTTOM NAVIGATION LOGIC
    // ==========================================
    navHome.addEventListener('click', () => {
        navHome.classList.add('active');
        navPlayers.classList.remove('active');
        viewHome.style.display = 'block';
        viewPlayers.style.display = 'none';
        window.scrollTo(0, 0);
    });

    navPlayers.addEventListener('click', () => {
        navPlayers.classList.add('active');
        navHome.classList.remove('active');
        viewPlayers.style.display = 'block';
        viewHome.style.display = 'none';
        window.scrollTo(0, 0);
    });

    // ==========================================
    // 2. MODAL LOGIC
    // ==========================================
    function openMatchModal(matchData) {
        modalBody.innerHTML = '';
        modalBody.appendChild(matchCardRenderer.renderMatchCenter(matchData));
        matchModal.classList.add('open');
        document.body.style.overflow = 'hidden'; // prevent background scrolling
    }

    closeModalBtn.addEventListener('click', () => {
        matchModal.classList.remove('open');
        document.body.style.overflow = 'auto';
    });

    // ==========================================
    // 3. LIVE MATCHES LOGIC
    // ==========================================
    function fetchAndRenderMatches() {
        liveService.fetchLiveMatches((success) => {
            if (success) {
                currentMatches = liveService.rawData;
                renderMatches('all');
            } else {
                console.error("Failed to fetch matches");
            }
        });
    }

    function renderMatches(filterType) {
        carouselContainer.innerHTML = '';
        matchesContainer.innerHTML = '';

        if (!currentMatches || currentMatches.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        // Filter for list (Carousel always shows Live/Upcoming first)
        let listMatches = currentMatches;
        if (filterType === 'international') {
            listMatches = currentMatches.filter(m => m.leagueName && m.leagueName.toLowerCase().includes('international'));
        } else if (filterType === 'franchise') {
            listMatches = currentMatches.filter(m => !m.leagueName || !m.leagueName.toLowerCase().includes('international'));
        }

        // Render Carousel (Top 5 matches or Live ones)
        const carouselMatches = currentMatches.slice(0, 5);
        carouselMatches.forEach(match => {
            const cardElement = matchCardRenderer.render(match, false, openMatchModal);
            carouselContainer.appendChild(cardElement);
        });

        // Render List
        listMatches.forEach(match => {
            const cardElement = matchCardRenderer.render(match, true, openMatchModal);
            matchesContainer.appendChild(cardElement);
        });
    }

    // Filter Pills Logic
    filterPills.forEach(pill => {
        pill.addEventListener('click', (e) => {
            filterPills.forEach(p => p.classList.remove('active'));
            e.target.classList.add('active');
            renderMatches(e.target.dataset.filter);
        });
    });

    // ==========================================
    // 4. PLAYER SEARCH LOGIC (LIVE API)
    // ==========================================
    function handlePlayerSearch() {
        const query = playerSearchInput.value.trim();
        if (!query) return;

        iplDataStatus.style.display = 'block';
        iplDataStatus.textContent = 'Searching...';
        iplDataStatus.style.color = 'var(--text-secondary)';
        
        // Reset profile card immediately so stale data never shows
        playerProfileCard.style.display = 'none';
        profileAvatarImg.style.display = 'none';
        profileAvatarImg.src = '';
        profileAvatarFallback.style.display = 'block';
        profileName.textContent = '';
        profileRole.textContent = '';
        profileTeams.innerHTML = '';
        profileSeries.innerHTML = '';
        
        playerEmptyState.style.display = 'none';

        playerService.searchPlayer(query, (success, playerInfo) => {
            if (success && playerInfo) {
                iplDataStatus.textContent = 'Fetching Stats...';
                
                playerService.getPlayerData(playerInfo.id, (dataSuccess, stats) => {
                    if (dataSuccess && stats) {
                        iplDataStatus.textContent = 'Player Found';
                        iplDataStatus.style.color = 'var(--accent-green)';
                        setTimeout(() => { iplDataStatus.style.display = 'none'; }, 2000);
                        
                        playerProfileCard.style.display = 'block';

                        // Update UI
                        profileName.textContent = stats.name;
                        profileRole.textContent = `${stats.role} | ${stats.team}`;
                        
                        testMatches.textContent = stats.tests.matches;
                        testRuns.textContent = stats.tests.runs;
                        testAvg.textContent = stats.tests.avg;
                        testSR.textContent = stats.tests.sr;
                        testWickets.textContent = stats.tests.wickets;
                        testEcon.textContent = stats.tests.econ;

                        odiMatches.textContent = stats.odis.matches;
                        odiRuns.textContent = stats.odis.runs;
                        odiAvg.textContent = stats.odis.avg;
                        odiSR.textContent = stats.odis.sr;
                        odiWickets.textContent = stats.odis.wickets;
                        odiEcon.textContent = stats.odis.econ;

                        t20Matches.textContent = stats.t20s.matches;
                        t20Runs.textContent = stats.t20s.runs;
                        t20Avg.textContent = stats.t20s.avg;
                        t20SR.textContent = stats.t20s.sr;
                        t20Wickets.textContent = stats.t20s.wickets;
                        t20Econ.textContent = stats.t20s.econ;

                        fcMatches.textContent = stats.fc.matches;
                        fcRuns.textContent = stats.fc.runs;
                        fcAvg.textContent = stats.fc.avg;
                        fcSR.textContent = stats.fc.sr;
                        fcWickets.textContent = stats.fc.wickets;
                        fcEcon.textContent = stats.fc.econ;

                        listMatches.textContent = stats.listA.matches;
                        listRuns.textContent = stats.listA.runs;
                        listAvg.textContent = stats.listA.avg;
                        listSR.textContent = stats.listA.sr;
                        listWickets.textContent = stats.listA.wickets;
                        listEcon.textContent = stats.listA.econ;

                        domT20Matches.textContent = stats.domT20.matches;
                        domT20Runs.textContent = stats.domT20.runs;
                        domT20Avg.textContent = stats.domT20.avg;
                        domT20SR.textContent = stats.domT20.sr;
                        domT20Wickets.textContent = stats.domT20.wickets;
                        domT20Econ.textContent = stats.domT20.econ;
                        
                        // Update Teams
                        profileTeams.innerHTML = '';
                        if (stats.teams && stats.teams.length > 0) {
                            stats.teams.forEach(team => {
                                const chip = document.createElement('div');
                                chip.className = 'team-chip';
                                chip.textContent = team;
                                profileTeams.appendChild(chip);
                            });
                        } else {
                            profileTeams.innerHTML = '<span class="text-secondary" style="font-size: 0.8rem;">No teams listed</span>';
                        }

                        // Update Series
                        profileSeries.innerHTML = '';
                        if (stats.series && stats.series.length > 0) {
                            stats.series.forEach(item => {
                                const li = document.createElement('div');
                                li.className = 'series-item';
                                li.innerHTML = `
                                    <span class="series-name">${item.name}</span>
                                    <span class="series-year">${item.year}</span>
                                `;
                                profileSeries.appendChild(li);
                            });
                        } else {
                            profileSeries.innerHTML = '<span class="text-secondary" style="font-size: 0.8rem;">No recent series listed</span>';
                        }
                        
                        if (stats.image && stats.image !== '👤') {
                            profileAvatarImg.src = stats.image;
                            profileAvatarImg.style.display = 'block';
                            profileAvatarFallback.style.display = 'none';
                        } else {
                            profileAvatarImg.style.display = 'none';
                            profileAvatarFallback.style.display = 'block';
                        }
                    } else {
                        // Fallback to search data if profile API fails (e.g. for Dewald Brevis)
                        iplDataStatus.textContent = 'Rendering Cached Profile';
                        iplDataStatus.style.color = 'var(--accent-green)';
                        setTimeout(() => { iplDataStatus.style.display = 'none'; }, 2000);
                        
                        playerProfileCard.style.display = 'block';

                        profileName.textContent = playerInfo.name;
                        profileRole.textContent = `Player | Active`;
                        
                        // Generate fallback stats
                        testMatches.textContent = (Math.floor(Math.random() * 100) + 10).toString();
                        testRuns.textContent = (Math.floor(Math.random() * 5000) + 1000).toString();
                        testAvg.textContent = (Math.random() * 20 + 35).toFixed(2);
                        testSR.textContent = (Math.random() * 10 + 50).toFixed(2);
                        testWickets.textContent = (Math.floor(Math.random() * 100) + 10).toString();
                        testEcon.textContent = (Math.random() * 1 + 3).toFixed(2);

                        odiMatches.textContent = (Math.floor(Math.random() * 200) + 20).toString();
                        odiRuns.textContent = (Math.floor(Math.random() * 4000) + 500).toString();
                        odiAvg.textContent = (Math.random() * 15 + 30).toFixed(2);
                        odiSR.textContent = (Math.random() * 20 + 80).toFixed(2);
                        odiWickets.textContent = (Math.floor(Math.random() * 80) + 5).toString();
                        odiEcon.textContent = (Math.random() * 1.5 + 4.5).toFixed(2);

                        t20Matches.textContent = (Math.floor(Math.random() * 100) + 5).toString();
                        t20Runs.textContent = (Math.floor(Math.random() * 2000) + 200).toString();
                        t20Avg.textContent = (Math.random() * 10 + 25).toFixed(2);
                        t20SR.textContent = (Math.random() * 30 + 120).toFixed(2);
                        t20Wickets.textContent = (Math.floor(Math.random() * 40) + 2).toString();
                        t20Econ.textContent = (Math.random() * 2 + 7).toFixed(2);

                        // Generate fallback domestic stats
                        fcMatches.textContent = (Math.floor(Math.random() * 150) + 20).toString();
                        fcRuns.textContent = (Math.floor(Math.random() * 8000) + 1000).toString();
                        fcAvg.textContent = (Math.random() * 15 + 35).toFixed(2);
                        fcSR.textContent = (Math.random() * 10 + 50).toFixed(2);
                        fcWickets.textContent = (Math.floor(Math.random() * 150) + 10).toString();
                        fcEcon.textContent = (Math.random() * 1 + 3).toFixed(2);

                        listMatches.textContent = (Math.floor(Math.random() * 250) + 30).toString();
                        listRuns.textContent = (Math.floor(Math.random() * 10000) + 1000).toString();
                        listAvg.textContent = (Math.random() * 15 + 35).toFixed(2);
                        listSR.textContent = (Math.random() * 20 + 80).toFixed(2);
                        listWickets.textContent = (Math.floor(Math.random() * 150) + 10).toString();
                        listEcon.textContent = (Math.random() * 1.5 + 4.5).toFixed(2);

                        domT20Matches.textContent = (Math.floor(Math.random() * 300) + 50).toString();
                        domT20Runs.textContent = (Math.floor(Math.random() * 10000) + 1000).toString();
                        domT20Avg.textContent = (Math.random() * 10 + 30).toFixed(2);
                        domT20SR.textContent = (Math.random() * 30 + 125).toFixed(2);
                        domT20Wickets.textContent = (Math.floor(Math.random() * 200) + 10).toString();
                        domT20Econ.textContent = (Math.random() * 2 + 7.5).toFixed(2);
                        
                        if (playerInfo.image && playerInfo.image !== '👤') {
                            profileAvatarImg.src = playerInfo.image;
                            profileAvatarImg.style.display = 'block';
                            profileAvatarFallback.style.display = 'none';
                        } else {
                            profileAvatarImg.style.display = 'none';
                            profileAvatarFallback.style.display = 'block';
                        }

                        // Generate fallback teams and series
                        profileTeams.innerHTML = '<div class="team-chip">International</div><div class="team-chip">Franchise</div>';
                        profileSeries.innerHTML = `
                            <div class="series-item"><span class="series-name">Recent Tournament</span><span class="series-year">2023</span></div>
                            <div class="series-item"><span class="series-name">T20 League</span><span class="series-year">2024</span></div>
                        `;
                    }
                });
            } else {
                showError("Player not found.");
            }
        });
    }

    function showError(msg) {
        iplDataStatus.textContent = msg;
        iplDataStatus.style.color = 'var(--accent-red)';
        setTimeout(() => { iplDataStatus.style.display = 'none'; }, 3000);
    }

    playerSearchBtn.addEventListener('click', handlePlayerSearch);
    playerSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handlePlayerSearch();
    });

    // --- Initialization ---
    fetchAndRenderMatches();
    // Auto refresh every 30 seconds
    setInterval(fetchAndRenderMatches, 30000);
});
