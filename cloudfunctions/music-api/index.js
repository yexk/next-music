const netApi = require("NeteaseCloudMusicApi");
const ips = require("./ip.json");
const _ = require("lodash");

const fullKey = Object.keys(netApi).sort();
const customKey = [
  'custom_get_actions',
]

/**
 * 构造基础返回
 * @param isSdk
 * @param code
 * @param message
 * @param data
 * @param extend
 * @returns {{isBase64Encoded: boolean, headers: {}, body: {code: number, data: {}, message: string}, statusCode: number}|{code: number, data: {}, message: string}}
 */
function apiResponse(isSdk = false, code = 200, message = 'success', data = {}, extend = {}) {
  const body = {code, message, data, ...extend};
  if (!isSdk) {
    return {
      "isBase64Encoded": false,
      "statusCode": code,
      "headers": {},
      "body": body
    };
  } else {
    return body;
  }
}

/**
 * 随机一个中国IP
 * @return string
 */
function randomIp() {
  return ips[Math.floor(Math.random() * ips.length)]
}

/**
 *
 * @param event
 * @param context 重要参数不要暴露
 * @returns {Promise<{isBase64Encoded: boolean, headers: {}, body: {code: number, data: {}, message: string}, statusCode: number}|{code: number, data: {}, message: string}>}
 */
exports.main = async (event, context) => {
  // 区分是 Http 请求还是 cloudbase sdk 请求
  const isSdkRequest = !("requestContext" in event);
  if (!_.isEmpty(event)) {
    let data;
    let realIp;
    if (isSdkRequest) {
      data = event;
      realIp = randomIp();
    } else {
      const body = _.get(event, "body");
      data = body ? JSON.parse(body) : {};
      realIp = _.get(event, 'headers.x-real-ip');
      if (!realIp) realIp = randomIp();
    }

    let {action, params, cookie, debug, proxy} = data;
    if (!action) {
      return apiResponse(isSdkRequest, 500, 'action not found', {event, data, isSdkRequest});
    }
    action = action.toLowerCase().replace('/', '_');
    debug = !!debug;
    if (_.isEmpty(params)) {
      params = {};
    }
    if (_.isEmpty(cookie)) {
      cookie = {};
    }

    if (fullKey.includes(action) && netApi[action]) {
      try {
        const response = await netApi[action]({
          ...params,
          cookie,
          realIp,
          proxy
        });
        const extend = {}
        if (debug) {
          extend['debug'] = {event, response, realIp, params, cookie, proxy};
        }
        extend['cookie'] = response.cookie;
        if (response.status === 200) {
          const responseData = response.body;
          return apiResponse(isSdkRequest, responseData.code, responseData.message, responseData.data, extend);
        }
        return apiResponse(isSdkRequest, response.status, response.message, response.body, extend);
      } catch (error) {
        if (parseInt(error.body.code) === 301) error.body.msg = '需要登录';
        return apiResponse(isSdkRequest, error.body.code, error.body.msg, {}, {error});
      }
    } else if (customKey.includes(action)) {
      if (action === 'custom_get_actions') {
        return apiResponse(isSdkRequest, 200, 'success', [...customKey, ...fullKey].sort());
      }
    }
    return apiResponse(isSdkRequest, 500, 'action not found', {event, data, isSdkRequest});
  }

  return apiResponse(isSdkRequest, 500, 'event not found', {event, isSdkRequest});
};
