# Object Detection of Aerial Vehicles Using YOLO-Based Transfer Learning

This repository contains the implementation for my BSc thesis project on YOLO-based transfer learning for civilian aerial object detection.

## Thesis Topic

**Object Detection of Aerial Vehicles Using YOLO-Based Transfer Learning**

The project focuses on detecting two civilian aerial object classes:

- Airplane
- Drone

## Model and Approach

The implementation uses pre-trained YOLOv8 models and fine-tunes them on a custom two-class dataset. This is a transfer learning approach, where pre-trained YOLO weights are adapted to the target classes.

## Datasets

Two public Kaggle datasets were used:

1. Airbus Aircrafts Sample Dataset  
   Used for the airplane class.

2. Drone YOLO Detection Dataset  
   Used for the drone class.

The Airbus annotations were converted from CSV geometry format into YOLO bounding box format. The drone labels were already in YOLO format, but the class index was changed to match the combined dataset.

## Class Mapping

```text
0: airplane
1: drone
