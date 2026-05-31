public class Shape {
    private Pixel[][] pixels;

    public Shape(Settings settings) {
        pixels = new Pixel[settings.getRows()][settings.getCol()];
        for (int row = 0; row < settings.getRows(); row++) {
            for (int col = 0; col < settings.getCol(); col++) {
                pixels[row][col] = new Pixel(row, col, 0.0, false, false);
            }
        }
    }

    public int getRows() {
        return pixels.length;
    }

    public int getCol() {
        return pixels[0].length;
    }

    public double getTemperature(int row, int col) {
        return pixels[row][col].getTemperature();
    }

    public void setTemperature(int row, int col, double temperature) {
        pixels[row][col].setTemperature(temperature);
    }

    public boolean getPlayerSetTemperature(int row, int col) {
        return pixels[row][col].getPlayerSetTemperature();
    }

    public void setPlayerSetTemperature(int row, int col, boolean yayOrNay) {
        pixels[row][col].setPlayerTemperature(yayOrNay);
    }

    public boolean getValidIndex(int row, int col) {
        if (!(row >= 0 && row < getRows()) || !(col >= 0 && col < getCol())) {
            return false;
        }
        return pixels[row][col].getValidIndex();
    }

    public void setValidIndex(int row, int col, boolean yayOrNay) {
        pixels[row][col].setValidIndex(yayOrNay);
    }

    public void playerDrawnPixel(int row, int col) {
        setValidIndex(row, col, true);
    }

    public void setPlayerPixel(int row, int col, double temperature) {
        setTemperature(row, col, temperature);
        setPlayerSetTemperature(row, col, true);
        setValidIndex(row, col, true);
    }

    public void printShape() {
        for (int row = 0; row < getRows(); row++) {
            for (int col = 0; col < getCol(); col++) {
                if (getPlayerSetTemperature(row, col)) {
                    System.out.print("T ");
                } else {
                    System.out.print("0 ");
                }
            }
            System.out.println();
        }
    }

    public void printTemperatures() {
        for (int row = 0; row < getRows(); row++) {
            for (int col = 0; col < getCol(); col++) {
                if (getValidIndex(row, col)) {
                    String temp = getTemperature(row, col) + "";
                    System.out.print("(" + temp.substring(0, 4) + ") ");
                }
            }
            System.out.println();
        }
    }
}
