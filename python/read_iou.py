import numpy as np


# https://www.pyimagesearch.com/2016/11/07/intersection-over-union-iou-for-object-detection/
# box_a - ground truth; box_b - prediction
def bb_intersection_over_union(box_a, box_b):
    # determine the (x, y)-coordinates of the intersection rectangle
    x_a = max(box_a[0], box_b[0])
    y_a = max(box_a[1], box_b[1])
    x_b = min(box_a[2], box_b[2])
    y_b = min(box_a[3], box_b[3])
    # compute the area of intersection rectangle
    inter_area = max(0, x_b - x_a + 1) * max(0, y_b - y_a + 1)
    # compute the area of both the prediction and ground-truth
    # rectangles
    box_a_area = (box_a[2] - box_a[0] + 1) * (box_a[3] - box_a[1] + 1)
    box_b_area = (box_b[2] - box_b[0] + 1) * (box_b[3] - box_b[1] + 1)
    # compute the intersection over union by taking the intersection
    # area and dividing it by the sum of prediction + ground-truth
    # areas - the intersection area
    iou = inter_area / float(box_a_area + box_b_area - inter_area)
    # return the intersection over union value
    return iou


with open("hue3-test.txt") as file:
    gt_lines = [line.rstrip() for line in file]

with open("hue3-results.txt") as file:
    pred_lines = [line.rstrip() for line in file]

all_ious = []
false_positive_count = 0
false_positives = []
false_positive_threshold = 0.2
false_negative_count = 0
false_negatives = []

count = len(gt_lines)
for i in range(count):
    gt_line = gt_lines[i].split(" ")
    gt_box = [gt_line[2], gt_line[3], gt_line[4], gt_line[5]]
    gt_box = [float(e) for e in gt_box]

    pred_line = pred_lines[i].split(",")
    if pred_line[1] == "-1":
        false_negative_count += 1
        false_negatives.append(pred_line[0])
        continue

    pred_box = [pred_line[4], pred_line[5], pred_line[6], pred_line[7]]
    pred_box = [float(e) for e in pred_box]

    possible_ious = []
    possible_iou = bb_intersection_over_union(gt_box, pred_box)
    if possible_iou < false_positive_threshold:
        false_positive_count += 1
        false_positives.append(pred_line[0])
    else:
        all_ious.append(possible_iou)

median = np.median(all_ious)
mean = np.mean(all_ious)
print("median", str(median).replace(".", ","))
print("mean", str(mean).replace(".", ","))
print()
print("false positive:", false_positive_count)
print(false_positives)
print()
print("false negative:", false_negative_count)
print(false_negatives)
