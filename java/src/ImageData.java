public class ImageData {

    String filename;
    int x, y;

    ImageData(String filename, int x, int y) {
        this.filename = filename;
        this.x = x;
        this.y = y;
    }

    @Override
    public String toString() {
        return filename + "," + x + "," + y;
    }
}
