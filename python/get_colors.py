import cv2
import numpy as np
from matplotlib import pyplot as plt
from pylab import rcParams


with open(f"D:/Python/PycharmProjects/Marker-detection/python/test-bb.txt") as file:
    lines = [line.rstrip() for line in file]

count = len(lines)
for i in range(count):
    # i = 300  # ukázkový korektní příklad
    # i = 13  # ukázkový příklad špatného histogramu - tmavý marker
    # i = 433  # ukázkový příklad špatného histogramu - světlý marker
    data = lines[i].split(" ")
    image_id = data[0]
    image_path = data[1]
    x1 = int(data[2])
    y1 = int(data[3])
    x2 = int(data[4])
    y2 = int(data[5])
    x3 = int(data[6])
    y3 = int(data[7])
    x4 = int(data[8])
    y4 = int(data[9])
    # print(image_id, image_path, x1, y1, x2, y2, x3, y3, x4, y4)

    img = cv2.imread(image_path)
    x_min = min(x1, x2, x3, x4)
    x_max = max(x1, x2, x3, x4)
    y_min = min(y1, y2, y3, y4)
    y_max = max(y1, y2, y3, y4)
    img = img[y_min:y_max, x_min:x_max]
    # cv2.imshow("cropped", img)
    cv2.imwrite("cropped.png", img)

    x1 = x1 - x_min
    y1 = y1 - y_min
    x2 = x2 - x_min
    y2 = y2 - y_min
    x3 = x3 - x_min
    y3 = y3 - y_min
    x4 = x4 - x_min
    y4 = y4 - y_min
    p = [[x1, y1], [x2, y2], [x3, y3], [x4, y4]]
    # print(p)

    mask = np.zeros(shape=img.shape[:2], dtype=np.uint8)

    index = np.argmin(p, axis=0)[0]
    left_most_1 = p[index]
    p = np.delete(p, index, axis=0)
    index = np.argmin(p, axis=0)[0]
    left_most_2 = p[index]
    p = np.delete(p, index, axis=0)

    if left_most_1[1] < left_most_2[1]:
        p1 = left_most_2
        p2 = left_most_1
    else:
        p1 = left_most_1
        p2 = left_most_2

    index = np.argmax(p, axis=0)[0]
    right_most_1 = p[index]
    p = np.delete(p, index, axis=0)
    right_most_2 = p[0]

    if right_most_1[1] < right_most_2[1]:
        p3 = right_most_1
        p4 = right_most_2
    else:
        p3 = right_most_2
        p4 = right_most_1

    points = np.array([p1, p2, p3, p4])
    cv2.fillPoly(img=mask, pts=[points], color=255)
    # cv2.imshow("Histogram mask", mask)
    # cv2.imwrite("histogram_mask.png", mask)

    blur_dst = cv2.GaussianBlur(src=img, ksize=(11, 11), sigmaX=0)
    # cv2.imshow("Blur", blur_dst)
    # cv2.imwrite("blur.png", blur_dst)
    masked = cv2.bitwise_and(blur_dst, blur_dst, mask=mask)
    # cv2.imshow("masked", masked)
    # cv2.imwrite("masked.png", masked)

    # HSV
    hsv = cv2.cvtColor(blur_dst, cv2.COLOR_BGR2HSV)
    hist = cv2.calcHist(images=[hsv], channels=[0], mask=mask, histSize=[360], ranges=[0, 180])
    target_hue = np.argmax(hist)
    # print("Final hue:", target_hue)
    print(image_path, target_hue)

    # RGB
    # red = cv2.calcHist(images=[blur_dst], channels=[0], mask=mask, histSize=[256], ranges=[0, 128])
    # target_red = np.argmax(red)
    # green = cv2.calcHist(images=[blur_dst], channels=[1], mask=mask, histSize=[256], ranges=[0, 128])
    # target_green = np.argmax(green)
    # blue = cv2.calcHist(images=[blur_dst], channels=[2], mask=mask, histSize=[256], ranges=[0, 128])
    # target_blue = np.argmax(blue)
    # print(image_path, target_red, target_green, target_blue)

    rcParams["figure.figsize"] = 8, 5
    # rcParams["font.size"] = 20
    rcParams["axes.titlepad"] = 15
    rcParams["axes.labelpad"] = 10
    rcParams["axes.xmargin"] = 0
    # rcParams["axes.ymargin"] = 0

    fig, ax = plt.subplots()
    plt.rcParams.update({"font.size": 13})
    plt.title(f"Histogram odstínů (hue)")

    plt.xlabel("hodnota odstínu (hue)", fontsize=13)
    plt.ylabel("počet pixelů", fontsize=13)
    ax.axvline(x=target_hue, color="red", linestyle="dashed", label="odstín s nejvyšším zastoupením")
    ax.bar(x=np.arange(len(hist)), height=hist.flatten(), width=2)
    # plt.tight_layout(pad=1.2)
    ax.grid(axis="y")
    ax.legend(loc="upper left", prop={"size": 11}, fancybox=False, shadow=False)

    ax.tick_params(axis="x", labelsize=12)
    ax.tick_params(axis="y", labelsize=12)
    plt.savefig("histogram.svg", format="svg")
    plt.show()

    # cv2.waitKey()
    break
