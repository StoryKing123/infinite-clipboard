use enigo::Enigo;
use enigo::Keyboard;
use enigo::Settings;

#[tauri::command]
pub fn sendText(name: &str) -> String {
    let mut enigo = Enigo::new(&Settings::default()).unwrap();
    enigo.text(name).unwrap();
    "success".to_string()
}