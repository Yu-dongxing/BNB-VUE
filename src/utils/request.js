import axios from "axios";
import router from "../router"; // 必须引入路由，用于强制跳转

const DEFAULT_TIMEOUT = 10000;

const service = axios.create({
// baseURL: "http://127.0.0.1:8080/api",
  baseURL: "https://api.airwordaion.com/api",
  timeout: DEFAULT_TIMEOUT,
});

/**
 * 1. 请求拦截器：将 Token 放入 Header
 */
service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('Account-token');
    if (token) {
      // 这里的 Header Key 必须和后端 sa-token.token-name 配置一致
      config.headers['Account-token'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * 2. 响应拦截器：处理 code 为 400 的登录失效情况
 */
service.interceptors.response.use(
  (response) => {
    // response.data 是后端返回的 Result 对象 { code, message, data }
    const res = response.data;

    // --- 核心逻辑：处理登录失效 ---
    // 你的后端 GlobalExceptionHandler 在 NotLoginException 时返回 code 400
    // 并且 message 包含 "请检查是否登录" 或 "Token" 等关键字
    if (res.code === 400) {
      const msg = res.message || "";
      if (msg.includes("登录") || msg.includes("Token") || msg.includes("认证")) {
        console.warn("身份验证失败，正在跳转登录页:", msg);
        handleLogout();
        return Promise.reject(new Error(msg));
      }
    }
    
    // 如果是普通的业务成功 (code: 200)
    return res;
  },
  (error) => {
    // 处理 HTTP 状态码错误 (如 401, 403, 500)
    if (error && error.response) {
      const { status } = error.response;
      if (status === 401 || status === 403) {
        handleLogout();
      }
    }

    if (error && error.code === "ECONNABORTED") {
      return Promise.reject(new Error("请求超时"));
    }

    return Promise.reject(error);
  }
);

/**
 * 退出登录清理逻辑
 */
function handleLogout() {
  // 1. 清除本地缓存的 Token
  localStorage.removeItem('Account-token');
  
  // 2. 跳转到登录页 (避免在登录页重复跳转)
  if (router.currentRoute.value.path !== '/login') {
    // 使用 replace 替换当前路由，防止按返回键回到已失效的页面
    router.replace('/login'); 
  }
}

export function request(config) {
  return service(config);
}

export const http = {
  get(url, params, config) {
    return service({ url, method: "get", params, ...config });
  },
  post(url, data, config) {
    return service({ url, method: "post", data, ...config });
  },
  put(url, data, config) {
    return service({ url, method: "put", data, ...config });
  },
  delete(url, params, config) {
    return service({ url, method: "delete", params, ...config });
  },
};

export default request;