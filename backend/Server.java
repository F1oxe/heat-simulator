import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;

// A small HTTP server built on Java's built-in HttpServer (no external libraries).
// It exposes one endpoint, POST /simulate, which runs the existing Simulator.
public class Server {

    public static void main(String[] args) throws IOException {
        int port = 8080;
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/simulate", new SimulateHandler());
        server.createContext("/health", new HealthHandler());
        server.setExecutor(null); // use the default executor
        server.start();
        System.out.println("Heat Simulator backend running at http://localhost:" + port);
        System.out.println("POST a shape to http://localhost:" + port + "/simulate");
    }

    // Adds the CORS headers the browser needs to talk to this server.
    private static void addCors(HttpExchange exchange) {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
    }

    private static void send(HttpExchange exchange, int code, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        exchange.sendResponseHeaders(code, bytes.length);
        OutputStream os = exchange.getResponseBody();
        os.write(bytes);
        os.close();
    }

    // Simple "is the server up?" check.
    static class HealthHandler implements HttpHandler {
        public void handle(HttpExchange exchange) throws IOException {
            addCors(exchange);
            send(exchange, 200, "{\"status\":\"ok\"}");
        }
    }

    // The main endpoint: receives a shape + fixed temps, runs the simulation, returns frames.
    static class SimulateHandler implements HttpHandler {
        public void handle(HttpExchange exchange) throws IOException {
            addCors(exchange);

            // Browsers send an OPTIONS "preflight" before the real POST.
            if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            if (!exchange.getRequestMethod().equalsIgnoreCase("POST")) {
                send(exchange, 405, "{\"error\":\"Use POST\"}");
                return;
            }

            try {
                String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
                String response = simulate(body);
                send(exchange, 200, response);
            } catch (Exception e) {
                e.printStackTrace();
                send(exchange, 500, "{\"error\":\"" + e.getMessage() + "\"}");
            }
        }

        // Turns the JSON request into Shape/Settings, runs the Simulator, returns JSON.
        private String simulate(String json) {
            int rows = JsonHelper.getInt(json, "rows", 5);
            int cols = JsonHelper.getInt(json, "cols", 5);
            int maxIter = JsonHelper.getInt(json, "maxIterations", 1000);
            double accuracy = JsonHelper.getDouble(json, "accuracy", 0.0001);
            boolean[][] drawn = JsonHelper.getShape(json, rows, cols);
            List<double[]> fixedTemps = JsonHelper.getFixedTemps(json);

            Settings settings = new Settings(rows, cols, maxIter, accuracy);
            Shape shape = new Shape(settings);

            // Mark every cell the user drew as part of the shape.
            for (int r = 0; r < rows; r++) {
                for (int c = 0; c < cols; c++) {
                    if (drawn[r][c]) {
                        shape.playerDrawnPixel(r, c);
                    }
                }
            }

            // Lock in the fixed-temperature points.
            for (double[] fixed : fixedTemps) {
                int r = (int) fixed[0];
                int c = (int) fixed[1];
                double temp = fixed[2];
                if (r >= 0 && r < rows && c >= 0 && c < cols) {
                    shape.setPlayerPixel(r, c, temp);
                }
            }

            Simulator simulator = new Simulator(shape, settings);
            simulator.run();

            return JsonHelper.buildResponse(
                    simulator.getFrames(),
                    drawn,
                    simulator.getIteration(),
                    simulator.reachedEquilibrium(),
                    rows, cols);
        }
    }
}
