package model;

import java.util.StringJoiner;

public class MarkerTCross extends ImageData {

    private final int id;
    private final int imageWidth, imageHeight;
    public int bbX1, bbY1, bbX2, bbY2;
    public double orientation;
    public int x1, y1, x2, y2, x3, y3, x4, y4;

    public MarkerTCross(
            int id, String filePath, int imageWidth, int imageHeight,
            int bbX1, int bbY1, int bbX2, int bbY2,
            int centerX, int centerY, double orientation,
            int x1, int y1, int x2, int y2, int x3, int y3, int x4, int y4
    ) {
        super(filePath, centerX, centerY);
        this.id = id;
        this.imageWidth = imageWidth;
        this.imageHeight = imageHeight;
        this.bbX1 = bbX1;
        this.bbY1 = bbY1;
        this.bbX2 = bbX2;
        this.bbY2 = bbY2;
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
                .add(Integer.toString(imageWidth))
                .add(Integer.toString(imageHeight))
                .add("0")
                .add(Integer.toString(bbX1))
                .add(Integer.toString(bbY1))
                .add(Integer.toString(bbX2))
                .add(Integer.toString(bbY2))
                .add(Integer.toString(x)) // center X
                .add(Integer.toString(y)) // center Y
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
