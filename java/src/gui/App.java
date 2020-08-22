package gui;

import common.FileUtils;
import common.ImageUtils;
import javafx.application.Application;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.image.ImageView;
import javafx.scene.input.KeyCode;
import javafx.scene.input.KeyEvent;
import javafx.scene.input.MouseEvent;
import javafx.scene.layout.Pane;
import javafx.scene.layout.VBox;
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
    ImageView imageView;
    Pane trueRectPane;
    Pane clickRectPane;

    int imageOrder = 0;

    List<Path> images;

    @Override
    public void start(Stage primaryStage) {
        stage = primaryStage;
        images = ImageUtils
                .findAllImages(getBasePath())
                .sorted(Comparator.comparingInt(o -> Integer.parseInt(FileUtils.getFilenameWithoutExtension(o.getFileName().toString()))))
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
        loadImage();

        final Scene scene = new Scene(mainBox);
        scene.setOnKeyPressed(this::handleSceneKeyPressed);
        scene.setOnMouseClicked(this::handleMouseClicked);

        primaryStage.setScene(scene);
        primaryStage.setMaximized(true);
        primaryStage.show();
    }

    private void handleSceneKeyPressed(final KeyEvent keyEvent) {
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

    abstract void handleMouseClicked(MouseEvent mouseEvent);

    final void saveData(final List<? extends ImageData> imageData, final String file) {
        final StringBuilder sb = new StringBuilder();
        for (final ImageData image : imageData) {
            sb.append(image.toString()).append(System.lineSeparator());
        }
        FileUtils.writeFile(file, sb.toString());
    }

    abstract void loadData();

    abstract void loadImage();

    abstract String getBasePath();
}
