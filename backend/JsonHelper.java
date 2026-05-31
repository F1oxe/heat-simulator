import java.util.ArrayList;
import java.util.List;

// A tiny JSON helper written by hand so the project needs NO external libraries.
// It only handles the specific shapes of data this project sends, not all JSON.
public class JsonHelper {

    // Reads a whole-number value for a key, e.g. "rows":10
    public static int getInt(String json, String key, int fallback) {
        int idx = json.indexOf("\"" + key + "\"");
        if (idx < 0) return fallback;
        idx = json.indexOf(':', idx) + 1;
        while (idx < json.length() && Character.isWhitespace(json.charAt(idx))) idx++;
        StringBuilder sb = new StringBuilder();
        while (idx < json.length() && (Character.isDigit(json.charAt(idx)) || json.charAt(idx) == '-')) {
            sb.append(json.charAt(idx++));
        }
        return sb.length() > 0 ? Integer.parseInt(sb.toString()) : fallback;
    }

    // Reads a decimal value for a key, e.g. "accuracy":0.0001
    public static double getDouble(String json, String key, double fallback) {
        int idx = json.indexOf("\"" + key + "\"");
        if (idx < 0) return fallback;
        idx = json.indexOf(':', idx) + 1;
        while (idx < json.length() && Character.isWhitespace(json.charAt(idx))) idx++;
        StringBuilder sb = new StringBuilder();
        while (idx < json.length()) {
            char ch = json.charAt(idx);
            if (Character.isDigit(ch) || ch == '.' || ch == '-' || ch == '+' || ch == 'e' || ch == 'E') {
                sb.append(ch);
                idx++;
            } else {
                break;
            }
        }
        return sb.length() > 0 ? Double.parseDouble(sb.toString()) : fallback;
    }

    // Reads the 2D boolean "shape" array (which cells the user drew).
    public static boolean[][] getShape(String json, int rows, int cols) {
        boolean[][] shape = new boolean[rows][cols];
        int idx = json.indexOf("\"shape\"");
        if (idx < 0) return shape;
        idx = json.indexOf('[', idx) + 1; // step inside the outer [

        for (int r = 0; r < rows; r++) {
            idx = json.indexOf('[', idx) + 1; // step inside this row's [
            for (int c = 0; c < cols; c++) {
                while (idx < json.length() && (json.charAt(idx) == ' ' || json.charAt(idx) == ',')) idx++;
                if (json.startsWith("true", idx)) {
                    shape[r][c] = true;
                    idx += 4;
                } else if (json.startsWith("false", idx)) {
                    shape[r][c] = false;
                    idx += 5;
                }
            }
            idx = json.indexOf(']', idx) + 1; // step past this row's ]
        }
        return shape;
    }

    // Reads the "fixedTemps" array of {row, col, temp} objects.
    // Each result is a double[] of {row, col, temp}.
    public static List<double[]> getFixedTemps(String json) {
        List<double[]> list = new ArrayList<>();
        int idx = json.indexOf("\"fixedTemps\"");
        if (idx < 0) return list;
        idx = json.indexOf('[', idx);
        int arrayEnd = json.indexOf(']', idx);
        if (arrayEnd < 0) return list;

        while (idx < arrayEnd) {
            int objStart = json.indexOf('{', idx);
            if (objStart < 0 || objStart > arrayEnd) break;
            int objEnd = json.indexOf('}', objStart);
            if (objEnd < 0) break;

            String obj = json.substring(objStart, objEnd + 1);
            int row = getInt(obj, "row", 0);
            int col = getInt(obj, "col", 0);
            double temp = getDouble(obj, "temp", 0);
            list.add(new double[] { row, col, temp });

            idx = objEnd + 1;
        }
        return list;
    }

    // Builds the JSON response: the animation frames plus summary info.
    public static String buildResponse(List<double[][]> frames, boolean[][] valid,
                                       int iterations, boolean equilibrium, int rows, int cols) {
        // Keep at most ~200 frames so the response stays small for big grids.
        List<double[][]> chosen = new ArrayList<>();
        int step = Math.max(1, frames.size() / 200);
        for (int i = 0; i < frames.size(); i += step) {
            chosen.add(frames.get(i));
        }
        if (!chosen.isEmpty() && chosen.get(chosen.size() - 1) != frames.get(frames.size() - 1)) {
            chosen.add(frames.get(frames.size() - 1)); // always include the final state
        }

        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"iterations\":").append(iterations).append(",");
        sb.append("\"equilibrium\":").append(equilibrium).append(",");

        // valid grid
        sb.append("\"valid\":[");
        for (int r = 0; r < rows; r++) {
            sb.append("[");
            for (int c = 0; c < cols; c++) {
                sb.append(valid[r][c]);
                if (c < cols - 1) sb.append(",");
            }
            sb.append("]");
            if (r < rows - 1) sb.append(",");
        }
        sb.append("],");

        // frames
        sb.append("\"frames\":[");
        for (int f = 0; f < chosen.size(); f++) {
            double[][] frame = chosen.get(f);
            sb.append("[");
            for (int r = 0; r < rows; r++) {
                sb.append("[");
                for (int c = 0; c < cols; c++) {
                    // round to 2 decimals to shrink the response
                    sb.append(Math.round(frame[r][c] * 100.0) / 100.0);
                    if (c < cols - 1) sb.append(",");
                }
                sb.append("]");
                if (r < rows - 1) sb.append(",");
            }
            sb.append("]");
            if (f < chosen.size() - 1) sb.append(",");
        }
        sb.append("]");

        sb.append("}");
        return sb.toString();
    }
}
