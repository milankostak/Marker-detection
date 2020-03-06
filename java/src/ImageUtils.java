import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.stream.Stream;

class ImageUtils {

    /**
     * Find an image in active folder by filename
     *
     * @param filename filename of an image
     * @return Path or null if error occurs
     */
    static Path findImage(String filename, String path) {
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
    static Stream<Path> findAllImages(String path) {
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
    private static boolean isFileImage(Path filePath) {
        try {
            final String s = Files.probeContentType(filePath);
            return s != null && s.contains("image");
        } catch (IOException e) {
            e.printStackTrace();
        }
        return false;
    }


}
