package common;

import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;

public final class FileUtils {

    /**
     * Write content into a file. Forces UTF-8. File is rewritten if it exists.
     *
     * @param filename filename
     * @param content  string content to be written into a file.
     */
    public static void writeFile(String filename, String content) {
        try {
            OutputStreamWriter out = new OutputStreamWriter(new FileOutputStream(filename), StandardCharsets.UTF_8);
            out.write(content);
            out.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    /**
     * Read text file, force reading in UTF-8.
     *
     * @param filename filename
     * @return content of the text file, empty string if error occurs
     */
    public static String readFile(String filename) {
        try {
            return new String(Files.readAllBytes(Paths.get(filename)), StandardCharsets.UTF_8);
        } catch (IOException e) {
            e.printStackTrace();
        }
        return "";
    }

    public static String getFilenameWithoutExtension(String filename) {
        return filename.replaceFirst("[.][^.]+$", "");
    }

}
