import java.util.ArrayList;
import java.util.List;

public class Simulator {
    private Shape shape;
    private Settings settings;
    private int iteration;
    private double maxChange;
    private List<double[][]> frames; // one snapshot of the whole grid per iteration

    public Simulator(Shape shape, Settings settings) {
        this.shape = shape;
        this.settings = settings;
        iteration = 0;
        maxChange = Double.MAX_VALUE;
        frames = new ArrayList<>();
    }

    // Runs one full pass over the grid and returns the biggest temperature change.
    public double update() {
        double[][] newTemperatures = new double[shape.getRows()][shape.getCol()];
        double biggestChange = 0;

        // Start from the current temperatures so fixed/invalid pixels keep their values.
        for (int row = 0; row < shape.getRows(); row++) {
            for (int col = 0; col < shape.getCol(); col++) {
                newTemperatures[row][col] = shape.getTemperature(row, col);
            }
        }

        for (int row = 0; row < shape.getRows(); row++) {
            for (int col = 0; col < shape.getCol(); col++) {
                // Only update pixels that are part of the shape AND not fixed by the player.
                if (shape.getValidIndex(row, col) && !shape.getPlayerSetTemperature(row, col)) {
                    double sum = 0;
                    int n = 0;
                    double oldTemperature = shape.getTemperature(row, col);

                    // FIX: a neighbor only counts if it is a valid part of the shape.
                    // getValidIndex already rejects out-of-bounds indices, so this is safe
                    // on edges and works for irregular shapes.
                    if (shape.getValidIndex(row - 1, col)) { // up
                        sum += shape.getTemperature(row - 1, col);
                        n++;
                    }
                    if (shape.getValidIndex(row + 1, col)) { // down
                        sum += shape.getTemperature(row + 1, col);
                        n++;
                    }
                    if (shape.getValidIndex(row, col - 1)) { // left
                        sum += shape.getTemperature(row, col - 1);
                        n++;
                    }
                    if (shape.getValidIndex(row, col + 1)) { // right
                        sum += shape.getTemperature(row, col + 1);
                        n++;
                    }

                    // FIX: never divide by zero. An isolated pixel keeps its value.
                    if (n > 0) {
                        double newTemperature = sum / n;
                        double change = Math.abs(newTemperature - oldTemperature);
                        if (change > biggestChange) {
                            biggestChange = change;
                        }
                        newTemperatures[row][col] = newTemperature;
                    }
                }
            }
        }

        // Write the new values back into the shape.
        for (int row = 0; row < shape.getRows(); row++) {
            for (int col = 0; col < shape.getCol(); col++) {
                shape.setTemperature(row, col, newTemperatures[row][col]);
            }
        }

        return biggestChange;
    }

    // Runs until equilibrium (change below accuracy) or until max iterations.
    public void run() {
        frames.add(captureFrame()); // frame 0 = the starting grid
        while (iteration < settings.getMaxIterations() && maxChange > settings.getAccuracy()) {
            maxChange = update();
            iteration++;
            frames.add(captureFrame());
        }
    }

    // Copies the current grid temperatures into a fresh 2D array.
    private double[][] captureFrame() {
        double[][] frame = new double[shape.getRows()][shape.getCol()];
        for (int row = 0; row < shape.getRows(); row++) {
            for (int col = 0; col < shape.getCol(); col++) {
                frame[row][col] = shape.getTemperature(row, col);
            }
        }
        return frame;
    }

    public List<double[][]> getFrames() {
        return frames;
    }

    public int getIteration() {
        return iteration;
    }

    public double getMaxChange() {
        return maxChange;
    }

    public boolean reachedEquilibrium() {
        return maxChange <= settings.getAccuracy();
    }

    // Linear search across all valid pixels for the hottest one. Returns {row, col}.
    public int[] findHottest() {
        int[] result = { -1, -1 };
        double max = Double.NEGATIVE_INFINITY;
        for (int row = 0; row < shape.getRows(); row++) {
            for (int col = 0; col < shape.getCol(); col++) {
                if (shape.getValidIndex(row, col) && shape.getTemperature(row, col) > max) {
                    max = shape.getTemperature(row, col);
                    result[0] = row;
                    result[1] = col;
                }
            }
        }
        return result;
    }

    // Linear search across all valid pixels for the coldest one. Returns {row, col}.
    public int[] findColdest() {
        int[] result = { -1, -1 };
        double min = Double.POSITIVE_INFINITY;
        for (int row = 0; row < shape.getRows(); row++) {
            for (int col = 0; col < shape.getCol(); col++) {
                if (shape.getValidIndex(row, col) && shape.getTemperature(row, col) < min) {
                    min = shape.getTemperature(row, col);
                    result[0] = row;
                    result[1] = col;
                }
            }
        }
        return result;
    }
}
