import math

test = [1, 2, 352, 353, 354]
sumsin = 0
sumcos = 0
test2 = []

for i in range(len(test)):
    value = test[i]
    rad = math.radians(value)
    sumsin += math.sin(rad)
    sumcos += math.cos(rad)

print("---")
mean = math.atan2(sumsin / len(test), sumcos / len(test))
print(math.degrees(mean))
mean2 = math.atan2(sumsin, sumcos)
print(math.degrees(mean2))
