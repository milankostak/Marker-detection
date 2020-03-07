import statistics

with open("test.txt") as file:
    gt_lines = [line.rstrip() for line in file]

with open("results.txt") as file:
    result_lines = [line.rstrip() for line in file]

true_negative_count = 0
false_positive_count = 0
false_negative_count = 0
distances = []

count = len(gt_lines)
for i in range(count):
    gt_line = gt_lines[i].split(",")
    result_line = result_lines[i].split(",")

    if gt_line[1] == "-1" and gt_line[2] == "-1" and result_line[1] != "-1" and result_line[2] != "-1":
        # ground truth - no marker
        # detection - marker found
        false_positive_count += 1
    elif gt_line[1] != "-1" and gt_line[2] != "-1" and result_line[1] == "-1" and result_line[2] == "-1":
        false_negative_count += 1
    elif gt_line[1] == "-1" and gt_line[2] == "-1" and result_line[1] == "-1" and result_line[2] == "-1":
        true_negative_count += 1
    else:
        x1 = float(gt_line[1])
        y1 = float(gt_line[2])
        x2 = float(result_line[1])
        y2 = float(result_line[2])

        distance = pow(pow(x2 - x1, 2) + pow(y2 - y1, 2), 1/2)
        if distance > 15:
            false_positive_count += 1
        else:
            distances.append(distance)

print("True positive:", len(distances))
print(distances)
print("Mean:", statistics.mean(distances))
print("Median:", statistics.median(distances))
print("True negative:", true_negative_count)
print("False positive:", false_positive_count)
print("False negative:", false_negative_count)
