window.IPL = window.IPL || {};

window.IPL.KpiCards = class KpiCards {
    constructor() {
        this.elMatches = document.getElementById('kpiMatches');
        this.elRuns = document.getElementById('kpiRuns');
        this.elAvgScore = document.getElementById('kpiAvgScore');
        this.elTopVenue = document.getElementById('kpiTopVenue');
    }

    update(dataService) {
        if (!dataService || dataService.filteredData.length === 0) {
            this.reset();
            return;
        }

        this.elMatches.textContent = this.formatNumber(dataService.getTotalMatches());
        this.elRuns.textContent = this.formatNumber(dataService.getTotalRuns());
        this.elAvgScore.textContent = dataService.getAvgScore();
        this.elTopVenue.textContent = dataService.getTopVenue();
    }

    reset() {
        this.elMatches.textContent = '-';
        this.elRuns.textContent = '-';
        this.elAvgScore.textContent = '-';
        this.elTopVenue.textContent = '-';
    }

    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
};
