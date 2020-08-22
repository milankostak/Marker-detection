package model;

public abstract class ImageData {

    public final String filename;
    public int x, y;

    ImageData(String filename, int x, int y) {
        this.filename = filename;
        this.x = x;
        this.y = y;
    }

    public abstract String toString();

}
