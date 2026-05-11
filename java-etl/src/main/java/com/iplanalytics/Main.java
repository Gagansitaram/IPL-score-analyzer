package com.iplanalytics;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

/**
 * Main entry point for the IPL ETL Pipeline.
 * Responsible for loading configurations and starting the processing.
 */
public class Main {

    /**
     * Main method. Loads config.properties and executes the MatchProcessor.
     * @param args Command line arguments (not used)
     */
    public static void main(String[] args) {
        Properties props = new Properties();
        
        try (InputStream input = Main.class.getClassLoader().getResourceAsStream("config.properties")) {
            if (input == null) {
                System.out.println("Sorry, unable to find config.properties");
                return;
            }
            props.load(input);
            
            String inputPath = props.getProperty("input.csv.path");
            String outputPath = props.getProperty("output.csv.path");
            
            System.out.println("Starting ETL Pipeline...");
            MatchProcessor processor = new MatchProcessor(inputPath, outputPath);
            processor.process();
            
            System.out.println("ETL Pipeline completed successfully.");
            
        } catch (IOException ex) {
            System.err.println("Error reading configuration file: " + ex.getMessage());
            ex.printStackTrace();
        }
    }
}
