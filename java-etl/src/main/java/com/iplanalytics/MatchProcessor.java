package com.iplanalytics;

import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import com.opencsv.CSVWriter;

import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.*;

/**
 * Handles the Extract, Transform, and Load (ETL) operations for IPL Match data.
 */
public class MatchProcessor {
    private final String inputPath;
    private final String outputPath;

    /**
     * Constructor to initialize paths.
     * @param inputPath Path to the raw Kaggle CSV file.
     * @param outputPath Path where the cleaned CSV will be saved.
     */
    public MatchProcessor(String inputPath, String outputPath) {
        this.inputPath = inputPath;
        this.outputPath = outputPath;
    }

    /**
     * Orchestrates the ETL pipeline.
     */
    public void process() {
        List<String[]> rawData = extractData();
        if (rawData == null || rawData.isEmpty()) {
            System.out.println("No data extracted. Exiting.");
            return;
        }

        System.out.println("Total rows read (including header): " + rawData.size());

        List<String[]> transformedData = transformData(rawData);

        loadData(transformedData);
    }

    /**
     * EXTRACT phase: Reads the raw CSV file using OpenCSV.
     * @return A list of string arrays representing the CSV rows.
     */
    private List<String[]> extractData() {
        try (CSVReader reader = new CSVReaderBuilder(new FileReader(inputPath)).build()) {
            return reader.readAll();
        } catch (Exception e) {
            System.err.println("Error reading input file: " + e.getMessage());
            // In a real scenario we'd log this, for now we return an empty list
            return new ArrayList<>();
        }
    }

    /**
     * TRANSFORM phase: Applies business rules, filtering, and validation.
     * @param rawData The raw data extracted from the CSV.
     * @return The cleaned and transformed data.
     */
    private List<String[]> transformData(List<String[]> rawData) {
        String[] header = rawData.get(0);
        
        // Find indices of relevant columns
        int seasonIdx = getColIndex(header, "season");
        int cityIdx = getColIndex(header, "city");
        int venueIdx = getColIndex(header, "venue");
        int overIdx = getColIndex(header, "over");
        int ballIdx = getColIndex(header, "ball");
        int runsOffBatIdx = getColIndex(header, "runs_off_bat");
        int matchIdIdx = getColIndex(header, "match_id");
        int batsmanIdx = getColIndex(header, "batsman");
        
        // If we can't find required columns, return empty
        if (seasonIdx == -1 || runsOffBatIdx == -1 || overIdx == -1) {
            System.err.println("Critical columns missing from dataset. Aborting transformation.");
            return new ArrayList<>();
        }

        // Pass 1: Filter, clean, calculate basics, and collect aggregation data
        List<String[]> filteredRows = new ArrayList<>();
        Map<String, BatsmanStats> matchBatsmanStats = new HashMap<>();
        
        int rowsDropped = 0;

        for (int i = 1; i < rawData.size(); i++) {
            String[] row = rawData.get(i);
            
            // a) FILTER: Keep only seasons >= 2020
            try {
                // Season might be '2020/21', let's take the first 4 characters
                String seasonStr = row[seasonIdx].length() >= 4 ? row[seasonIdx].substring(0, 4) : row[seasonIdx];
                int season = Integer.parseInt(seasonStr);
                if (season < 2020) continue;
            } catch (NumberFormatException e) {
                // If season is not parseable, skip it
                continue;
            }

            // d) VALIDATION: Skip if over > 20 or runs_off_bat < 0
            try {
                int over = Integer.parseInt(row[overIdx]);
                int runsOffBat = Integer.parseInt(row[runsOffBatIdx]);
                
                if (over > 20 || runsOffBat < 0) {
                    System.out.println("Skipping corrupt row: over=" + over + ", runs=" + runsOffBat);
                    rowsDropped++;
                    continue;
                }
            } catch (NumberFormatException e) {
                rowsDropped++;
                continue;
            }

            // b) MISSING VALUES: Fill blank 'city' with first word of 'venue'
            if (cityIdx != -1 && venueIdx != -1) {
                if (row[cityIdx] == null || row[cityIdx].trim().isEmpty()) {
                    String venue = row[venueIdx];
                    if (venue != null && !venue.trim().isEmpty()) {
                        row[cityIdx] = venue.split(" ")[0]; // Get first word
                    }
                }
            }
            
            // Aggregate data for Strike Rate (Pass 1)
            if (matchIdIdx != -1 && batsmanIdx != -1) {
                String matchId = row[matchIdIdx];
                String batsman = row[batsmanIdx];
                String key = matchId + "_" + batsman;
                int runs = Integer.parseInt(row[runsOffBatIdx]);
                
                matchBatsmanStats.putIfAbsent(key, new BatsmanStats());
                matchBatsmanStats.get(key).addRunsAndBall(runs);
            }

            filteredRows.add(row);
        }

        // Pass 2: Calculate new columns and build final dataset
        List<String[]> finalData = new ArrayList<>();
        
        // Create new header
        String[] newHeader = Arrays.copyOf(header, header.length + 4);
        newHeader[header.length] = "run_rate";
        newHeader[header.length + 1] = "is_boundary";
        newHeader[header.length + 2] = "is_six";
        newHeader[header.length + 3] = "strike_rate";
        finalData.add(newHeader);

        for (String[] row : filteredRows) {
            String[] newRow = Arrays.copyOf(row, row.length + 4);
            
            int over = Integer.parseInt(row[overIdx]);
            int ball = Integer.parseInt(row[ballIdx]);
            int runsOffBat = Integer.parseInt(row[runsOffBatIdx]);
            
            // ball_number_in_innings (assuming over starts at 0, 1st ball is ball=1)
            int ballNumberInInnings = (over * 6) + ball;
            
            // c) CALCULATED COLUMNS
            // run_rate
            double runRate = ballNumberInInnings > 0 ? ((double) runsOffBat / ballNumberInInnings) * 6 : 0.0;
            newRow[row.length] = String.format("%.2f", runRate);
            
            // is_boundary
            newRow[row.length + 1] = (runsOffBat >= 4) ? "1" : "0";
            
            // is_six
            newRow[row.length + 2] = (runsOffBat == 6) ? "1" : "0";
            
            // strike_rate
            double strikeRate = 0.0;
            if (matchIdIdx != -1 && batsmanIdx != -1) {
                String key = row[matchIdIdx] + "_" + row[batsmanIdx];
                BatsmanStats stats = matchBatsmanStats.get(key);
                if (stats != null && stats.ballsFaced > 0) {
                    strikeRate = ((double) stats.totalRuns / stats.ballsFaced) * 100;
                }
            }
            newRow[row.length + 3] = String.format("%.2f", strikeRate);
            
            finalData.add(newRow);
        }

        System.out.println("Rows dropped due to validation rules: " + rowsDropped);
        return finalData;
    }

    /**
     * LOAD phase: Writes the cleaned and transformed data to a new CSV file.
     * @param data The final dataset to write.
     */
    private void loadData(List<String[]> data) {
        try (CSVWriter writer = new CSVWriter(new FileWriter(outputPath))) {
            writer.writeAll(data);
            System.out.println("Final rows exported: " + (data.size() - 1)); // -1 for header
            System.out.println("Data loaded successfully to: " + outputPath);
        } catch (IOException e) {
            System.err.println("Error writing output file: " + e.getMessage());
        }
    }

    /**
     * Helper to find a column index by name in the header.
     * @param header The CSV header array.
     * @param colName The name of the column to find.
     * @return The index of the column, or -1 if not found.
     */
    private int getColIndex(String[] header, String colName) {
        for (int i = 0; i < header.length; i++) {
            if (header[i].equalsIgnoreCase(colName)) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Helper class to track batsman statistics per match.
     */
    private static class BatsmanStats {
        int totalRuns = 0;
        int ballsFaced = 0;

        void addRunsAndBall(int runs) {
            this.totalRuns += runs;
            this.ballsFaced += 1; // Each row in this dataset represents one ball faced
        }
    }
}
