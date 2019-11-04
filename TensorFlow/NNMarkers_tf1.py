import os
import matplotlib.pyplot as plt
import numpy as np

import tensorflow as tf
from tensorflow.python.keras.preprocessing.image import ImageDataGenerator
from tensorflow.python.keras.layers import *

train_dir = os.path.abspath("./images1/train/")
train_dir_negative = os.path.abspath("./images1/train/negative/")
train_dir_positive = os.path.abspath("./images1/train/positive/")
val_dir = os.path.abspath("./images1/validation/")
val_dir_negative = os.path.abspath("./images1/validation/negative/")
val_dir_positive = os.path.abspath("./images1/validation/positive/")

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
# 2. augment data
##############################

# This function will plot images in the form of a grid with 1 row and 5 columns where images are placed in each column.
def plot_images(images_arr):
    fig, axes = plt.subplots(1, 5, figsize=(20, 20))
    axes = axes.flatten()
    for img, ax in zip(images_arr, axes):
        ax.imshow(img)
    plt.tight_layout()
    plt.show()


BATCH_SIZE = 10  # Number of training examples to process before updating our models variables
IMG_W = 300
IMG_H = 225

# features = tfds.features.FeaturesDict({
#     "image": tfds.features.Image(shape=(IMG_W, IMG_H) * 2 + (3,)),
#     "label": tfds.features.ClassLabel(names=["MARKER"]),
#     "filename": tfds.features.Text(),
# })

train_image_generator = ImageDataGenerator(
    rescale=1. / 255,
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

# model = tf.keras.models.Sequential([
#     Flatten(input_shape=(IMG_W, IMG_H, 3)),
#     Dense(128, activation=tf.nn.relu),
#     Dense(32, activation=tf.nn.relu),
#     Dense(2, activation=tf.nn.softmax)
# ])
model = tf.keras.models.Sequential([
    Conv2D(32, (3, 3), activation=tf.nn.relu, input_shape=(IMG_W, IMG_H, 3)),
    MaxPooling2D(2, 2),

    Conv2D(64, (3, 3), activation=tf.nn.relu),
    MaxPooling2D(2, 2),

    # Conv2D(128, (3, 3), activation=tf.nn.relu),
    # MaxPooling2D(2, 2),
    #
    # Conv2D(128, (3, 3), activation=tf.nn.relu),
    # MaxPooling2D(2, 2),

    # Dropout(0.5),
    Flatten(),
    Dense(64, activation=tf.nn.relu),
    Dense(32, activation=tf.nn.relu),
    Dense(2, activation=tf.nn.softmax)
])

model.compile(optimizer='adam',
              loss='sparse_categorical_crossentropy',
              metrics=['accuracy'])

model.summary()

EPOCHS = 2
history = model.fit_generator(
    train_data_gen,
    steps_per_epoch=int(np.ceil(total_train / float(BATCH_SIZE))),
    epochs=EPOCHS,
    validation_data=validation_data_gen,
    validation_steps=int(np.ceil(total_val / float(BATCH_SIZE)))
)

##############################
# 4. visualize results
##############################

acc = history.history['acc']
val_acc = history.history['val_acc']

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

# from matplotlib.image import imread
# img = imread('C:\\Programy\\EasyPHP-Devserver-17\\eds-www\\2018\\thumbs\\2-1-cesta-do-Miami\\11.jpg')
# img = img.astype(np.float32)
# model.predict(np.array([img]))
