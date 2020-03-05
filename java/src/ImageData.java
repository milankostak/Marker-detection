public class ImageData {

    public String filename;
    public int x, y;

    public ImageData(String filename) {
        this(filename, -1, -1);
    }

    public ImageData(String filename, int x, int y) {
        this.filename = filename;
        this.x = x;
        this.y = y;
    }

    @Override
    public String toString() {
        return filename + "," + x + "," + y;
    }
}
