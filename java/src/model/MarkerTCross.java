package model;

import java.util.StringJoiner;

public class MarkerTCross extends ImageData {

    private final int id;
    public double orientation;
    public int x1, y1, x2, y2, x3, y3, x4, y4;

    public MarkerTCross(
            int id, String filePath, int x, int y, double orientation,
            int x1, int y1, int x2, int y2, int x3, int y3, int x4, int y4
    ) {
        super(filePath, x, y);
        this.id = id;
        this.orientation = orientation;
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.x3 = x3;
        this.y3 = y3;
        this.x4 = x4;
        this.y4 = y4;
    }

    @Override
    public String toString() {
        return new StringJoiner(" ")
                .add(Integer.toString(id))
                .add(filename)
                .add(Integer.toString(x))
                .add(Integer.toString(y))
                .add(Double.toString(orientation))
                .add(Integer.toString(x1))
                .add(Integer.toString(y1))
                .add(Integer.toString(x2))
                .add(Integer.toString(y2))
                .add(Integer.toString(x3))
                .add(Integer.toString(y3))
                .add(Integer.toString(x4))
                .add(Integer.toString(y4))
                .toString();
    }

}
