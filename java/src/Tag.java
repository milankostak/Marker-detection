import javafx.application.Application;
import javafx.collections.ObservableList;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.Scene;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.input.KeyCode;
import javafx.scene.input.KeyEvent;
import javafx.scene.input.MouseEvent;
import javafx.scene.layout.Pane;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import javafx.scene.shape.Rectangle;
import javafx.stage.Stage;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

public class Tag extends Application {

    private static final String BASE_PATH = "..\\python\\";
    private static final String FILE = "test.txt";
    private static final String RESULT_FILE = "results.txt";
    private static final int WIDTH_HEIGHT = 6;
    private static final int HALF_WIDTH = 3;

    private Stage stage;
    private Pane clickRectPane;
    private ImageView imageView;
    private Pane trueRectPane;

    private final List<ImageData> imageData = new ArrayList<>();
    private final List<ImageData> resultData = new ArrayList<>();
    private List<Path> images;
    private int imageOrder = 0;

    @Override
    public void start(Stage primaryStage) {
        stage = primaryStage;
        images = ImageUtils
                .findAllImages(BASE_PATH)
                .sorted(Comparator.comparingInt(o -> Integer.parseInt(FileUtils.getFilenameWithoutExtension(o.getFileName().toString()))))
                .collect(Collectors.toList());

        VBox mainBox = new VBox(8);
        mainBox.setAlignment(Pos.BASELINE_CENTER);
        imageView = new ImageView();

        Pane pane = new Pane();
        clickRectPane = new Pane();
        trueRectPane = new Pane();
        pane.getChildren().addAll(imageView, clickRectPane, trueRectPane);

        mainBox.getChildren().add(pane);
        loadData();
        loadImage();

        Scene scene = new Scene(mainBox);
        scene.setOnKeyPressed(this::handleSceneKeyPressed);
        scene.setOnMouseClicked(this::handleMouseClicked);

        primaryStage.setScene(scene);
        primaryStage.setMaximized(true);
        primaryStage.show();
    }

    private void handleSceneKeyPressed(KeyEvent keyEvent) {
        switch (keyEvent.getCode()) {
            case LEFT:
            case RIGHT:
                if (keyEvent.getCode() == KeyCode.LEFT) imageOrder--;
                else imageOrder++;
                loadImage();
                break;
            case C:
                clickRectPane.getChildren().clear();
                break;
        }
    }

    private void handleMouseClicked(MouseEvent mouseEvent) {
        double x = mouseEvent.getX();
        double y = mouseEvent.getY();
        Rectangle rectangle = new Rectangle(x - HALF_WIDTH, y - HALF_WIDTH, WIDTH_HEIGHT, WIDTH_HEIGHT);
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

            Optional<ImageData> imageDataOptional = imageData.stream()
                    .filter(imageD -> imageD.filename.equals(images.get(imageOrder).getFileName().toString()))
                    .findFirst();

            if (imageDataOptional.isPresent()) {
                ImageData imageData = imageDataOptional.get();
                imageData.x = (int) Math.round(cx + HALF_WIDTH);
                imageData.y = (int) Math.round(cy + HALF_WIDTH);
                saveData();
            }
        }
    }

    private void loadData() {
        loadData2(imageData, FILE);
        loadData2(resultData, RESULT_FILE);
    }

    private void loadData2(List<ImageData> data, String filename) {
        String content = FileUtils.readFile(BASE_PATH + filename);
        if (content.isEmpty()) return;
        String[] lines = content.split(System.lineSeparator());
        for (String s : lines) {
            String[] split = s.split(",");
            if (split.length != 3) continue;
            int x = (int) Math.round(Double.parseDouble(split[1]));
            int y = (int) Math.round(Double.parseDouble(split[2]));
            data.add(new ImageData(split[0], x, y));
        }
    }

    private void saveData() {
        StringBuilder sb = new StringBuilder();
        for (ImageData image : imageData) {
            sb.append(image.toString()).append(System.lineSeparator());
        }
        FileUtils.writeFile(BASE_PATH + FILE, sb.toString());
    }

    private void loadImage() {
        clickRectPane.getChildren().clear();
        trueRectPane.getChildren().clear();

        if (imageOrder < 0) imageOrder = 0;
        else if (imageOrder >= images.size()) imageOrder = images.size() - 1;

        Image image = new Image("file:///" + images.get(imageOrder).toAbsolutePath());
        imageView.setImage(image);

        Optional<ImageData> imageDataOptional = imageData.stream()
                .filter(imageD -> imageD.filename.equals(images.get(imageOrder).getFileName().toString()))
                .findFirst();

        Optional<ImageData> imageResultDataOptional = resultData.stream()
                .filter(imageD -> imageD.filename.equals(images.get(imageOrder).getFileName().toString()))
                .findFirst();

        if (imageDataOptional.isPresent()) {
            ImageData id = imageDataOptional.get();
            trueRectPane.getChildren().add(new Rectangle(id.x - HALF_WIDTH, id.y - HALF_WIDTH, WIDTH_HEIGHT, WIDTH_HEIGHT));
        }

        if (imageResultDataOptional.isPresent()) {
            ImageData id = imageResultDataOptional.get();
            Rectangle rectangle = new Rectangle(id.x - HALF_WIDTH, id.y - HALF_WIDTH, WIDTH_HEIGHT, WIDTH_HEIGHT);
            rectangle.setFill(Color.YELLOW);
            trueRectPane.getChildren().add(rectangle);
        }

        stage.setTitle(images.get(imageOrder).getFileName().toString());
    }

    public static void main(String[] args) {
        Application.launch(args);
    }

}
