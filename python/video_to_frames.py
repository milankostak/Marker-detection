import cv2
import glob
import os

path = "D:/images/draw3/videos/"
videos = glob.glob(f"{path}*.mp4")
name = 0
test_txt = ""

for video in videos:
    video_name = os.path.basename(video).split('.', 1)[0]
    capture = cv2.VideoCapture(video)
    success, image = capture.read()
    count = 0
    frames_count = capture.get(cv2.CAP_PROP_FRAME_COUNT)
    while success:
        filename = f"%04d-{video_name}.jpg" % name
        name += 1
        cv2.imwrite(f"{path}../original/" + filename, image)

        row = ','.join(str(e) for e in [filename, -1, -1])
        test_txt += row + "\n"

        success, image = capture.read()
        print("Read a new frame:", success)

        count += 20  # 60 FPS -> keep 3 frames per second
        capture.set(cv2.CAP_PROP_POS_FRAMES, count)
        if frames_count < count:
            success = False
    capture.release()

with open(f"{path}data.txt", "w") as file:
    file.write(test_txt)
