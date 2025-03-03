use crate::KeySecretBytes;
use base64::{prelude::BASE64_STANDARD, Engine};
use rand_core::OsRng;
use x25519_dalek::{EphemeralSecret, PublicKey, SharedSecret, StaticSecret};

#[tauri::command]
pub fn generate_x25519_key_secret() -> KeySecretBytes {
    let secret = StaticSecret::random_from_rng(OsRng);
    let public_key = PublicKey::from(&secret);

    let secret_bytes = secret.as_bytes();
    let publilc_key_bytes = public_key.as_bytes();

    let res = KeySecretBytes {
        secret: BASE64_STANDARD.encode(*secret_bytes),
        key: BASE64_STANDARD.encode(*publilc_key_bytes) ,
    };
    return res;
}

#[tauri::command]
pub fn calc_shared_secret(public_key_bytes: [u8; 32], secret_bytes: [u8; 32]) -> String {
    let secret = StaticSecret::from(public_key_bytes);
    let public_key = PublicKey::from(public_key_bytes);

    let shared_secret = secret.diffie_hellman(&public_key);
    let shared_secret_bytes = shared_secret.to_bytes();
    let shared_secret_base64 = BASE64_STANDARD.encode(shared_secret_bytes);
    return shared_secret_base64;
}
