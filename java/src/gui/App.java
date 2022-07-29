package gui;

import common.FileUtils;
import common.ImageUtils;
import javafx.application.Application;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.input.KeyCode;
import javafx.scene.input.KeyEvent;
import javafx.scene.input.MouseEvent;
import javafx.scene.layout.Pane;
import javafx.scene.layout.VBox;
import javafx.scene.shape.Rectangle;
import javafx.stage.Stage;
import model.ImageData;

import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public abstract class App extends Application {

    static final int WIDTH_HEIGHT = 6;
    static final int HALF_WIDTH = 3;

    Stage stage;
    private ImageView imageView;
    Pane trueRectPane;
    Pane clickRectPane;

    int imageOrder = 0;

    List<Path> images;

    double currentRatio = 1;
    private double maxImageWidth, maxImageHeight;
    private Image currentImage;

    @Override
    public void start(Stage primaryStage) {
        stage = primaryStage;
        images = ImageUtils
                .findAllImages(getBasePath())
                .sorted(Comparator.comparingInt(o ->
                        Integer.parseInt(FileUtils.getFilenameWithoutExtension(o.getFileName().toString()).substring(0, 4))
                ))
                .collect(Collectors.toList());

        final VBox mainBox = new VBox(8);
        mainBox.setAlignment(Pos.BASELINE_CENTER);
        imageView = new ImageView();

        final Pane pane = new Pane();
        clickRectPane = new Pane();
        trueRectPane = new Pane();
        pane.getChildren().addAll(imageView, clickRectPane, trueRectPane);

        mainBox.getChildren().add(pane);
        loadData();
        loadImagePrivate();

        final Scene scene = new Scene(mainBox);
        scene.setOnKeyPressed(this::handleSceneKeyPressed);
        scene.setOnMouseClicked(this::handleMouseClicked);
        scene.heightProperty().addListener((observable, oldValue, newValue) -> heightChanged(newValue));
        scene.widthProperty().addListener((observable, oldValue, newValue) -> widthChanged(newValue));

        primaryStage.setScene(scene);
        primaryStage.setMaximized(true);
        primaryStage.show();
    }

    private void handleSceneKeyPressed(final KeyEvent keyEvent) {
        switch (keyEvent.getCode()) {
            case LEFT:
            case RIGHT:
                int speed = 1;
                if (keyEvent.isControlDown()) speed = 10;
                if (keyEvent.getCode() == KeyCode.LEFT) imageOrder -= speed;
                else imageOrder += speed;
                loadImagePrivate();
                break;
            case HOME:
                imageOrder = 0;
                loadImagePrivate();
                break;
            case END:
                imageOrder = images.size() - 1;
                loadImagePrivate();
                break;
            case C:
                clickRectPane.getChildren().clear();
                break;
        }
    }

    abstract void handleMouseClicked(MouseEvent mouseEvent);

    final void saveData(final List<? extends ImageData> imageData, final String file) {
        final StringBuilder sb = new StringBuilder();
        for (final ImageData image : imageData) {
            sb.append(image.toString()).append(System.lineSeparator());
        }
        FileUtils.writeFile(file, sb.toString());
    }

    final Rectangle createDefaultRectangle(double x, double y) {
        return new Rectangle(x - HALF_WIDTH, y - HALF_WIDTH, WIDTH_HEIGHT, WIDTH_HEIGHT);
    }

    abstract void loadData();

    abstract void loadImage();

    private void loadImagePrivate() {
        clickRectPane.getChildren().clear();
        trueRectPane.getChildren().clear();

        if (imageOrder < 0) imageOrder = 0;
        else if (imageOrder >= images.size()) imageOrder = images.size() - 1;

        final Image image = new Image("file:///" + images.get(imageOrder).toAbsolutePath());
        imageView.setImage(image);
        currentImage = image;

        loadImage();
    }

    private void heightChanged(Number newValue) {
        maxImageHeight = newValue.doubleValue();
        updateImageSize();
        updateBoundingBoxesRatio();
    }

    private void widthChanged(Number newValue) {
        maxImageWidth = newValue.doubleValue();
        updateImageSize();
        updateBoundingBoxesRatio();
    }

    private void updateImageSize() {
        // if image doesn't fit into the window
        if (currentImage.getWidth() > maxImageWidth || currentImage.getHeight() > maxImageHeight) {
            double widthRatio = currentImage.getWidth() / maxImageWidth;
            double heightRatio = currentImage.getHeight() / maxImageHeight;

            double currentRatio;
            // at least one ratio is bigger than 1
            //noinspection ManualMinMaxCalculation
            if (widthRatio > heightRatio) {
                // width has to be stretched more
                currentRatio = widthRatio;
            } else {
                // height has to be stretched more
                currentRatio = heightRatio;
            }
            imageView.setFitWidth(currentImage.getWidth() / currentRatio);
            imageView.setFitHeight(currentImage.getHeight() / currentRatio);
            this.currentRatio = currentRatio;
        } else {
            imageView.setFitWidth(currentImage.getWidth());
            imageView.setFitHeight(currentImage.getHeight());
            this.currentRatio = 1;
        }
    }

    private void updateBoundingBoxesRatio() {
        clickRectPane.getChildren().clear();
        trueRectPane.getChildren().clear();
        loadImage();
    }

    abstract String getBasePath();
}
