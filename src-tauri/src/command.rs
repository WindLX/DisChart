use crate::{
    model::{
        config::Config, distance_set::DistanceSet, point_set::PointSet, target::TargetPointId,
    },
    utils::{error::Error, tools::StateWrapper},
};
use std::{path::PathBuf, sync::Arc};

#[tauri::command]
pub async fn load_data(
    path: &str,
    worksheet_name: &str,
    state: tauri::State<'_, StateWrapper<Vec<PointSet>>>,
    path_state: tauri::State<'_, StateWrapper<PathBuf>>,
) -> Result<String, Error> {
    let data = PointSet::load(std::path::PathBuf::from(path), Arc::from(worksheet_name)).await?;
    let mut path_buf = path_state.get()?;
    match path_buf {
        Some(ref mut pb) => {
            if let Some(file_name) = PathBuf::from(path).file_name() {
                let file_name_str = file_name.to_string_lossy().to_string();
                pb.push("resources");
                pb.push("temp");
                if !std::path::Path::exists(&pb) {
                    match std::fs::create_dir(&pb) {
                        Ok(_) => {}
                        Err(error) => Err(Error::Io(error.to_string()))?,
                    }
                }
                pb.push(file_name_str);
                match std::fs::copy(path, pb) {
                    Ok(_) => {}
                    Err(error) => Err(Error::Io(error.to_string()))?,
                }
            } else {
                Err(Error::Load(String::from("Invalid File")))?
            }
        }
        None => Err(Error::Io(String::from("Failed to find *Resource* dir")))?,
    }
    state.set(data)?;
    Ok(String::from("Load Data Successfully!"))
}

#[tauri::command]
pub fn clear_data(
    data_state: tauri::State<'_, StateWrapper<Vec<PointSet>>>,
    id_state: tauri::State<'_, StateWrapper<TargetPointId>>,
    path_state: tauri::State<'_, StateWrapper<PathBuf>>,
) -> Result<String, Error> {
    data_state.clear()?;
    id_state.clear()?;
    let mut path_buf = path_state.get()?;
    match path_buf {
        Some(ref mut pb) => {
            pb.push("resources");
            pb.push("temp");
            if !std::path::Path::exists(&pb) {
                match std::fs::create_dir(&pb) {
                    Ok(_) => {}
                    Err(error) => Err(Error::Io(error.to_string()))?,
                }
            } else {
                let entries = match std::fs::read_dir(pb) {
                    Ok(e) => e,
                    Err(error) => Err(Error::Io(error.to_string()))?,
                };
                for entry in entries {
                    if let Ok(entry) = entry {
                        let path = entry.path();
                        if path.is_file() {
                            match std::fs::remove_file(path) {
                                Ok(_) => {}
                                Err(error) => Err(Error::Io(error.to_string()))?,
                            }
                        }
                    }
                }
            }
        }
        None => Err(Error::Io(String::from("Failed to find *Resource* dir")))?,
    }
    Ok(String::from("Clear Data Successfully!"))
}

#[tauri::command]
pub fn set_distance(
    main_id: String,
    sub_id: String,
    state: tauri::State<'_, StateWrapper<TargetPointId>>,
) -> Result<String, Error> {
    let target_data = TargetPointId::build(&main_id, &sub_id)?;
    state.set(target_data)?;
    Ok(String::from("Set Target Successfully!"))
}

#[tauri::command]
pub fn get_distance(
    distance_threshold: f64,
    is_3d: bool,
    data_state: tauri::State<'_, StateWrapper<Vec<PointSet>>>,
    id_state: tauri::State<'_, StateWrapper<TargetPointId>>,
) -> Result<Vec<DistanceSet>, Error> {
    let data = data_state.get()?;
    let id = id_state.get()?;
    match (data, id) {
        (Some(d), Some(ref i)) => {
            let temp = d
                .iter()
                .map(|dd| DistanceSet::new(dd, i, distance_threshold, is_3d))
                .collect::<Result<Vec<_>, Error>>()?;
            Ok(temp)
        }
        (None, Some(_)) => Err(Error::Load(String::from(
            "Data is empty, please load data file first",
        ))),
        (Some(_), None) => Err(Error::Load(String::from(
            "Target is empty, please select target first",
        ))),
        (None, None) => Err(Error::Load(String::from(
            "Data and Target are both empty, please load and select first",
        ))),
    }
}

#[tauri::command]
pub fn update_config(state: tauri::State<'_, StateWrapper<PathBuf>>) -> Result<Config, Error> {
    let mut path_buf = state.get()?;
    match path_buf {
        Some(ref mut pb) => {
            pb.push("resources");
            pb.push("settings.yml");
            Config::load(pb)
        }
        None => Err(Error::Io(String::from("Failed to find *Resource* dir")))?,
    }
}
