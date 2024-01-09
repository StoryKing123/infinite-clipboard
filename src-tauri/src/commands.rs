use serde_json::Error;

use crate::{AppState, Config};

#[tauri::command]
pub fn update_config(config_str: &str, state: tauri::State<AppState>) {
    println!("{:?}", config_str);
    let config: Config = serde_json::from_str(config_str).unwrap();

    *state.config.lock().unwrap() = Some(config);

    ()
}
