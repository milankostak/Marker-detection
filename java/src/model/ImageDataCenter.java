package model;

import java.util.StringJoiner;

public class ImageDataCenter extends ImageData {

    private final int h, s, v;

    public ImageDataCenter(String filename, int x, int y, int h, int s, int v) {
        super(filename, x, y);
        this.h = h;
        this.s = s;
        this.v = v;
    }

    public ImageDataCenter(String s, int x, int y) {
        this(s, x, y, -1, -1, -1);
    }

    @Override
    public String toString() {
        return new StringJoiner(",")
                .add(filename)
                .add(Integer.toString(x))
                .add(Integer.toString(y))
                .add(Integer.toString(h))
                .add(Integer.toString(s))
                .add(Integer.toString(v))
                .toString();
    }

}
