import request from "../utils/request.js";

// 分页获取配置项
export function getConfigPage(params) {
  return request({
    url: "/admin/system/config/page",
    method: "get",
    params,
  });
}

// 保存或更新配置
export function saveOrUpdateConfig(data) {
  return request({
    url: "/admin/system/config/save",
    method: "post",
    data,
  });
}

// 删除配置项
export function deleteConfig(id) {
  return request({
    url: `/admin/system/config/delete/${id}`,
    method: "get",
  });
}

// 根据 Key 获取具体值
export function getConfigValue(key) {
  return request({
    url: "/admin/system/config/val",
    method: "get",
    params: { key },
  });
}