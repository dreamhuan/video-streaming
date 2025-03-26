// @ts-nocheck
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// ios 移动端vh有点毛病 见：https://juejin.cn/post/7096050514105729061
function setViewHeight() {
  var windowVH = window.innerHeight / 100;
  document.documentElement.style.setProperty("--vh", windowVH + "px");

  // 西瓜视频播放器在ipad端触屏得双击才换出控制信息，很怪，暂时解决方案是干掉ua让它觉得在pc，如果能接受就注释掉这行
  changeUAtoFixVideoPlayer();
}
var i = "orientationchange" in window ? "orientationchange" : "resize";
document.addEventListener("DOMContentLoaded", setViewHeight);
window.addEventListener(i, setViewHeight);


// 修改ua代码，来自 https://juejin.cn/post/7260371225091539005
function changeUAtoFixVideoPlayer() {
  function createProperty(value) {
    var _value = value;
    function _get() {
      return _value;
    }
    // 重写setter函数
    function _set(v) {
      _value = v;
    }
    return {
      get: _get,
      set: _set,
    };
  }

  /**
   * 给定对象，创建或替换它的可写属性
   * @param {Object} objBase  e.g. window
   * @param {String} objScopeName    e.g. "navigator"
   * @param {String} propName    e.g. "userAgent"
   * @param {Any} initValue (optional)   e.g. window.navigator.userAgent
   */
  function makePropertyWritable(objBase, objScopeName, propName, initValue) {
    let newProp, initObj;

    if (
      objBase &&
      objScopeName in objBase &&
      propName in objBase[objScopeName]
    ) {
      if (typeof initValue === "undefined") {
        initValue = objBase[objScopeName][propName];
      }
      newProp = createProperty(initValue);
      try {
        Object.defineProperty(objBase[objScopeName], propName, newProp);
      } catch (e) {
        initObj = {};
        initObj[propName] = newProp;
        try {
          objBase[objScopeName] = Object.create(objBase[objScopeName], initObj);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }

  makePropertyWritable(window, "navigator", "userAgent");
  // 阅读代码（https://github.com/bytedance/xgplayer/blob/6c4acca4d2ad6bba441aa045ca5e01d829fba111/packages/xgplayer/src/utils/sniffer.js#L78）发现ipad有个额外的platform判断条件，也一并干掉
  makePropertyWritable(window, "navigator", "platform");
  window.navigator.userAgent = "xxx";
  window.navigator.platform = "xxx";
}
