use std::{
    error::Error,
    io,
    net::{ToSocketAddrs, UdpSocket},
};

use s2n_quic::{Client, Server};
use serde::Serialize;
use serde_json::json;

use crate::json_bytes;

pub trait UDPBatchMessage {
    fn send_batch_message_to<A: ToSocketAddrs + Clone>(
        &self,
        buf: &[u8],
        addr: A,
    ) -> io::Result<usize>;
}

#[derive(Debug, Serialize)]
struct UDPMessage {
    body: Vec<i32>,
    message_type: u8,
    length: u16,
    index: u8,
    last_one: bool,
}

impl UDPBatchMessage for UdpSocket {
    fn send_batch_message_to<A: ToSocketAddrs + Clone>(
        &self,
        buf: &[u8],
        addr: A,
    ) -> io::Result<usize> {
        // todo!()
        let length = buf.len();
        let max = 1400;
        let mut arr: Vec<UDPMessage> = Vec::new();
        let mut start = 0;
        let mut remain: i32 = length.try_into().unwrap();
        while remain > 0 {
            let body: Vec<i32> = vec![];
            let is_last = false;
            if start + max >= length {
                let body = &buf[start..max].to_vec();
            } else {
                let body = &buf[start..length - 1].to_vec();
                let is_last = true;
            }
            // let b1 = body.to_owned();
            arr.push(UDPMessage {
                body: body.to_owned(),
                message_type: 0,
                length: 0,
                index: 0,
                // arr: todo!()     ,
                last_one: is_last,
            });
            remain = remain - max as i32;
            println!("remain:{:?}", remain)
        }
        // let socket = UdpSocket::bind("0.0.0.0:8888").unwrap();
        // socket.set_broadcast(true);
        for message in arr {
            let str = json!(message);
            let bytes = json_bytes(str.clone());
            let res: Result<_, _> = self.send_to(&bytes, addr.clone());
            match res {
                Ok(res) => {
                    println!("{:?}", res);
                }
                Err(err) => {
                    println!("{:?}", err);
                }
            }
        }
        Ok((length))
    }
}

/// NOTE: this certificate is to be used for demonstration purposes only!
pub static CERT_PEM: &str = include_str!("../cert.pem");
/// NOTE: this certificate is to be used for demonstration purposes only!
pub static KEY_PEM: &str = include_str!("../key.pem");

pub fn build_quic_server_and_client() -> Result<(Server, Client), Box<dyn Error>> {
    let mut server = Server::builder()
        .with_tls((CERT_PEM, KEY_PEM))?
        .with_io("127.0.0.1:4433")?
        .start()?;

    let mut client = Client::builder()
        .with_tls(CERT_PEM)?
        .with_io("0.0.0.0:0")?
        .start()?;

    Ok((server, client))
}
