# OCR Demo Enhanced

OCR Demo Enhanced is a web-based application that allows users to upload an image and extract text from it using an enhanced OCR process with Tesseract.js. The application includes features such as image processing for improved OCR accuracy, adaptive thresholding, noise reduction, and sharpening filters.

## Features

- Upload images via file input or drag-and-drop
- Image preprocessing to improve OCR recognition accuracy
  - Adaptive thresholding for contrast enhancement
  - Noise reduction using a median filter
  - Sharpening filter using convolution
- Real-time OCR progress display using Tesseract.js
- Display of original and processed images side by side
- Text extraction with results shown in a clear format

## Technologies Used

- HTML5 & CSS3 for layout and styling
- JavaScript for image processing and OCR
- Tesseract.js for performing OCR

## How It Works

1. **Image Upload:** Users can upload an image by clicking the "Choose Image" button or dragging and dropping the image.
2. **Image Preprocessing:** Once an image is selected, the script:
   - Increases the resolution of the image to improve OCR accuracy.
   - Applies grayscale conversion with adaptive thresholding based on average brightness.
   - Reduces noise with a median filter.
   - Sharpens the processed image using a convolution filter.
3. **OCR Processing:** The processed image is fed into Tesseract.js where OCR is performed. The progress is tracked and displayed in real-time.
4. **Result Display:** The extracted text is displayed in the "Detected Text" section once the OCR is complete.

## Installation

Clone this repository and open `index.html` in your browser:


## Demo



