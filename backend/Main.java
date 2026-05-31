public class Main {
    public static void main(String[] args) {
        Settings settings = new Settings(5, 5);
        Shape shape = new Shape(settings);

        for (int row = 0; row < settings.getRows(); row++) {
            for (int col = 0; col < settings.getCol(); col++) {
                shape.playerDrawnPixel(row, col);
            }
        }

        shape.setPlayerPixel(0, 0, 100.0);
        shape.setPlayerPixel(4, 4, 50);
        shape.setPlayerPixel(2, 2, 67);

        System.out.println("Initial:");
        shape.printShape();

        Simulator simulator = new Simulator(shape, settings);
        simulator.run();

        System.out.println("\nFinal:");
        shape.printTemperatures();

    }
}
