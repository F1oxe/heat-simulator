public class Pixel {
    private int row;
    private int col;
    private double temperature;
    private boolean playerSetTemperature;
    private boolean validIndex;

    public Pixel(int row, int col, double temperature, boolean playerTemperature, boolean validIndex) {
        this.row = row;
        this.col = col;
        this.temperature = temperature;
        this.playerSetTemperature = playerTemperature;
        this.validIndex = validIndex;
    }

    public int getRow() {
        return row;
    }

    public int getCol() {
        return col;
    }

    public double getTemperature() {
        return temperature;
    }

    public void setTemperature(double temperature) {
        this.temperature = temperature;
    }

    public boolean getPlayerSetTemperature() {
        return playerSetTemperature;
    }

    public void setPlayerTemperature(boolean yayOrNay) {
        playerSetTemperature = yayOrNay;
    }

    public boolean getValidIndex() {
        return validIndex;
    }

    public void setValidIndex(boolean yayOrNay) {
        validIndex = yayOrNay;
    }

}
