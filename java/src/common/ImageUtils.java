package common;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.awt.*;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Iterator;
import java.util.stream.Stream;

public final class ImageUtils {

    /**
     * Obtain width and height of the image file while not loading the whole file. It is much faster than loading the whole image.
     *
     * @param imageFile image
     * @return Dimensions of width and height; (0,0) if error occurs
     */
    public static Dimension getImageDimension(final File imageFile) {
        // https://stackoverflow.com/questions/1559253/java-imageio-getting-image-dimensions-without-reading-the-entire-file/1560052#1560052
        try (final ImageInputStream in = ImageIO.createImageInputStream(imageFile)) {
            final Iterator<ImageReader> readers = ImageIO.getImageReaders(in);
            if (readers.hasNext()) {
                final ImageReader reader = readers.next();
                try {
                    reader.setInput(in);
                    return new Dimension(reader.getWidth(0), reader.getHeight(0));
                } finally {
                    reader.dispose();
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return new Dimension(0, 0);
    }

    /**
     * Find an image in active folder by filename
     *
     * @param filename filename of an image
     * @return Path or null if error occurs
     */
    public static Path findImage(final String filename, final String path) {
        try {
            return Files.find(
                    Paths.get(path),
                    Integer.MAX_VALUE,
                    (filePath, fileAttr) -> fileAttr.isRegularFile() &&
                            isFileImage(filePath) &&
                            filePath.getFileName().toString().equalsIgnoreCase(filename)
            ).findFirst().orElse(null);
        } catch (IOException e) {
            e.printStackTrace();
        }
        return null;
    }

    /**
     * Find all images in given folder. Ignore images that have "ignore" string anywhere in their path.
     *
     * @return Stream<Path> or empty stream if error occurs
     */
    public static Stream<Path> findAllImages(final String path) {
        try {
            return Files.find(
                    Paths.get(path),
                    Integer.MAX_VALUE,
                    (filePath, fileAttr) -> fileAttr.isRegularFile() && isFileImage(filePath)
            );
        } catch (IOException e) {
            e.printStackTrace();
        }
        return Stream.empty();
    }

    /**
     * Check if given file is image or not
     *
     * @param filePath file to be checked
     * @return true if file is image, false otherwise
     */
    private static boolean isFileImage(final Path filePath) {
        try {
            final String s = Files.probeContentType(filePath);
            return s != null && s.contains("image");
        } catch (IOException e) {
            e.printStackTrace();
        }
        return false;
    }

}
