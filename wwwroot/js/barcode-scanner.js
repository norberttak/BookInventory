// Barcode Scanner JavaScript Module
class BarcodeScanner {
    constructor() {
        this.video = null;
        this.stream = null;
        this.isScanning = false;
        this.onScanCallback = null;
        this.onErrorCallback = null;
    }

    async startCamera(videoElement) {
        try {
            this.video = videoElement;
            
            // Request camera access
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Use back camera on mobile
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            this.video.srcObject = this.stream;
            this.video.play();
            
            return true;
        } catch (error) {
            console.error('Error accessing camera:', error);
            if (this.onErrorCallback) {
                this.onErrorCallback('Camera access denied or not available');
            }
            return false;
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.video) {
            this.video.srcObject = null;
        }
        this.isScanning = false;
    }

    startScanning(onScanCallback, onErrorCallback) {
        this.onScanCallback = onScanCallback;
        this.onErrorCallback = onErrorCallback;
        this.isScanning = true;
        
        // Use QuaggaJS for barcode scanning
        if (typeof Quagga !== 'undefined') {
            this.initQuagga();
        } else {
            // Fallback: manual input simulation for testing
            console.warn('QuaggaJS not loaded, using fallback scanner');
            this.simulateScanner();
        }
    }

    initQuagga() {
        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: this.video,
                constraints: {
                    width: 640,
                    height: 480,
                    facingMode: "environment"
                }
            },
            locator: {
                patchSize: "medium",
                halfSample: true
            },
            numOfWorkers: 2,
            decoder: {
                readers: ["ean_reader", "ean_8_reader", "code_128_reader"]
            },
            locate: true
        }, (err) => {
            if (err) {
                console.error('QuaggaJS initialization error:', err);
                if (this.onErrorCallback) {
                    this.onErrorCallback('Barcode scanner initialization failed');
                }
                return;
            }
            Quagga.start();
        });

        Quagga.onDetected((data) => {
            if (this.isScanning && this.onScanCallback) {
                const code = data.codeResult.code;
                this.onScanCallback(code);
                this.stopScanning();
            }
        });
    }

    stopScanning() {
        this.isScanning = false;
        if (typeof Quagga !== 'undefined') {
            Quagga.stop();
        }
    }

    // Fallback scanner for testing without camera
    simulateScanner() {
        setTimeout(() => {
            if (this.isScanning) {
                // Simulate scanning a test ISBN
                const testISBN = '9780134685991'; // Example ISBN
                if (this.onScanCallback) {
                    this.onScanCallback(testISBN);
                }
            }
        }, 2000);
    }

    // Manual ISBN input as alternative
    processManualInput(isbn) {
        if (this.onScanCallback) {
            this.onScanCallback(isbn);
        }
    }
}

// Global scanner instance
window.barcodeScanner = new BarcodeScanner();

// Helper functions for Blazor integration
window.blazorBarcodeScanner = {
    startCamera: async (videoElementId) => {
        const video = document.getElementById(videoElementId);
        if (!video) {
            console.error('Video element not found:', videoElementId);
            return false;
        }
        return await window.barcodeScanner.startCamera(video);
    },

    stopCamera: () => {
        window.barcodeScanner.stopCamera();
    },

    startScanning: (dotNetRef, onScanMethod, onErrorMethod) => {
        window.barcodeScanner.startScanning(
            (isbn) => {
                dotNetRef.invokeMethodAsync(onScanMethod, isbn);
            },
            (error) => {
                dotNetRef.invokeMethodAsync(onErrorMethod, error);
            }
        );
    },

    stopScanning: () => {
        window.barcodeScanner.stopScanning();
    },

    processManualInput: (isbn) => {
        window.barcodeScanner.processManualInput(isbn);
    }
};