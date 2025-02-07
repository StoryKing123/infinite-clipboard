use enigo::Keyboard;
use enigo::Settings;
use enigo::{
    Direction::{Click, Press, Release},
    Enigo, Key,
};

#[tauri::command]
pub fn sendText(name: &str) -> String {
    let mut enigo = Enigo::new(&Settings::default()).unwrap();
    enigo.text(name).unwrap();
    "success".to_string()
}

#[tauri::command]
pub fn paste() -> String {
    let mut enigo = Enigo::new(&Settings::default()).unwrap();

    // 跨平台处理
    if cfg!(target_os = "macos") {
        enigo.key(Key::Meta, Press).unwrap();
        enigo.key(Key::Unicode('v'), Click).unwrap();
        enigo.key(Key::Meta, Release).unwrap();
        // enigo.key_down(Key::Meta);
        // enigo.key_click(Key::Unicode('v'));
        // enigo.key_up(Key::Meta);
    } else {
        enigo.key(Key::Control, Press).unwrap();
        enigo.key(Key::Unicode('v'), Click).unwrap();
        enigo.key(Key::Control, Release).unwrap();
        // enigo.key_down(Key::Control);
        // enigo.key_click(Key::Unicode('v'));
        // enigo.key_up(Key::Control);
    }
    String::from("ok")
}
