package model;

import java.util.StringJoiner;

public class ImageBB extends ImageData {
    // 7 D:\markers\marker_testing\T_cross\val\00007.jpg 416 312 0 5 95 42 112

    private final int id;
    private final int imageWidth, imageHeight;
    public int x2, y2;

    public ImageBB(int id, String filePath, int imageWidth, int imageHeight, int x, int y, int x2, int y2) {
        super(filePath, x, y);
        this.id = id;
        this.imageWidth = imageWidth;
        this.imageHeight = imageHeight;
        this.x2 = x2;
        this.y2 = y2;
    }

    public int getId() {
        return id;
    }

    @Override
    public String toString() {
        return new StringJoiner(" ")
                .add(Integer.toString(id))
                .add(filename)
                .add(Integer.toString(imageWidth))
                .add(Integer.toString(imageHeight))
                .add("0")
                .add(Integer.toString(x))
                .add(Integer.toString(y))
                .add(Integer.toString(x2))
                .add(Integer.toString(y2))
                .toString();
    }

}
