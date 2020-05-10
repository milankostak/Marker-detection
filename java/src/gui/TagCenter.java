package gui;

import common.FileUtils;
import javafx.application.Application;
import javafx.collections.ObservableList;
import javafx.scene.Node;
import javafx.scene.image.Image;
import javafx.scene.input.MouseEvent;
import javafx.scene.paint.Color;
import javafx.scene.shape.Rectangle;
import model.ImageDataCenter;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class TagCenter extends App {

    private final String BASE_PATH = "..\\python\\";
    private static final String FILE = "test.txt";
    private static final String RESULT_FILE = "results.txt";

    private final List<ImageDataCenter> imageData = new ArrayList<>();
    private final List<ImageDataCenter> resultData = new ArrayList<>();

    @Override
    void handleMouseClicked(MouseEvent mouseEvent) {
        final double mx = mouseEvent.getX();
        final double my = mouseEvent.getY();

        Rectangle rectangle = new Rectangle(mx - HALF_WIDTH, my - HALF_WIDTH, WIDTH_HEIGHT, WIDTH_HEIGHT);
        rectangle.setFill(Color.RED);

        ObservableList<Node> rectangles = clickRectPane.getChildren();
        rectangles.add(rectangle);
        if (rectangles.size() == 4) {
            // https://en.wikipedia.org/wiki/Centroid#Of_a_polygon
            double sumX = 0;
            double sumY = 0;
            double sumA = 0;
            for (int i = 0; i < rectangles.size(); i++) {
                Rectangle rect1 = (Rectangle) rectangles.get(i);
                Rectangle rect2 = (Rectangle) rectangles.get((i + 1) % rectangles.size());
                double v = rect1.getX() * rect2.getY() - rect2.getX() * rect1.getY();
                sumX += (rect1.getX() + rect2.getX()) * v;
                sumY += (rect1.getY() + rect2.getY()) * v;
                sumA += v;
            }
            sumA /= 2;

            double cx = sumX / (6 * sumA);
            double cy = sumY / (6 * sumA);

            rectangles.clear();
            trueRectPane.getChildren().clear();
            trueRectPane.getChildren().add(new Rectangle(cx, cy, WIDTH_HEIGHT, WIDTH_HEIGHT));

            Optional<ImageDataCenter> imageDataOptional = imageData.stream()
                    .filter(imageD -> imageD.filename.equals(images.get(imageOrder).getFileName().toString()))
                    .findFirst();

            if (imageDataOptional.isPresent()) {
                ImageDataCenter imageData = imageDataOptional.get();
                imageData.x = (int) Math.round(cx + HALF_WIDTH);
                imageData.y = (int) Math.round(cy + HALF_WIDTH);
                saveData(this.imageData, BASE_PATH + FILE);
            }
        }
    }

    @Override
    void loadData() {
        loadData2(imageData, FILE, false);
        loadData2(resultData, RESULT_FILE, true);
    }

    private void loadData2(List<ImageDataCenter> data, String filename, boolean result) {
        int length = result ? 3 : 6;

        String content = FileUtils.readFile(BASE_PATH + filename);
        if (content.isEmpty()) return;
        String[] lines = content.split(System.lineSeparator());
        for (String s : lines) {
            String[] split = s.split(",");
            if (split.length != length) continue;
            int x = (int) Math.round(Double.parseDouble(split[1]));
            int y = (int) Math.round(Double.parseDouble(split[2]));
            if (!result) {
                int h = Integer.parseInt(split[3]);
                int sat = Integer.parseInt(split[4]);
                int v = Integer.parseInt(split[5]);
                data.add(new ImageDataCenter(split[0], x, y, h, sat, v));
            } else {
                data.add(new ImageDataCenter(split[0], x, y));
            }
        }
    }

    @Override
    void loadImage() {
        clickRectPane.getChildren().clear();
        trueRectPane.getChildren().clear();

        if (imageOrder < 0) imageOrder = 0;
        else if (imageOrder >= images.size()) imageOrder = images.size() - 1;

        Image image = new Image("file:///" + images.get(imageOrder).toAbsolutePath());
        imageView.setImage(image);

        Optional<ImageDataCenter> imageDataOptional = imageData.stream()
                .filter(imageD -> imageD.filename.equals(images.get(imageOrder).getFileName().toString()))
                .findFirst();

        Optional<ImageDataCenter> imageResultDataOptional = resultData.stream()
                .filter(imageD -> imageD.filename.equals(images.get(imageOrder).getFileName().toString()))
                .findFirst();

        if (imageDataOptional.isPresent()) {
            ImageDataCenter id = imageDataOptional.get();
            trueRectPane.getChildren().add(new Rectangle(id.x - HALF_WIDTH, id.y - HALF_WIDTH, WIDTH_HEIGHT, WIDTH_HEIGHT));
        }

        if (imageResultDataOptional.isPresent()) {
            ImageDataCenter id = imageResultDataOptional.get();
            Rectangle rectangle = new Rectangle(id.x - HALF_WIDTH, id.y - HALF_WIDTH, WIDTH_HEIGHT, WIDTH_HEIGHT);
            rectangle.setFill(Color.YELLOW);
            trueRectPane.getChildren().add(rectangle);
        }

        stage.setTitle(images.get(imageOrder).getFileName().toString());
    }

    @Override
    String getBasePath() {
        return BASE_PATH;
    }

    public static void main(String[] args) {
        Application.launch(args);
    }

}
