import java.util.StringJoiner;

public class ImageData {

    String filename;
    int x, y;
    private int h, s, v;

    ImageData(String filename, int x, int y, int h, int s, int v) {
        this.filename = filename;
        this.x = x;
        this.y = y;
        this.h = h;
        this.s = s;
        this.v = v;
    }

    ImageData(String s, int x, int y) {
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
