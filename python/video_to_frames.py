import cv2

capture = cv2.VideoCapture('input.mp4')
success, image = capture.read()
count = 0
name = 0
test_txt = ""
frames_count = capture.get(cv2.CAP_PROP_FRAME_COUNT)
while success:
    filename = "%03d.jpg" % name
    name += 1
    cv2.imwrite(filename, image)  # save frame as JPEG file

    row = ','.join(str(e) for e in [filename, -1, -1])
    test_txt += row + "\n"

    success, image = capture.read()
    print('Read a new frame: ', success)

    count += 10
    capture.set(cv2.CAP_PROP_POS_FRAMES, count)
    if frames_count < count:
        success = False

with open("test.txt", "w") as file:
    file.write(test_txt)
