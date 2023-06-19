// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod command;
pub mod model;
pub mod utils;
use std::{
    path::PathBuf,
    sync::{Arc, Mutex},
};

use command::*;
use model::{point_set::PointSet, target::TargetPointId};
use tauri::Manager;
use utils::tools::StateWrapper;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let resource_dir = app.path_resolver().resource_dir();
            app.manage(StateWrapper::<PathBuf>(Arc::new(Mutex::new(resource_dir))));
            Ok(())
        })
        .manage(StateWrapper::<Vec<PointSet>>::default())
        .manage(StateWrapper::<TargetPointId>::default())
        .invoke_handler(tauri::generate_handler![
            load_data,
            clear_data,
            set_target,
            get_distance,
            update_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running dischart");
}
