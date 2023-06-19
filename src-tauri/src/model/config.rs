use crate::utils::error::Error;
use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub window: Window,
    pub system: System,
    pub excel: Excel,
    pub chart: Chart,
}

impl Config {
    pub fn load(file_path: &PathBuf) -> Result<Config, Error> {
        let contents = match fs::read_to_string(file_path) {
            Ok(f) => f,
            Err(e) => Err(Error::from(e))?,
        };

        let data: Config = match serde_yaml::from_str(&contents) {
            Ok(d) => d,
            Err(e) => Err(Error::from(e))?,
        };

        Ok(data)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Chart {
    pub title: String,
    pub y_axis: String,
    pub x_axis: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Excel {
    pub worksheet_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Window {
    pub title: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct System {
    pub distance_threshold: f64,
    pub count_threshold: [usize; 3],
    pub warning_color: [String; 3],
}
