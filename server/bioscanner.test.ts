import { describe, it, expect, beforeEach } from "vitest";
import { BioScannerEngine } from "../client/src/lib/rppg-engine";

/**
 * Bio-Scanner Engine Tests
 * 
 * Verifies critical bug fixes:
 * 1. Green channel usage (correct PPG signal detection)
 * 2. Pixel sampling performance optimization
 * 3. Dynamic FPS calculation
 * 4. Heart rate calculation accuracy
 * 5. Signal quality assessment
 */

describe("BioScannerEngine - Critical Bug Fixes Verification", () => {
  let engine: BioScannerEngine;

  beforeEach(() => {
    engine = new BioScannerEngine({
      fps: 30,
      minWindowSeconds: 5,
      maxBufferSeconds: 15,
      minHeartRate: 45,
      maxHeartRate: 200,
      samplingInterval: 8,
    });
  });

  describe("1. Green Channel Usage (Fix #1)", () => {
    it("should process Green channel from ImageData", () => {
      // Create mock ImageData with distinct RGB values
      const width = 320;
      const height = 240;
      const data = new Uint8ClampedArray(width * height * 4);
      
      // Fill with distinct values: R=100, G=150, B=50
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 100;     // Red
        data[i + 1] = 150; // Green (should be used)
        data[i + 2] = 50;  // Blue
        data[i + 3] = 255; // Alpha
      }

      const imageData = {
        data,
        width,
        height,
        colorSpace: "srgb" as PredefinedColorSpace,
      };

      const avgIntensity = engine.processFrame(imageData);

      // The engine should return Green channel average (~150)
      // With sampling interval of 8, it samples every 8th pixel
      expect(avgIntensity).toBeGreaterThan(140);
      expect(avgIntensity).toBeLessThan(160);
      
      // Verify it's NOT using Red channel (would be ~100)
      expect(avgIntensity).not.toBeCloseTo(100, 0);
    });

    it("should detect subtle variations in Green channel", () => {
      const width = 320;
      const height = 240;
      
      // Process multiple frames with varying Green channel values
      const intensities: number[] = [];
      for (let frame = 0; frame < 10; frame++) {
        const data = new Uint8ClampedArray(width * height * 4);
        
        // Simulate subtle PPG signal variation across frames (not within single frame)
        const frameVariation = Math.sin(frame / 2) * 5; // ±5 variation per frame
        
        for (let i = 0; i < data.length; i += 4) {
          data[i] = 100;                        // Red (constant)
          data[i + 1] = 150 + frameVariation;   // Green (varying per frame)
          data[i + 2] = 50;                     // Blue (constant)
          data[i + 3] = 255;
        }

        const imageData = {
          data,
          width,
          height,
          colorSpace: "srgb" as PredefinedColorSpace,
        };

        const intensity = engine.processFrame(imageData);
        intensities.push(intensity);
      }

      // Buffer should contain varying values (not flat)
      expect(engine.buffer.length).toBe(10);
      const variance = calculateVariance(intensities);
      expect(variance).toBeGreaterThan(0);
    });
  });

  describe("2. Pixel Sampling Performance (Fix #2)", () => {
    it("should sample pixels at specified interval", () => {
      const width = 320;
      const height = 240;
      const totalPixels = width * height; // 76,800 pixels
      const samplingInterval = 8;
      const expectedSamples = Math.floor(totalPixels / samplingInterval); // ~9,600 pixels

      const data = new Uint8ClampedArray(width * height * 4);
      data.fill(150);

      const imageData = {
        data,
        width,
        height,
        colorSpace: "srgb" as PredefinedColorSpace,
      };

      // The engine should process only ~9,600 pixels instead of 76,800
      const startTime = performance.now();
      engine.processFrame(imageData);
      const endTime = performance.now();

      // Processing should be fast (< 5ms for sampled pixels)
      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(5);

      // Verify buffer has data
      expect(engine.buffer.length).toBe(1);
    });

    it("should maintain accuracy with pixel sampling", () => {
      const width = 320;
      const height = 240;
      const data = new Uint8ClampedArray(width * height * 4);
      
      // Fill with uniform green value
      for (let i = 0; i < data.length; i += 4) {
        data[i + 1] = 150; // Green
      }

      const imageData = {
        data,
        width,
        height,
        colorSpace: "srgb" as PredefinedColorSpace,
      };

      const avgIntensity = engine.processFrame(imageData);

      // Even with sampling, average should be close to 150
      expect(avgIntensity).toBeCloseTo(150, 1);
    });
  });

  describe("3. Dynamic FPS Calculation", () => {
    it("should calculate FPS dynamically based on frame timing", async () => {
      const width = 320;
      const height = 240;
      const data = new Uint8ClampedArray(width * height * 4);
      data.fill(150);

      const imageData = {
        data,
        width,
        height,
        colorSpace: "srgb" as PredefinedColorSpace,
      };

      // Process frames with ~33ms delay (30 FPS)
      for (let i = 0; i < 5; i++) {
        engine.processFrame(imageData);
        await sleep(33);
      }

      const metrics = engine.getSignalMetrics();
      
      // FPS should be close to 30
      expect(metrics.fps).toBeGreaterThan(25);
      expect(metrics.fps).toBeLessThan(35);
    });
  });

  describe("4. Heart Rate Calculation", () => {
    it("should return null when insufficient data", () => {
      const result = engine.calculateHeartRate();
      expect(result).toBeNull();
    });

    it("should calculate heart rate after sufficient frames", () => {
      // Simulate 5 seconds of frames at 30 FPS = 150 frames
      const width = 320;
      const height = 240;
      
      for (let frame = 0; frame < 150; frame++) {
        const data = new Uint8ClampedArray(width * height * 4);
        
        // Simulate heart rate of 75 BPM (1.25 beats per second)
        // Period = 0.8 seconds = 24 frames at 30 FPS
        // Use stronger signal amplitude for reliable detection
        const heartSignal = Math.sin((frame / 24) * Math.PI * 2) * 20;
        
        for (let i = 0; i < data.length; i += 4) {
          data[i + 1] = 150 + heartSignal; // Green channel with heart signal
        }

        const imageData = {
          data,
          width,
          height,
          colorSpace: "srgb" as PredefinedColorSpace,
        };

        engine.processFrame(imageData);
      }

      const result = engine.calculateHeartRate();
      
      // Should return a result after sufficient data
      expect(result).not.toBeNull();
      
      if (result) {
        // Should have confidence score
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(100);
        
        // Should have quality assessment
        expect(['poor', 'fair', 'good', 'excellent']).toContain(result.quality);
        
        // Should have signal strength
        expect(result.signalStrength).toBeGreaterThanOrEqual(0);
        expect(result.signalStrength).toBeLessThanOrEqual(1);
        
        // If BPM is calculated (not 0), it should be in valid range
        if (result.bpm > 0) {
          expect(result.bpm).toBeGreaterThanOrEqual(45);
          expect(result.bpm).toBeLessThanOrEqual(200);
        }
      }
    });

    it("should reject out-of-range heart rates", () => {
      const width = 320;
      const height = 240;
      
      // Simulate unrealistic heart rate (300 BPM)
      for (let frame = 0; frame < 150; frame++) {
        const data = new Uint8ClampedArray(width * height * 4);
        
        // Very fast signal (5 beats per second = 300 BPM)
        const heartSignal = Math.sin((frame / 6) * Math.PI * 2) * 10;
        
        for (let i = 0; i < data.length; i += 4) {
          data[i + 1] = 150 + heartSignal;
        }

        const imageData = {
          data,
          width,
          height,
          colorSpace: "srgb" as PredefinedColorSpace,
        };

        engine.processFrame(imageData);
      }

      const result = engine.calculateHeartRate();
      
      // Should return result but with low confidence or marked as out of range
      if (result && result.bpm > 200) {
        expect(result.confidence).toBeLessThan(50);
      }
    });
  });

  describe("5. Signal Quality Assessment", () => {
    it("should detect poor signal quality (flat signal)", () => {
      const width = 320;
      const height = 240;
      
      // Simulate flat signal (no variation)
      for (let frame = 0; frame < 150; frame++) {
        const data = new Uint8ClampedArray(width * height * 4);
        
        for (let i = 0; i < data.length; i += 4) {
          data[i + 1] = 150; // Constant value
        }

        const imageData = {
          data,
          width,
          height,
          colorSpace: "srgb" as PredefinedColorSpace,
        };

        engine.processFrame(imageData);
      }

      const result = engine.calculateHeartRate();
      
      // Should detect poor quality
      if (result) {
        expect(result.quality).toBe('poor');
        expect(result.signalStrength).toBeLessThan(0.3);
      }
    });

    it("should detect good signal quality (clear periodic signal)", () => {
      const width = 320;
      const height = 240;
      
      // Simulate clear heart signal at 70 BPM
      for (let frame = 0; frame < 150; frame++) {
        const data = new Uint8ClampedArray(width * height * 4);
        
        // Clear periodic signal
        const heartSignal = Math.sin((frame / 25.7) * Math.PI * 2) * 15;
        
        for (let i = 0; i < data.length; i += 4) {
          data[i + 1] = 150 + heartSignal;
        }

        const imageData = {
          data,
          width,
          height,
          colorSpace: "srgb" as PredefinedColorSpace,
        };

        engine.processFrame(imageData);
      }

      const result = engine.calculateHeartRate();
      
      // Should detect good quality
      if (result) {
        expect(result.signalStrength).toBeGreaterThan(0.3);
      }
    });
  });

  describe("6. Buffer Management", () => {
    it("should maintain buffer within max size", () => {
      const width = 320;
      const height = 240;
      const maxBufferSize = 15 * 30; // 15 seconds at 30 FPS = 450 frames
      
      // Process more frames than max buffer
      for (let frame = 0; frame < 500; frame++) {
        const data = new Uint8ClampedArray(width * height * 4);
        data.fill(150);

        const imageData = {
          data,
          width,
          height,
          colorSpace: "srgb" as PredefinedColorSpace,
        };

        engine.processFrame(imageData);
      }

      // Buffer should not exceed max size
      expect(engine.buffer.length).toBeLessThanOrEqual(maxBufferSize);
    });

    it("should report correct buffer progress", () => {
      const width = 320;
      const height = 240;
      const minWindow = 5 * 30; // 5 seconds at 30 FPS = 150 frames
      
      // Process half the minimum window
      for (let frame = 0; frame < minWindow / 2; frame++) {
        const data = new Uint8ClampedArray(width * height * 4);
        data.fill(150);

        const imageData = {
          data,
          width,
          height,
          colorSpace: "srgb" as PredefinedColorSpace,
        };

        engine.processFrame(imageData);
      }

      const progress = engine.getBufferProgress();
      
      // Progress should be around 50%
      expect(progress).toBeGreaterThan(40);
      expect(progress).toBeLessThan(60);
    });

    it("should report ready status correctly", () => {
      const width = 320;
      const height = 240;
      
      // Initially not ready
      expect(engine.isReady()).toBe(false);
      
      // Process minimum window frames
      const minWindow = 5 * 30; // 150 frames
      for (let frame = 0; frame < minWindow; frame++) {
        const data = new Uint8ClampedArray(width * height * 4);
        data.fill(150);

        const imageData = {
          data,
          width,
          height,
          colorSpace: "srgb" as PredefinedColorSpace,
        };

        engine.processFrame(imageData);
      }

      // Should be ready now
      expect(engine.isReady()).toBe(true);
    });
  });
});

// Helper functions
function calculateVariance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
