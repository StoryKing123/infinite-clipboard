import axios from "axios";

let token = ''
const refreshToken = () => {
  const str = localStorage.getItem('auth')
  if (str) {
    const auth = JSON.parse(str)
    token = auth.token

  }

}
refreshToken
const request = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
 
  //   baseURL: "http://localhost:3000",
});
// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 每次请求前检查并刷新token
    refreshToken();
    // 如果token存在，添加到请求头
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 处理401未授权错误
    if (error.response && error.response.status === 401) {
      // 清除本地存储的认证信息
      // localStorage.removeItem('auth');
      // 重定向到登录页面
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);



export default request;
