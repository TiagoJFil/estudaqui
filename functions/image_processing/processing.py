import cv2
import numpy as np

class OpenCVProcesser:
    def __init__(self):
        """Initialize the OpenCVProcesser."""
        pass

    def process(self, img, min_area=2000, max_aspect_ratio=5.0):
        """
        Process the image to detect figures and return their bounding boxes.
        :param img: Input image in BGR format.
        :param min_area: Minimum area of the bounding box to consider.
        :param max_aspect_ratio: Maximum aspect ratio of the bounding box.
        :return: List of dictionaries with keys 'x', 'y', 'width', 'height'.
        """
        return self._detect_figures_cv(img, min_area, max_aspect_ratio)

    def _filter_contained_boxes(self,boxes):
        """Keep only boxes not fully contained in any other."""
        filtered = []
        for box in boxes:
            contained = False
            for other in boxes:
                if box is other:
                    continue
                if (box['x']   >= other['x'] and
                    box['y']   >= other['y'] and
                    box['x'] + box['width']  <= other['x'] + other['width'] and
                    box['y'] + box['height'] <= other['y'] + other['height']):
                    contained = True
                    break
            if not contained:
                filtered.append(box)
        return filtered

    """
    Detect figures in an image using OpenCV.
    Returns a list of dictionaries with keys 'x', 'y', 'width', and 'height'
    {
        "x": float,  # x-coordinate of the top-left corner
        "y": float,  # y-coordinate of the top-left corner (bottom-left in cv origin)
        "width": float,  # width of the bounding box
        "height": float  # height of the bounding box
    }
    """
    def _detect_figures_cv(self,img, min_area=2000, max_aspect_ratio=5.0):
        """Return a list of {x,y,width,height} guessing where figures are."""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (5,5), 0)
        _, thresh = cv2.threshold(blur, 0, 255,cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (7,7))
        closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL,
                                    cv2.CHAIN_APPROX_SIMPLE)

        h_img = img.shape[0]
        boxes = []
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < min_area:
                continue
            # Optional: approximate polygon and filter by number of vertices
            # approx = cv2.approxPolyDP(cnt, 0.02*cv2.arcLength(cnt,True), True)
            # if len(approx) != 6: continue

            x, y, w, h = cv2.boundingRect(cnt)
            
            if (w / float(h)) > max_aspect_ratio:
                continue
            # convert cv origin (top-left) to bottom-left if you need
            boxes.append({
                "x": float(x),
                "y": float(h_img - (y + h)),
                "width": float(w),
                "height": float(h)
            })

        boxes_filtered = self._filter_contained_boxes(boxes)
        
        if not boxes_filtered:
            return []

        return self._cut_boxes(img,boxes_filtered)    

    def _cut_boxes(self, img, boxes):
        """
        Cut the image into boxes based on the detected bounding boxes.
        :param img: Input image in BGR format.
        :param boxes: List of dictionaries with keys 'x', 'y', 'width', 'height'.
        :return: List of cropped images.
        """
        cropped_images = []
        h_img = img.shape[0]
        for box in boxes:
            x, y, w, h = int(box['x']), int(box['y']), int(box['width']), int(box['height'])
            # Adjust y to account for OpenCV's top-left origin
            y = h_img - (y + h)
            cropped_img = img[y:y+h, x:x+w]
            cropped_images.append(cropped_img)
            
            
        return cropped_images


if __name__ == "__main__":
    # read image diana.png 
    img = cv2.imread("diana.png")
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
            