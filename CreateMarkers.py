import cv2
import os
import glob
import random

files = glob.glob(".\\images\\*.jpg")
for file in files:
    name = file[9:-4]
    if int(name) % 2 == 0:
        newFile = ".\\images\\train\\positive\\" + name + ".jpg"
        os.rename(file, newFile)
        source = cv2.imread(newFile)

        width = random.randint(5, 60)
        height = random.randint(6, 50)
        x = random.randint(1, 299 - width)
        y = random.randint(1, 224 - height)
        color = (0, 200, 0)

        cv2.rectangle(source, (x, y), (x + width, y + height), color, -1)
        # print(file, x, y, width, height)
        cv2.imwrite(newFile, source)
    else:
        newFile = ".\\images\\train\\negative\\" + name + ".jpg"
        os.rename(file, newFile)
