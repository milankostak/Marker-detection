I am using this repository for works and implementation on the topic of *Marker Detection*. Three different versions, each with several improvements, were developed to this date.
All versions are implemented in WebGL, and therefore they are using GPU processing to speed up the process of detection.

## Version 1
This version is working by dividing areas into rectangles. Inside each rectangle, every pixel is processed. There are two steps to make the texture smaller for reading into CPU memory.

https://github.com/milankostak/Diploma-thesis

For more details read our paper: [Mobile phone as an interactive device in augmented reality system](https://scholar.google.com/scholar_lookup?title=Mobile%20phone%20as%20an%20interactive%20device%20in%20augmented%20reality%20system&publication_year=2018)

## Version 2
This version is built on a completely different algorithm. It works by projecting columns and rows of pixels. These projections are summed, and a weighted arithmetic mean of their coordinates is calculated.

https://github.com/milankostak/Marker-detection/releases/tag/v2.0

For more details read our paper: [Color Marker Detection with WebGL for Mobile Augmented Reality Systems](https://doi.org/10.1007/978-3-030-27192-3_6)

## Version 3
This version is based on the second version. The main focus of works on this version was finding improvements for eliminating false detections. This is achieved by color weighting and morphological operation of erosion. Another primary goal was implementing an algorithm that would allow selecting of the target color for every use.

https://github.com/milankostak/Marker-detection/releases/tag/v3.0

For more details read our paper: [Adaptive Detection of Single-color Marker with WebGL](https://doi.org/10.1007/978-3-030-58465-8_29)
