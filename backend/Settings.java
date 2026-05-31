public class Settings {
    private int rows;
    private int col;
    private int maxIterations;
    private double accuracy;

    // Original constructor — keeps the same defaults you had before.
    public Settings(int rows, int col) {
        this.rows = rows;
        this.col = col;
        this.maxIterations = 1000;
        this.accuracy = 0.0001;
    }

    // New constructor — lets the website send its own iteration/accuracy limits.
    public Settings(int rows, int col, int maxIterations, double accuracy) {
        this.rows = rows;
        this.col = col;
        this.maxIterations = maxIterations;
        this.accuracy = accuracy;
    }

    public int getRows() {
        return rows;
    }

    public int getCol() {
        return col;
    }

    public int getMaxIterations() {
        return maxIterations;
    }

    public double getAccuracy() {
        return accuracy;
    }

}
