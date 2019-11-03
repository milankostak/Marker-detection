import cv2
import os
import glob
import random
import shutil

files2015 = glob.glob("..../*.jpg")
files2016 = glob.glob("..../*.jpg")
files2017 = glob.glob("..../*.jpg")
files2018 = glob.glob("..../*.jpg")
files2019 = glob.glob("..../*.jpg")

files = files2015 + files2016 + files2017 + files2018 + files2019
print(files.__len__())

counter = 0
for file in files:
    name = f'{counter:04d}'

    newFile = "..../images/"
    if counter % 10 < 7:  # <0;6>
        newFile = newFile + "train/" + name + ".jpg"
    elif counter % 10 < 9:
        newFile = newFile + "val/" + name + ".jpg"
    else:
        newFile = newFile + "test/" + name + ".jpg"

    shutil.copy(file, newFile)
    source = cv2.imread(newFile)

    imgH, imgW, channels = source.shape

    width = random.randint(5, 60)
    height = random.randint(6, 50)
    x = random.randint(1, imgW - width - 1)
    y = random.randint(1, imgH - height - 1)
    color = (0, 200, 0)

    cv2.rectangle(source, (x, y), (x + width, y + height), color, -1)
    print(counter, os.path.abspath(newFile), imgW, imgH, 0, x, y, x + width, y + height)
    cv2.imwrite(newFile, source)
    counter += 1
