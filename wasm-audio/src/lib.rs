use pitch_detection::{McLeodDetector, PitchDetector};
use wasm_bindgen::prelude::*;
mod utils;

#[wasm_bindgen]
pub struct WasmPitchDetector {
  sample_rate: usize,
  fft_size: usize,
  detector: McLeodDetector<f32>,
}

#[wasm_bindgen]
impl WasmPitchDetector {
  pub fn new(sample_rate: usize, fft_size: usize) -> WasmPitchDetector {
    utils::set_panic_hook();

    let fft_pad = fft_size / 2;

    WasmPitchDetector {
      sample_rate,
      fft_size,
      detector: McLeodDetector::<f32>::new(fft_size, fft_pad),
    }
  }

  pub fn detect_pitch(&mut self, audio_samples: Vec<f32>) -> f32 {
    if audio_samples.len() < self.fft_size {
      panic!("Insufficient samples passed to detect_pitch(). Expected an array containing {} elements but got {}", self.fft_size, audio_samples.len());
    }

    const POWER_THRESHOLD: f32 = 5.0;
    const CLARITY_THRESHOLD: f32 = 0.6;

    let optional_pitch = self.detector.get_pitch(
      &audio_samples,
      self.sample_rate,
      POWER_THRESHOLD,
      CLARITY_THRESHOLD,
    );

    match optional_pitch {
      Some(pitch) => pitch.frequency,
      None => 0.0,
    }
  }
}
