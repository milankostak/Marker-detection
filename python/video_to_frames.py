import cv2

capture = cv2.VideoCapture('input.mp4')
success, image = capture.read()
count = 0
name = 0
frames_count = capture.get(cv2.CAP_PROP_FRAME_COUNT)
while success:
    cv2.imwrite("%03d.jpg" % name, image)  # save frame as JPEG file
    name += 1
    success, image = capture.read()
    print('Read a new frame: ', success)
    count += 10
    capture.set(cv2.CAP_PROP_POS_FRAMES, count)
    if frames_count < count:
        success = False
