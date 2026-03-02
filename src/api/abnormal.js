import request from "../utils/request.js";

/**
 * 分页查询异常处理数据
 * @param {Object} data AbnormalQueryDTO
 */
export function getAbnormalList(data) {
  return request({
    url: "/admin/abnormal/list",
    method: "post",
    data,
  });
}

// 这里的重试逻辑虽然后端 Controller 还没写，但可以预留
export function retryAbnormal(id) {
  return request({
    url: `/admin/abnormal/retry/${id}`,
    method: "post"
  });
}


/**
 * 执行人工处理成功回调
 * @param {String} url 动态获取的路由地址
 * @param {Number} dataId 记录的主键ID
 */
export function postManualSuccess(url, dataId) {
  return request({
    url: url, // 使用后端返回的动态路径
    method: "post", // 通常此类操作使用 post
    params: { dataId } // 对应后端的 @RequestParam("dataId")
  });
}