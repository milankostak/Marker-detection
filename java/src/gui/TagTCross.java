package gui;

import common.FileUtils;
import common.ImageUtils;
import javafx.application.Application;
import javafx.collections.ObservableList;
import javafx.scene.Node;
import javafx.scene.input.MouseEvent;
import javafx.scene.paint.Color;
import javafx.scene.shape.Line;
import javafx.scene.shape.Rectangle;
import javafx.scene.text.Text;
import model.MarkerTCross;

import java.awt.*;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.function.ToIntFunction;

public class TagTCross extends App {

    private final String BASE_PATH = "D:\\images\\draw3\\original\\";
    private static final String MARKER_FILE = "marker_data.txt";

    private final List<MarkerTCross> markerData = new ArrayList<>();

    @Override
    void handleMouseClicked(MouseEvent mouseEvent) {
        final double mx = mouseEvent.getX();
        final double my = mouseEvent.getY();

        final Rectangle rectangle = createDefaultRectangle(mx, my);
        rectangle.setFill(Color.RED);

        final ObservableList<Node> rectangles = clickRectPane.getChildren();
        rectangles.add(rectangle);

        if (rectangles.size() == 5) {
            for (Node node : rectangles) {
                Rectangle rectangle1 = (Rectangle) node;
                rectangle1.setX((rectangle1.getX() * currentRatio) + HALF_WIDTH);
                rectangle1.setY((rectangle1.getY() * currentRatio) + HALF_WIDTH);
            }
            double x1 = ((Rectangle) rectangles.get(4)).getX(); // the center
            double y1 = ((Rectangle) rectangles.get(4)).getY(); // the center
            final int centerX = (int) Math.round(x1);
            final int centerY = (int) Math.round(y1);
            double x2 = ((Rectangle) rectangles.get(0)).getX(); // the other point
            double y2 = ((Rectangle) rectangles.get(0)).getY(); // the other point

//            orientation_vector = (ox_2 - ox_1, oy_2 - oy_1)
//            # use orientation_vector and vector (1,0) to get the angle of the line relative to X-axis (to the vector (1,0))
//            # since the other vector is (1,0), the formula is used in its simplified form
//            cos_angle = orientation_vector[0] / math.sqrt(
//                    orientation_vector[0] * orientation_vector[0] + orientation_vector[1] * orientation_vector[1]
//            )
//            # get the final angle of the orientation
//            angle = math.degrees(math.acos(cos_angle))
//            # the resolution is only <0;180>, so fix those lines which Y > 0
//            # then we get resolution of <0;360>
//            if orientation_vector[1] > 0:
//            angle = 360 - angle
//            print("orientation:", str(round(angle)) + "°")

            double dx = x2 - x1;
            double dy = y2 - y1;

            double cosAngle = dx / Math.sqrt(dx * dx + dy * dy);
            double angle = Math.toDegrees(Math.acos(cosAngle));
            if (dy > 0) angle = 360 - angle;

            Rectangle p1 = ((Rectangle) rectangles.get(0));
            Rectangle p2 = ((Rectangle) rectangles.get(1));
            Rectangle p3 = ((Rectangle) rectangles.get(2));
            Rectangle p4 = ((Rectangle) rectangles.get(3));

            final ToIntFunction<Node> getX = r -> (int) Math.round(((Rectangle) r).getX());
            final ToIntFunction<Node> getY = r -> (int) Math.round(((Rectangle) r).getY());
            int bbX1 = rectangles.stream().mapToInt(getX).min().orElse(0);
            int bbY1 = rectangles.stream().mapToInt(getY).min().orElse(0);
            int bbX2 = rectangles.stream().mapToInt(getX).max().orElse(0);
            int bbY2 = rectangles.stream().mapToInt(getY).max().orElse(0);

            Optional<MarkerTCross> markerDataOptional = markerData
                    .stream()
                    .filter(centerD -> centerD.filename.equals(images.get(imageOrder).toAbsolutePath().toString()))
                    .findFirst();

            if (markerDataOptional.isPresent()) {
                final MarkerTCross marker = markerDataOptional.get();
                marker.bbX1 = bbX1;
                marker.bbY1 = bbY1;
                marker.bbX2 = bbX2;
                marker.bbY2 = bbY2;
                marker.x = centerX;
                marker.y = centerY;
                marker.orientation = angle;
                marker.x1 = (int) Math.round(p1.getX());
                marker.y1 = (int) Math.round(p1.getY());
                marker.x2 = (int) Math.round(p2.getX());
                marker.y2 = (int) Math.round(p2.getY());
                marker.x3 = (int) Math.round(p3.getX());
                marker.y3 = (int) Math.round(p3.getY());
                marker.x4 = (int) Math.round(p4.getX());
                marker.y4 = (int) Math.round(p4.getY());
            } else {
                final Path path = images.get(imageOrder).toAbsolutePath();
                final Dimension imageDimension = ImageUtils.getImageDimension(path.toFile());
                final MarkerTCross markerCenter = new MarkerTCross(
                        imageOrder, path.toString(),imageDimension.width, imageDimension.height,
                        bbX1, bbY1, bbX2, bbY2,
                        centerX, centerY, angle,
                        (int) Math.round(p1.getX()), (int) Math.round(p1.getY()),
                        (int) Math.round(p2.getX()), (int) Math.round(p2.getY()),
                        (int) Math.round(p3.getX()), (int) Math.round(p3.getY()),
                        (int) Math.round(p4.getX()), (int) Math.round(p4.getY())
                );
                markerData.add(markerCenter);
            }
            saveData(markerData, BASE_PATH + MARKER_FILE);

            clickRectPane.getChildren().clear();
            trueRectPane.getChildren().clear();
            loadImage();
        }
    }

    @Override
    void loadData() {
        final String content = FileUtils.readFile(BASE_PATH + MARKER_FILE);
        if (content.isEmpty()) return;
        final String[] lines = content.split(System.lineSeparator());
        for (String s : lines) {
            final String[] split = s.split(" ");
            if (split.length != 20) continue;
            int id = Integer.parseInt(split[0]);
            final String imagePath = split[1];
            int w = Integer.parseInt(split[2]);
            int h = Integer.parseInt(split[3]);
//            int clazz = Integer.parseInt(split[4]); // always 0
            int bbX1 = Integer.parseInt(split[5]);
            int bbY1 = Integer.parseInt(split[6]);
            int bbX2 = Integer.parseInt(split[7]);
            int bbY2 = Integer.parseInt(split[8]);
            int centerX = Integer.parseInt(split[9]);
            int centerY = Integer.parseInt(split[10]);
            double orientation = Double.parseDouble(split[11]);
            int p1X = Integer.parseInt(split[12]);
            int p1Y = Integer.parseInt(split[13]);
            int p2X = Integer.parseInt(split[14]);
            int p2Y = Integer.parseInt(split[15]);
            int p3X = Integer.parseInt(split[16]);
            int p3Y = Integer.parseInt(split[17]);
            int p4X = Integer.parseInt(split[18]);
            int p4Y = Integer.parseInt(split[19]);
            markerData.add(new MarkerTCross(
                    id, imagePath, w, h,
                    bbX1, bbY1, bbX2, bbY2,
                    centerX, centerY, orientation,
                    p1X, p1Y, p2X, p2Y, p3X, p3Y, p4X, p4Y
            ));
        }
    }

    @Override
    void loadImage() {
        if (markerData.size() > imageOrder) {
            final MarkerTCross bb = markerData.get(imageOrder);
            trueRectPane.getChildren().add(createDefaultRectangle(bb.x / currentRatio, bb.y / currentRatio));
            trueRectPane.getChildren().add(createDefaultRectangle(bb.x1 / currentRatio, bb.y1 / currentRatio));
            trueRectPane.getChildren().add(createDefaultRectangle(bb.x2 / currentRatio, bb.y2 / currentRatio));
            trueRectPane.getChildren().add(createDefaultRectangle(bb.x3 / currentRatio, bb.y3 / currentRatio));
            trueRectPane.getChildren().add(createDefaultRectangle(bb.x4 / currentRatio, bb.y4 / currentRatio));

            Line line = new Line(
                    bb.x / currentRatio, bb.y / currentRatio,
                    bb.x1 / currentRatio, bb.y1 / currentRatio
            );
            line.setStroke(Color.GREEN);
            line.setStrokeWidth(2);
            trueRectPane.getChildren().add(line);

            Text text = new Text(10, 30, Double.toString(bb.orientation));
            text.setStyle("-fx-font: 30 arial;");
            trueRectPane.getChildren().add(text);
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
