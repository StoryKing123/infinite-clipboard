import axios from "axios";

const request = axios.create({
  baseURL:import.meta.env.VITE_API_URL,
  //   baseURL: "http://localhost:3000",
});

export default request;
