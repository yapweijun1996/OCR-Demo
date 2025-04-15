// Global variable to store the uploaded image source.
let originalImageSrc = null;
// Global variable to hold the current processed canvas.
let processedCanvas = null;

// Handle image upload.
function handleUpload(event) {
	const file = event.target.files[0];
	if (!file) return;
	const reader = new FileReader();
	reader.onload = function(readerEvent) {
		originalImageSrc = readerEvent.target.result;
		document.getElementById("sourceImage").src = originalImageSrc;
		processUploadedImage();
	};
	reader.readAsDataURL(file);
}

// Process the uploaded image based on current options.
function processUploadedImage() {
	if (!originalImageSrc) return;
	const img = new Image();
	img.onload = function() {
		if (!processedCanvas) {
			processedCanvas = document.createElement("canvas");
			processedCanvas.id = "processingCanvas";
			processedCanvas.style.display = "none";
			document.body.appendChild(processedCanvas);
		}
		const context = processedCanvas.getContext("2d");
		const increaseResolution = document.getElementById("optionIncreaseResolution").checked;
		const applyContrastEnhance = document.getElementById("optionContrastEnhance").checked;
		const applyAdaptiveThreshold = document.getElementById("optionAdaptiveThreshold").checked;
		const applyDeskew = document.getElementById("optionDeskew").checked;
		const applyMedianFilter = document.getElementById("optionMedianFilter").checked;
		const applyGaussianFilter = document.getElementById("optionGaussianFilter").checked;
		const applySharpen = document.getElementById("optionSharpen").checked;
		const applyMorpho = document.getElementById("optionMorpho").checked;
		const applyBackgroundRemoval = document.getElementById("optionBackgroundRemoval").checked;
		const boldValue = parseInt(document.getElementById("optionBoldness").value, 10);
		
		const scaleFactor = increaseResolution ? 3 : 1;
		processedCanvas.width = img.width * scaleFactor;
		processedCanvas.height = img.height * scaleFactor;
		context.drawImage(img, 0, 0, processedCanvas.width, processedCanvas.height);
		
		let imageData = context.getImageData(0, 0, processedCanvas.width, processedCanvas.height);
		if (applyDeskew) { deskewImage(processedCanvas, context, imageData); }
		if (applyContrastEnhance) { contrastEnhance(imageData); }
		if (applyAdaptiveThreshold) { adaptiveThreshold(imageData); }
		if (applyMedianFilter) { medianFilter(imageData, processedCanvas.width, processedCanvas.height); }
		if (applyGaussianFilter) { gaussianFilter(imageData, processedCanvas.width, processedCanvas.height); }
		if (applySharpen) { sharpen(imageData, processedCanvas.width, processedCanvas.height); }
		if (applyMorpho) { morphologicalOperation(imageData, processedCanvas.width, processedCanvas.height); }
		if (applyBackgroundRemoval) { backgroundArtifactRemoval(imageData, processedCanvas.width, processedCanvas.height); }
		adjustBoldness(imageData, processedCanvas.width, processedCanvas.height, boldValue);
		context.putImageData(imageData, 0, 0);
		
		const processedImageUrl = processedCanvas.toDataURL("image/png");
		document.getElementById("processedImage").src = processedImageUrl;
		document.getElementById("imageSection").style.display = "block";
		document.getElementById("ocrButtonSection").style.display = "block";
	};
	img.onerror = function() {
		console.error("Failed to load image");
		document.getElementById("imageSection").style.display = "none";
		document.getElementById("ocrButtonSection").style.display = "none";
	};
	img.src = originalImageSrc;
}

// Run OCR on the processed image.
function runOCR() {
	if (!processedCanvas) return;
	const processedImageUrl = processedCanvas.toDataURL("image/png");
	const progressContainer = document.getElementById("progressContainer");
	progressContainer.style.display = "block";
	updateProgress(0);
	
	Tesseract.recognize(processedImageUrl, "eng", {
		tessedit_pageseg_mode: 6,
		tessjs_create_pdf: "1",
	})
	.progress(function(progress) {
		if (progress.status === "recognizing text") {
			const pct = Math.floor(progress.progress * 100);
			updateProgress(pct);
		}
		console.log("OCR Progress:", progress);
	})
	.then(function(result) {
		console.log("Detected text:", result.text);
		document.getElementById("result").textContent = result.text;
	})
	.catch(function(error) {
		console.error("OCR Error:", error);
		document.getElementById("result").textContent = "Error: " + error;
	})
	.finally(function() {
		setTimeout(() => {
			updateProgress(0);
			progressContainer.style.display = "none";
		}, 1500);
	});
}

function updateProgress(percent) {
	document.getElementById("progressText").textContent = percent + "%";
	document.getElementById("progressBar").style.width = percent + "%";
}

// Helper Functions for Image Processing
function deskewImage(canvas, context, imageData) {
	console.log("Deskewing not implemented. Skipping...");
}

function contrastEnhance(imageData) {
	let data = imageData.data;
	let min = 255, max = 0;
	for (let i = 0; i < data.length; i += 4) {
		let v = data[i];
		if (v < min) min = v;
		if (v > max) max = v;
	}
	if (max === min) return;
	for (let i = 0; i < data.length; i += 4) {
		let v = data[i];
		let newVal = ((v - min) * 255) / (max - min);
		data[i] = data[i + 1] = data[i + 2] = newVal;
	}
}

function adaptiveThreshold(imageData) {
	let data = imageData.data;
	let totalBrightness = 0;
	const pixelCount = data.length / 4;
	for (let i = 0; i < data.length; i += 4) {
		totalBrightness += 0.34 * data[i] + 0.5 * data[i+1] + 0.16 * data[i+2];
	}
	const avgBrightness = totalBrightness / pixelCount;
	const threshold = avgBrightness * 0.85;
	for (let i = 0; i < data.length; i += 4) {
		const brightness = 0.34 * data[i] + 0.5 * data[i+1] + 0.16 * data[i+2];
		const color = brightness < threshold ? 0 : 255;
		data[i] = data[i+1] = data[i+2] = color;
	}
}

function medianFilter(imageData, width, height) {
	let data = imageData.data;
	let newData = new Uint8ClampedArray(data);
	for (let y = 1; y < height - 1; y++) {
		for (let x = 1; x < width - 1; x++) {
			const index = (y * width + x) * 4;
			let neighbors = [];
			for (let dy = -1; dy <= 1; dy++) {
				for (let dx = -1; dx <= 1; dx++) {
					const ni = ((y+dy) * width + (x+dx)) * 4;
					neighbors.push(data[ni]);
				}
			}
			neighbors.sort((a, b) => a - b);
			const median = neighbors[4];
			newData[index] = newData[index+1] = newData[index+2] = median;
		}
	}
	for (let i = 0; i < data.length; i++) {
		data[i] = newData[i];
	}
}

function gaussianFilter(imageData, width, height) {
	let data = imageData.data;
	let copyData = new Uint8ClampedArray(data);
	const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
	const kernelSum = 16;
	for (let y = 1; y < height - 1; y++) {
		for (let x = 1; x < width - 1; x++) {
			let sum = 0;
			for (let ky = -1; ky <= 1; ky++) {
				for (let kx = -1; kx <= 1; kx++) {
					const weight = kernel[(ky+1)*3 + (kx+1)];
					const ix = x + kx, iy = y + ky;
					const idx = (iy * width + ix) * 4;
					sum += copyData[idx] * weight;
				}
			}
			const newVal = Math.round(sum / kernelSum);
			const idx = (y * width + x) * 4;
			data[idx] = data[idx+1] = data[idx+2] = newVal;
		}
	}
}

function sharpen(imageData, width, height) {
	let data = imageData.data;
	let copyData = new Uint8ClampedArray(data);
	const sharpenKernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
	for (let y = 1; y < height - 1; y++) {
		for (let x = 1; x < width - 1; x++) {
			let sum = 0;
			for (let ky = -1; ky <= 1; ky++) {
				for (let kx = -1; kx <= 1; kx++) {
					const weight = sharpenKernel[(ky+1)*3 + (kx+1)];
					const ix = x + kx, iy = y + ky;
					const idx = (iy * width + ix) * 4;
					sum += copyData[idx] * weight;
				}
			}
			const idx = (y * width + x) * 4;
			const val = Math.min(Math.max(sum, 0), 255);
			data[idx] = data[idx+1] = data[idx+2] = val;
		}
	}
}

function morphologicalOperation(imageData, width, height) {
	let data = imageData.data;
	let newData = new Uint8ClampedArray(data);
	for (let y = 1; y < height - 1; y++) {
		for (let x = 1; x < width - 1; x++) {
			const index = (y * width + x) * 4;
			let maxVal = 0;
			for (let dy = -1; dy <= 1; dy++) {
				for (let dx = -1; dx <= 1; dx++) {
					const ni = ((y+dy)*width + (x+dx)) * 4;
					if (data[ni] > maxVal) {
						maxVal = data[ni];
					}
				}
			}
			newData[index] = newData[index+1] = newData[index+2] = maxVal;
		}
	}
	for (let i = 0; i < data.length; i++) {
		data[i] = newData[i];
	}
}

function backgroundArtifactRemoval(imageData, width, height) {
	let data = imageData.data;
	let newData = new Uint8ClampedArray(data);
	for (let y = 1; y < height - 1; y++) {
		for (let x = 1; x < width - 1; x++) {
			const index = (y * width + x) * 4;
			if (data[index] === 0) {
				let blackCount = 0;
				for (let dy = -1; dy <= 1; dy++) {
					for (let dx = -1; dx <= 1; dx++) {
						const ni = ((y+dy)*width + (x+dx)) * 4;
						if (data[ni] === 0) blackCount++;
					}
				}
				if (blackCount < 3) {
					newData[index] = newData[index+1] = newData[index+2] = 255;
				}
			}
		}
	}
	for (let i = 0; i < data.length; i++) {
		data[i] = newData[i];
	}
}

function dilateImage(imageData, width, height) {
	let data = imageData.data;
	let newData = new Uint8ClampedArray(data);
	for (let y = 1; y < height - 1; y++) {
		for (let x = 1; x < width - 1; x++) {
			const index = (y * width + x) * 4;
			let minVal = 255;
			for (let dy = -1; dy <= 1; dy++) {
				for (let dx = -1; dx <= 1; dx++) {
					const ni = ((y+dy)*width + (x+dx)) * 4;
					if (data[ni] < minVal) {
						minVal = data[ni];
					}
				}
			}
			newData[index] = newData[index+1] = newData[index+2] = minVal;
		}
	}
	for (let i = 0; i < data.length; i++) {
		data[i] = newData[i];
	}
}

function erodeImage(imageData, width, height) {
	let data = imageData.data;
	let newData = new Uint8ClampedArray(data);
	for (let y = 1; y < height - 1; y++) {
		for (let x = 1; x < width - 1; x++) {
			const index = (y * width + x) * 4;
			let maxVal = 0;
			for (let dy = -1; dy <= 1; dy++) {
				for (let dx = -1; dx <= 1; dx++) {
					const ni = ((y+dy)*width + (x+dx)) * 4;
					if (data[ni] > maxVal) {
						maxVal = data[ni];
					}
				}
			}
			newData[index] = newData[index+1] = newData[index+2] = maxVal;
		}
	}
	for (let i = 0; i < data.length; i++) {
		data[i] = newData[i];
	}
}

function adjustBoldness(imageData, width, height, boldValue) {
	if (boldValue > 0) {
		for (let i = 0; i < boldValue; i++) {
			dilateImage(imageData, width, height);
		}
	} else if (boldValue < 0) {
		for (let i = 0; i < Math.abs(boldValue); i++) {
			erodeImage(imageData, width, height);
		}
	}
}

const optionIds = [
	"optionIncreaseResolution",
	"optionContrastEnhance",
	"optionAdaptiveThreshold",
	"optionDeskew",
	"optionMedianFilter",
	"optionGaussianFilter",
	"optionSharpen",
	"optionMorpho",
	"optionBackgroundRemoval"
];
optionIds.forEach((id) => {
	document.getElementById(id).addEventListener("change", function () {
		if (originalImageSrc) { processUploadedImage(); }
	});
});
document.getElementById("optionBoldness").addEventListener("input", function () {
	document.getElementById("optionBoldnessValue").innerText = this.value;
	if (originalImageSrc) { processUploadedImage(); }
});

const uploadSection = document.getElementById("uploadSection");
uploadSection.addEventListener("dragover", function (event) {
	event.preventDefault();
	event.stopPropagation();
	uploadSection.classList.add("dragover");
});
uploadSection.addEventListener("dragleave", function (event) {
	event.preventDefault();
	event.stopPropagation();
	uploadSection.classList.remove("dragover");
});
uploadSection.addEventListener("drop", function (event) {
	event.preventDefault();
	event.stopPropagation();
	uploadSection.classList.remove("dragover");
	const dt = event.dataTransfer;
	if (dt && dt.files && dt.files[0]) {
		handleUpload({ target: { files: [dt.files[0]] } });
	}
});

// New: Listen for paste events to support CTRL+V image pasting.
window.addEventListener("paste", function(event) {
	if (event.clipboardData) {
		const items = event.clipboardData.items;
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			if (item.type.indexOf("image") !== -1) {
				const blob = item.getAsFile();
				const reader = new FileReader();
				reader.onload = function(e) {
					originalImageSrc = e.target.result;
					document.getElementById("sourceImage").src = originalImageSrc;
					processUploadedImage();
				};
				reader.readAsDataURL(blob);
				break;
			}
		}
	}
});