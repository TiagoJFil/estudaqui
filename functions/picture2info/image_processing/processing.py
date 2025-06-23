import cv2
import numpy as np
import os
from pathlib import Path

class OpenCVProcesser:
    # Constants
    MINIMUM_WIDTH = 20
    MINIMUM_HEIGHT = 20
    GREEN_COLOR = (36, 255, 12)      # Color for individual contours
    BLUE_COLOR = (255, 0, 0)         # Color for merged regions (phrases)
    RED_COLOR = (0, 0, 255)          # Color for paragraph regions
    TRACE_WIDTH = 2
    HORIZONTAL_PROXIMITY_THRESHOLD = 50  # Max horizontal distance between related elements
    VERTICAL_OVERLAP_THRESHOLD = 0.3     # Minimum vertical overlap ratio for horizontal merging
    VERTICAL_DISTANCE_THRESHOLD = 50     # Maximum vertical distance for paragraph grouping

    def __init__(self):
        """Initialize the OpenCVProcesser."""
        pass

    def process(self, img,):
        """
        Process the image to detect figures and return their bounding boxes.
        :param img: Input image in BGR format.
        :param min_area: Minimum area of the bounding box to consider.
        :param max_aspect_ratio: Maximum aspect ratio of the bounding box.
        :return: List of dictionaries with keys 'x', 'y', 'w', 'h'.
        """
        figures = self._detect_figures_cv(img, testing_mode=True)
        return self._cut_boxes(img, figures)
    
    def _prepare_image(self,inputImage):
        """
        Prepare and preprocess the image for contour detection
        
        Args:
            inputImage:  the input image
            
        Returns:
            tuple: (original image, processed image, binary threshold image)
        """
        original = inputImage.copy()
        
        # Convert to grayscale
        gray = cv2.cvtColor(inputImage, cv2.COLOR_BGR2GRAY)
        
        # Apply threshold to create binary image
        thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
        
        return original, inputImage, thresh

    def _detect_figures_cv(self, img, testing_mode=False):
        """
        Extract images from a file, detecting both phrases and paragraphs
        
        Args:
            img: The image file
            testing_mode: Whether running in test mode
            
        Returns:
            list: List of dictionaries with extracted region data
        """
        # Prepare the image
        original, image, thresh = self._prepare_image(img)
        
        # Detect basic contours
        boxes = self._detect_basic_contours(thresh,testing_mode)

        # Visualize contours if in testing mode
        
        # Use extract_phrase_bounding_boxes to get phrase and spanning boxes
        img_copy = original.copy()
        _phrase_boxes, spanning_boxes = self._detect_distant_phrases_bounding_boxes(img_copy, use_full_image_width=True,testing_mode=testing_mode)
        

        # Convert spanning_boxes to the (x, y, w, h) format
        spanning_regions = []
        for box in spanning_boxes:
            x, y, w, h = box['x'], box['y'], box['w'], box['h']
            
            # Check if this spanning box contains at least one basic contour
            contains_basic_contour = False
            for bx, by, bw, bh in boxes:
                # Check if basic box center is inside spanning box
                b_center_x = bx + bw/2
                b_center_y = by + bh/2
                if (x <= b_center_x <= x + w) and (y <= b_center_y <= y + h):
                    contains_basic_contour = True
                    break
            
            # Only include spanning boxes that contain at least one basic contour
            if contains_basic_contour:
                spanning_regions.append((x, y, w, h))
                # Draw original boxes in green
        
        
        if testing_mode:  
            img = original.copy()
            for i, box in enumerate(boxes):
                    # Ensure box is a dictionary with expected keys
                if isinstance(box, tuple):
                    # Convert tuple to dictionary for consistency
                    box = {'x': box[0], 'y': box[1], 'w': box[2], 'h': box[3]}
                elif not isinstance(box, dict) or not all(k in box for k in ['x', 'y', 'w', 'h']):
                    print(f"Invalid box format: {box}")
                    continue
                # Draw bounding boxes on the image
                cv2.rectangle(img, (box['x'], box['y']),
                            (box['x'] + box['w'], box['y'] + box['h']),
                            (0, 255, 0), 2)
                cv2.putText(img, f"{i}: {box['w']}x{box['h']}",
                            (box['x'], box['y'] - 10), cv2.FONT_HERSHEY_SIMPLEX,
                            0.5, (0, 255, 0), 1)
                # Draw spanning boxes in blue (using full width from leftmost to rightmost edge)

            for i, box in enumerate(_phrase_boxes):
                    # Ensure box is a dictionary with expected keys
                if isinstance(box, tuple):
                    # Convert tuple to dictionary for consistency
                    box = {'x': box[0], 'y': box[1], 'w': box[2], 'h': box[3]}
                elif not isinstance(box, dict) or not all(k in box for k in ['x', 'y', 'w', 'h']):
                    print(f"Invalid box format: {box}")
                    continue
                cv2.rectangle(img, (box['x'], box['y']),
                            (box['x'] + box['w'], box['y'] + box['h']),
                            (255, 0, 0), 2)
                cv2.putText(img, f"P{i}: W={box['w']}",
                            (box['x'], box['y'] + box['h'] // 2), 
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.5, (255, 0, 0), 1)
            for i, box in enumerate(spanning_boxes):
                    # Ensure box is a dictionary with expected keys
                if isinstance(box, tuple):
                    # Convert tuple to dictionary for consistency
                    box = {'x': box[0], 'y': box[1], 'w': box[2], 'h': box[3]}
                elif not isinstance(box, dict) or not all(k in box for k in ['x', 'y', 'w', 'h']):
                    print(f"Invalid box format: {box}")
                    continue
                cv2.rectangle(img, (box['x'], box['y']),
                            (box['x'] + box['w'], box['y'] + box['h']),
                            (255, 0, 0), 2)
                cv2.putText(img, f"S{i}: W={box['w']}",
                            (box['x'], box['y'] + box['h'] // 2), 
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.5, (255, 0, 0), 1)
            for i, box in enumerate(spanning_regions):
                    # Ensure box is a dictionary with expected keys
                if isinstance(box, tuple):
                    # Convert tuple to dictionary for consistency
                    box = {'x': box[0], 'y': box[1], 'w': box[2], 'h': box[3]}
                elif not isinstance(box, dict) or not all(k in box for k in ['x', 'y', 'w', 'h']):
                    print(f"Invalid box format: {box}")
                    continue
                x, y, w, h = box
                cv2.rectangle(img, (box['x'], box['y']),
                            (box['x'] + box['w'], box['y'] + box['h']), (0, 0, 255), 2)
                cv2.putText(img, f"S{i}: W={box['w']}",
                            (box['x'], box['y'] + box['h'] // 2),  cv2.FONT_HERSHEY_SIMPLEX,
                            0.5, (0, 0, 255), 1)
                
            cv2.imshow("Phrase Bounding Boxes with Spanning Regions", img)
            cv2.waitKey(0)

        # Prepare and return extracted regions including spanning regions
        return self._prepare_return_data(original, spanning_regions)  
  
    def _detect_distant_phrases_bounding_boxes(self,img, min_width=100, max_height=50, vertical_distance_threshold=60, use_full_image_width=False,testing_mode=False):      
        """
        Heuristic text-line detection to find question-like lines without OCR.
        Uses morphological operations to detect horizontal text regions.
        Only detects text in the left half of the image, ignoring contours on the right side.
        Args:
            img: Input image
            min_width: Minimum width for a valid text line
            max_height: Maximum height for a valid text line
            vertical_distance_threshold: Minimum vertical distance required for creating spanning boxes
                                        (boxes with distance >= threshold are considered related)
            use_full_image_width: If True, spanning boxes will cover the full image width (0 to image width)
                                instead of just the leftmost to rightmost points of detected boxes
            
        Returns:
            tuple: (original boxes, spanning boxes between distant vertical regions using global width)
        """
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # Binary inverse thresh: text becomes white
        _, thresh = cv2.threshold(gray, 0, 255,
                                cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)
        # Use a wide, short kernel to connect text into lines
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (50, 3))
        connected = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        contours, _ = cv2.findContours(connected, cv2.RETR_EXTERNAL,
                                    cv2.CHAIN_APPROX_SIMPLE)
        boxes = []
        # Get image width to determine the middle point
        img_width = img.shape[1]
        middle_x = img_width // 2
        if testing_mode:
            print(f"Image shape: {img.shape}, Middle X: {middle_x}")
            print(f"Contours found: {len(contours)}")
        
        # Track statistics for filtered contours
        total_contours = len(contours)
        filtered_by_position = 0
        
        for cnt in contours:
            x, y, w, h = cv2.boundingRect(cnt)
            # Filter boxes by size (likely long lines) and ignore those starting at or beyond the middle of the image horizontally
            if w >= min_width and h <= max_height:
                if x < middle_x:
                    boxes.append({'x': x, 'y': y, 'w': w, 'h': h})
                else:
                    filtered_by_position += 1
                    # Draw filtered out boxes in red on the debug image
                    cv2.rectangle(img, (x, y), (x + w, y + h), (0, 0, 255), 1)
        
        if testing_mode:
            print(f"Total contours: {total_contours}, Filtered by position: {filtered_by_position}, Remaining: {len(boxes)}")
        # Sort top-to-bottom
        boxes = sorted(boxes, key=lambda b: b['y'])
        
        # Create spanning boxes between vertically distant regions (using full width)
        spanning_boxes = []
        # Determine the left and right edges based on the mode
        if use_full_image_width:
            # Use the full image width
            global_left_x = 0
            global_right_x = img_width
            
            if testing_mode:
                print(f"Using full image width: 0 to {img_width}")
        else:
            # Find the global leftmost and rightmost edges across all boxes
            global_left_x = min(box['x'] for box in boxes) if boxes else 0
            global_right_x = max(box['x'] + box['w'] for box in boxes) if boxes else 0
            print(f"Using detected box extents: {global_left_x} to {global_right_x}")
        
        if len(boxes) >= 2:
            for i in range(len(boxes) - 1):
                current_box = boxes[i]
                next_box = boxes[i + 1]
                
                # Calculate vertical distance between bottom of current and top of next
                current_bottom = current_box['y'] + current_box['h']
                next_top = next_box['y']
                vertical_distance = next_top - current_bottom
                
                # If boxes are more distant than the threshold, create a spanning box
                if vertical_distance >= vertical_distance_threshold:
                    # Create a new box that spans from bottom of current to top of next
                    # Use the global furthest left and right edges from all boxes
                    span_x = global_left_x
                    span_y = current_bottom
                    span_width = global_right_x - global_left_x
                    span_height = next_top - current_bottom
                    width_desc = "full image width" if use_full_image_width else "detected box extents"
                    spanning_boxes.append({
                        'x': span_x,
                        'y': span_y,
                        'w': span_width,
                        'h': span_height,
                    })


        
        return boxes, spanning_boxes
    
    def _detect_basic_contours(self,thresh_image, min_width=MINIMUM_WIDTH, min_height=MINIMUM_HEIGHT,testing_mode = False):
        """
        Detect basic contours in the thresholded image
        
        Args:
            thresh_image: Binary threshold image
            min_width: Minimum width for a valid contour
            min_height: Minimum height for a valid contour
            
        Returns:
            list: List of bounding boxes (x, y, w, h)
        """
        # Find contours
        cnts = cv2.findContours(thresh_image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_TC89_L1)
        cnts = cnts[0] if len(cnts) == 2 else cnts[1]
        
        # Get all bounding boxes with minimum size
        boxes = []
        for c in cnts:
            x, y, w, h = cv2.boundingRect(c)
            if w >= min_width and h >= min_height:
                boxes.append((x, y, w, h))
                
        return boxes

    def _cut_boxes(self, img, boxes):
        """
        Cut the image into boxes based on the detected bounding boxes.
        :param img: Input image in BGR format.
        :param boxes: List of dictionaries with keys 'x', 'y', 'w', 'h'.
        :return: List of cropped images.
        """
        cropped_images = []
        h_img = img.shape[0]
        for box in boxes:
            x, y, w, h = int(box['x']), int(box['y']), int(box['w']), int(box['h'])
            # Adjust y to account for OpenCV's top-left origin
            cropped_img = img[y:y+h, x:x+w]
            cropped_images.append(cropped_img)
            
            
        return cropped_images

    def _prepare_return_data(self,original, spanning_regions):
        """
        Prepare extracted region data for return
        
        Args:
            original: Original image
            spanning_regions: List of spanning bounding boxes (optional)
            
        Returns:
            list: List of dictionaries with region data
        """
        extracted_regions = []
        # Add spanning regions if provided
        if spanning_regions:
            for x, y, w, h in spanning_regions:
                extracted_regions.append({
                    "x": x,
                    "y": y,
                    "w": w,
                    "h": h,
                })
        return extracted_regions

    def _visualize_contours(self,image, boxes, color=GREEN_COLOR, trace_width=TRACE_WIDTH, show_contours=False):
        """
        Visualize contours on the image and optionally display them
        
        Args:
            image: Image to draw contours on
            boxes: List of bounding boxes (x, y, w, h)
            color: Color to use for drawing
            trace_width: Width of the contour line
            show_contours: Whether to display each contour
            
        Returns:
            image: Image with contours drawn
        """
        print(boxes)
        # Draw contours on image
        for i, box in enumerate(boxes):
            # Ensure box is a dictionary with expected keys
            if isinstance(box, tuple):
                # Convert tuple to dictionary for consistency
                box = {'x': box[0], 'y': box[1], 'w': box[2], 'h': box[3]}
            elif not isinstance(box, dict) or not all(k in box for k in ['x', 'y', 'w', 'h']):
                print(f"Invalid box format: {box}")
                continue
            x, y, w, h = box['x'], box['y'], box['w'], box['h']
            print(f"Drawing contour {i+1}: x={x}, y={y}, w={w}, h={h}")
            cv2.rectangle(image, (x, y), (x + w, y + h), color, trace_width)
            cv2.putText(image, str(i+1), (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
            
            # Show each contour if requested
        return image

        

"""
if __name__ == "__main__":
    # read image diana.png 
    img = cv2.imread("fq.png")
    if img is None:
        print("Error: Could not read image.")
    else:
        processor = OpenCVProcesser()
        boxes = processor.process(img)
        if boxes:
            print(f"Detected {len(boxes)} boxes.")
            for box in boxes:
                cv2.imshow("Detected Boxes", box)
                cv2.waitKey(0)
        else:
            print("No boxes detected.")
"""