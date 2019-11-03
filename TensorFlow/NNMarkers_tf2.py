import os
import glob
import matplotlib.pyplot as plt
from matplotlib.image import imread
import numpy as np

import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow_core.python.keras.layers.convolutional import *
from tensorflow_core.python.keras.layers.core import *
from tensorflow_core.python.keras.layers.pooling import *


##############################
# 1: load folders
##############################

train_dir = os.path.abspath("./images/train/")
train_dir_negative = os.path.abspath("./images/train/negative/")
train_dir_positive = os.path.abspath("./images/train/positive/")
val_dir = os.path.abspath("./images/validation/")
val_dir_negative = os.path.abspath("./images/validation/negative/")
val_dir_positive = os.path.abspath("./images/validation/positive/")

num_train_neg = len(os.listdir(train_dir_negative))
num_train_pos = len(os.listdir(train_dir_positive))
total_train = num_train_neg + num_train_pos

num_val_neg = len(os.listdir(val_dir_negative))
num_val_pos = len(os.listdir(val_dir_positive))
total_val = num_val_neg + num_val_pos

print(num_train_neg)
print(num_train_pos)
print(num_val_neg)
print(num_val_pos)


##############################
# 2: augment data
##############################

BATCH_SIZE = 10  # Number of training examples to process before updating our models variables
IMG_W = 300
IMG_H = 225

# The 1./255 is to convert from uint8 to float32 in range [0,1].
train_image_generator = ImageDataGenerator(
    rescale=1. / 255,
    rotation_range=90,
    shear_range=0.2,
    horizontal_flip=True,
    vertical_flip=True
)

train_data_gen = train_image_generator.flow_from_directory(batch_size=BATCH_SIZE,
                                                           directory=train_dir,
                                                           shuffle=True,
                                                           target_size=(IMG_W, IMG_H),
                                                           class_mode='binary')

validation_image_generator = ImageDataGenerator(rescale=1. / 255)
validation_data_gen = validation_image_generator.flow_from_directory(batch_size=BATCH_SIZE,
                                                                     directory=val_dir,
                                                                     shuffle=True,
                                                                     target_size=(IMG_W, IMG_H),
                                                                     class_mode='binary')


##############################
# 3: train
##############################

# model = tf.keras.models.Sequential([
#     Flatten(input_shape=(IMG_W, IMG_H, 3)),
#     Dense(128, activation=tf.nn.relu),
#     Dense(32, activation=tf.nn.relu),
#     Dense(2, activation=tf.nn.softmax)
# ])

model = tf.keras.Sequential([
    Conv2D(32, (3, 3), activation='relu', input_shape=(IMG_W, IMG_H, 3)),
    MaxPooling2D(2, 2),

    Conv2D(64, (3, 3), activation='relu'),
    MaxPooling2D(2, 2),

    # Dropout(0.5),
    Flatten(),
    Dense(64, activation='relu'),
    Dense(32, activation='relu'),
    Dense(2, activation='softmax')
])

model.compile(optimizer='adam',
              loss='sparse_categorical_crossentropy',
              metrics=['accuracy'])

model.summary()

EPOCHS = 3
history = model.fit_generator(
    train_data_gen,
    steps_per_epoch=int(np.ceil(total_train / float(BATCH_SIZE))),
    epochs=EPOCHS,
    validation_data=validation_data_gen,
    validation_steps=int(np.ceil(total_val / float(BATCH_SIZE)))
)

##############################
# 4: visualize results
##############################

acc = history.history['accuracy']
val_acc = history.history['val_accuracy']

loss = history.history['loss']
val_loss = history.history['val_loss']

epochs_range = range(EPOCHS)

plt.figure(figsize=(8, 8))
plt.subplot(1, 2, 1)
plt.plot(epochs_range, acc, label='Training Accuracy')
plt.plot(epochs_range, val_acc, label='Validation Accuracy')
plt.legend(loc='lower right')
plt.title('Training and Validation Accuracy')

plt.subplot(1, 2, 2)
plt.plot(epochs_range, loss, label='Training Loss')
plt.plot(epochs_range, val_loss, label='Validation Loss')
plt.legend(loc='upper right')
plt.title('Training and Validation Loss')
# plt.savefig('./foo.png')
plt.show()

##############################
# 5: predict test images
##############################

test_images = glob.glob(".\\images\\test\\*.jpg")
for file in test_images:
    img = imread(file)
    img = np.swapaxes(img, 0, 1)
    img = img.astype(np.float32)
    name = file[14:-4]
    if int(name) % 2 == 0:
        print("positive " + name)
    else:
        print("negative " + name)
    print(model.predict(np.array([img])))
