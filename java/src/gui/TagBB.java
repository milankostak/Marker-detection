package gui;

import common.FileUtils;
import common.ImageUtils;
import javafx.application.Application;
import javafx.collections.ObservableList;
import javafx.scene.Node;
import javafx.scene.image.Image;
import javafx.scene.input.MouseEvent;
import javafx.scene.paint.Color;
import javafx.scene.shape.Rectangle;
import model.ImageBB;

import java.awt.*;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.function.ToIntFunction;

public class TagBB extends App {

    private final String BASE_PATH = "D:\\images\\draw1\\resized416\\";
    private static final String FILE = "results.txt";

    private final List<ImageBB> imageData = new ArrayList<>();

    @Override
    void handleMouseClicked(MouseEvent mouseEvent) {
        final double mx = mouseEvent.getX();
        final double my = mouseEvent.getY();

        final Rectangle rectangle = new Rectangle(mx - HALF_WIDTH, my - HALF_WIDTH, WIDTH_HEIGHT, WIDTH_HEIGHT);
        rectangle.setFill(Color.RED);

        final ObservableList<Node> rectangles = clickRectPane.getChildren();
        rectangles.add(rectangle);
        if (rectangles.size() == 4) {
            final ToIntFunction<Node> getX = r -> (int) Math.round(((Rectangle) r).getX() + HALF_WIDTH);
            final ToIntFunction<Node> getY = r -> (int) Math.round(((Rectangle) r).getY() + HALF_WIDTH);
            int x = rectangles.stream().mapToInt(getX).min().orElse(0);
            int y = rectangles.stream().mapToInt(getY).min().orElse(0);
            int x2 = rectangles.stream().mapToInt(getX).max().orElse(0);
            int y2 = rectangles.stream().mapToInt(getY).max().orElse(0);

            rectangles.clear();
            trueRectPane.getChildren().clear();
            trueRectPane.getChildren().add(createRectangle(x, y, x2 - x, y2 - y));

            Optional<ImageBB> imageDataOptional = imageData.stream()
                    .filter(imageD -> imageD.filename.equals(images.get(imageOrder).getFileName().toString()))
                    .findFirst();

            if (imageDataOptional.isPresent()) {
                final ImageBB imageBB = imageDataOptional.get();
                imageBB.x = x;
                imageBB.y = y;
                imageBB.x2 = x2;
                imageBB.y2 = y2;
            } else {
                final Path path = images.get(imageOrder).toAbsolutePath();
                int id = Integer.parseInt(FileUtils.getFilenameWithoutExtension(path.getFileName().toString()));
                final Dimension imageDimension = ImageUtils.getImageDimension(path.toFile());
                final ImageBB imageBB = new ImageBB(id, path.toString(), imageDimension.width, imageDimension.height, x, y, x2, y2);
                imageData.add(imageBB);
            }
            saveData(imageData, BASE_PATH + FILE);
        }
    }

    private Rectangle createRectangle(int x, int y, int w, int h) {
        final Rectangle rectangle = new Rectangle(x, y, w, h);
        rectangle.setFill(Color.TRANSPARENT);
        rectangle.setStroke(Color.BLACK);
        rectangle.setStrokeWidth(2);
        return rectangle;
    }

    @Override
    void loadData() {
        final String content = FileUtils.readFile(BASE_PATH + FILE);
        if (content.isEmpty()) return;
        final String[] lines = content.split(System.lineSeparator());
        for (String s : lines) {
            final String[] split = s.split(" ");
            if (split.length != 9) continue;
            int id = Integer.parseInt(split[0]);
            final String imagePath = split[1];
            int w = Integer.parseInt(split[2]);
            int h = Integer.parseInt(split[3]);
            int x = Integer.parseInt(split[5]);
            int y = Integer.parseInt(split[6]);
            int x2 = Integer.parseInt(split[7]);
            int y2 = Integer.parseInt(split[8]);
            imageData.add(new ImageBB(id, imagePath, w, h, x, y, x2, y2));
        }
    }

    @Override
    void loadImage() {
        clickRectPane.getChildren().clear();
        trueRectPane.getChildren().clear();

        if (imageOrder < 0) imageOrder = 0;
        else if (imageOrder >= images.size()) imageOrder = images.size() - 1;

        final Image image = new Image("file:///" + images.get(imageOrder).toAbsolutePath());
        imageView.setImage(image);

        final Optional<ImageBB> imageDataOptional = imageData
                .stream()
                .filter(imageD -> imageD.filename.equals(images.get(imageOrder).toString()))
                .findFirst();

        if (imageDataOptional.isPresent()) {
            final ImageBB bb = imageDataOptional.get();
            trueRectPane.getChildren().add(createRectangle(bb.x, bb.y, bb.x2 - bb.x, bb.y2 - bb.y));
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
