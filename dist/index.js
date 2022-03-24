/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/githubParams.js":
/*!*****************************!*\
  !*** ./src/githubParams.js ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

const core = __webpack_require__(/*! @actions/core */ "@actions/core");
const github = __webpack_require__(/*! @actions/github */ "@actions/github");

function extractGithubParams() {
  const pullRequest = github.context.payload.pull_request;
  const { draft, merged } = pullRequest;

  const statusKey = merged
    ? "merged"
    : draft
    ? "draft"
    : github.context.payload.action;

  const status = core.getInput(statusKey, { required: false });

  const databaseId = core.getInput("database-id", { required: true });

  const prProperty =
    core.getInput("pr-property", { required: false }) || "PR URL";

  const statusProperty =
    core.getInput("status-property", { required: false }) || "Status";

  if (!status) {
    core.info(
      `The status ${statusKey} is not mapped with a value in the action definition. Hence, the task update body does not contain a status update`
    );
  }

  return {
    metadata: {
      statusKey: statusKey,
    },
    pullRequest: {
      href: pullRequest.html_url,
      status: status,
    },
    notionProperties: {
      prProperty: prProperty,
      status: statusProperty,
    },
  };
}

module.exports = { extractParams: extractGithubParams };


/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

const core = __webpack_require__(/*! @actions/core */ "@actions/core");
const github = __webpack_require__(/*! @actions/github */ "@actions/github");
const { Client } = __webpack_require__(/*! @notionhq/client */ "@notionhq/client");
const { extractParams } = __webpack_require__(/*! ./githubParams */ "./src/githubParams.js");

async function main() {
  const params = extractParams();
  const notion = new Client({
    auth: process.env.NOTION_BOT_SECRET_KEY,
  });

  try {
    const pages = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      archived: false,
      filter: {
        property: params.notionProperties.prProperty,
        text: {
          contains: params.pullRequest.href,
        },
      },
    });

    const [page] = pages.results;

    await notion.pages.update({
      page_id: page.id,
      properties: params.pullRequest.status
        ? {
            [params.notionProperties.status]: {
              name: params.pullRequest.status,
            },
          }
        : {},
    });
  } catch (error) {
    core.setFailed(error);
  }

  core.info("Notion task updated!");
}

main().catch((err) => core.error(err.toString()));


/***/ }),

/***/ "@actions/core":
/*!********************************!*\
  !*** external "@actions/core" ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("@actions/core");

/***/ }),

/***/ "@actions/github":
/*!**********************************!*\
  !*** external "@actions/github" ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("@actions/github");

/***/ }),

/***/ "@notionhq/client":
/*!***********************************!*\
  !*** external "@notionhq/client" ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("@notionhq/client");

/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vc3JjL2dpdGh1YlBhcmFtcy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vL2V4dGVybmFsIFwiQGFjdGlvbnMvY29yZVwiIiwid2VicGFjazovLy9leHRlcm5hbCBcIkBhY3Rpb25zL2dpdGh1YlwiIiwid2VicGFjazovLy9leHRlcm5hbCBcIkBub3Rpb25ocS9jbGllbnRcIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO1FBQUE7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7OztRQUdBO1FBQ0E7O1FBRUE7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQSwwQ0FBMEMsZ0NBQWdDO1FBQzFFO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0Esd0RBQXdELGtCQUFrQjtRQUMxRTtRQUNBLGlEQUFpRCxjQUFjO1FBQy9EOztRQUVBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQSx5Q0FBeUMsaUNBQWlDO1FBQzFFLGdIQUFnSCxtQkFBbUIsRUFBRTtRQUNySTtRQUNBOztRQUVBO1FBQ0E7UUFDQTtRQUNBLDJCQUEyQiwwQkFBMEIsRUFBRTtRQUN2RCxpQ0FBaUMsZUFBZTtRQUNoRDtRQUNBO1FBQ0E7O1FBRUE7UUFDQSxzREFBc0QsK0RBQStEOztRQUVySDtRQUNBOzs7UUFHQTtRQUNBOzs7Ozs7Ozs7Ozs7QUNsRkEsYUFBYSxtQkFBTyxDQUFDLG9DQUFlO0FBQ3BDLGVBQWUsbUJBQU8sQ0FBQyx3Q0FBaUI7O0FBRXhDO0FBQ0E7QUFDQSxTQUFTLGdCQUFnQjs7QUFFekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSwyQ0FBMkMsa0JBQWtCOztBQUU3RCxtREFBbUQsaUJBQWlCOztBQUVwRTtBQUNBLGtDQUFrQyxrQkFBa0I7O0FBRXBEO0FBQ0Esc0NBQXNDLGtCQUFrQjs7QUFFeEQ7QUFDQTtBQUNBLG9CQUFvQixVQUFVO0FBQzlCO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTs7QUFFQSxrQkFBa0I7Ozs7Ozs7Ozs7OztBQzVDbEIsYUFBYSxtQkFBTyxDQUFDLG9DQUFlO0FBQ3BDLGVBQWUsbUJBQU8sQ0FBQyx3Q0FBaUI7QUFDeEMsT0FBTyxTQUFTLEdBQUcsbUJBQU8sQ0FBQywwQ0FBa0I7QUFDN0MsT0FBTyxnQkFBZ0IsR0FBRyxtQkFBTyxDQUFDLDZDQUFnQjs7QUFFbEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1QsT0FBTztBQUNQLEtBQUs7O0FBRUw7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0EsWUFBWTtBQUNaLEtBQUs7QUFDTCxHQUFHO0FBQ0g7QUFDQTs7QUFFQTtBQUNBOztBQUVBOzs7Ozs7Ozs7Ozs7QUMxQ0EsMEM7Ozs7Ozs7Ozs7O0FDQUEsNEM7Ozs7Ozs7Ozs7O0FDQUEsNkMiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBnZXR0ZXIgfSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uciA9IGZ1bmN0aW9uKGV4cG9ydHMpIHtcbiBcdFx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG4gXHRcdH1cbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbiBcdH07XG5cbiBcdC8vIGNyZWF0ZSBhIGZha2UgbmFtZXNwYWNlIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDE6IHZhbHVlIGlzIGEgbW9kdWxlIGlkLCByZXF1aXJlIGl0XG4gXHQvLyBtb2RlICYgMjogbWVyZ2UgYWxsIHByb3BlcnRpZXMgb2YgdmFsdWUgaW50byB0aGUgbnNcbiBcdC8vIG1vZGUgJiA0OiByZXR1cm4gdmFsdWUgd2hlbiBhbHJlYWR5IG5zIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDh8MTogYmVoYXZlIGxpa2UgcmVxdWlyZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy50ID0gZnVuY3Rpb24odmFsdWUsIG1vZGUpIHtcbiBcdFx0aWYobW9kZSAmIDEpIHZhbHVlID0gX193ZWJwYWNrX3JlcXVpcmVfXyh2YWx1ZSk7XG4gXHRcdGlmKG1vZGUgJiA4KSByZXR1cm4gdmFsdWU7XG4gXHRcdGlmKChtb2RlICYgNCkgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAmJiB2YWx1ZS5fX2VzTW9kdWxlKSByZXR1cm4gdmFsdWU7XG4gXHRcdHZhciBucyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18ucihucyk7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShucywgJ2RlZmF1bHQnLCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiB2YWx1ZSB9KTtcbiBcdFx0aWYobW9kZSAmIDIgJiYgdHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSBmb3IodmFyIGtleSBpbiB2YWx1ZSkgX193ZWJwYWNrX3JlcXVpcmVfXy5kKG5zLCBrZXksIGZ1bmN0aW9uKGtleSkgeyByZXR1cm4gdmFsdWVba2V5XTsgfS5iaW5kKG51bGwsIGtleSkpO1xuIFx0XHRyZXR1cm4gbnM7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gXCIuL3NyYy9pbmRleC5qc1wiKTtcbiIsImNvbnN0IGNvcmUgPSByZXF1aXJlKFwiQGFjdGlvbnMvY29yZVwiKTtcbmNvbnN0IGdpdGh1YiA9IHJlcXVpcmUoXCJAYWN0aW9ucy9naXRodWJcIik7XG5cbmZ1bmN0aW9uIGV4dHJhY3RHaXRodWJQYXJhbXMoKSB7XG4gIGNvbnN0IHB1bGxSZXF1ZXN0ID0gZ2l0aHViLmNvbnRleHQucGF5bG9hZC5wdWxsX3JlcXVlc3Q7XG4gIGNvbnN0IHsgZHJhZnQsIG1lcmdlZCB9ID0gcHVsbFJlcXVlc3Q7XG5cbiAgY29uc3Qgc3RhdHVzS2V5ID0gbWVyZ2VkXG4gICAgPyBcIm1lcmdlZFwiXG4gICAgOiBkcmFmdFxuICAgID8gXCJkcmFmdFwiXG4gICAgOiBnaXRodWIuY29udGV4dC5wYXlsb2FkLmFjdGlvbjtcblxuICBjb25zdCBzdGF0dXMgPSBjb3JlLmdldElucHV0KHN0YXR1c0tleSwgeyByZXF1aXJlZDogZmFsc2UgfSk7XG5cbiAgY29uc3QgZGF0YWJhc2VJZCA9IGNvcmUuZ2V0SW5wdXQoXCJkYXRhYmFzZS1pZFwiLCB7IHJlcXVpcmVkOiB0cnVlIH0pO1xuXG4gIGNvbnN0IHByUHJvcGVydHkgPVxuICAgIGNvcmUuZ2V0SW5wdXQoXCJwci1wcm9wZXJ0eVwiLCB7IHJlcXVpcmVkOiBmYWxzZSB9KSB8fCBcIlBSIFVSTFwiO1xuXG4gIGNvbnN0IHN0YXR1c1Byb3BlcnR5ID1cbiAgICBjb3JlLmdldElucHV0KFwic3RhdHVzLXByb3BlcnR5XCIsIHsgcmVxdWlyZWQ6IGZhbHNlIH0pIHx8IFwiU3RhdHVzXCI7XG5cbiAgaWYgKCFzdGF0dXMpIHtcbiAgICBjb3JlLmluZm8oXG4gICAgICBgVGhlIHN0YXR1cyAke3N0YXR1c0tleX0gaXMgbm90IG1hcHBlZCB3aXRoIGEgdmFsdWUgaW4gdGhlIGFjdGlvbiBkZWZpbml0aW9uLiBIZW5jZSwgdGhlIHRhc2sgdXBkYXRlIGJvZHkgZG9lcyBub3QgY29udGFpbiBhIHN0YXR1cyB1cGRhdGVgXG4gICAgKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgbWV0YWRhdGE6IHtcbiAgICAgIHN0YXR1c0tleTogc3RhdHVzS2V5LFxuICAgIH0sXG4gICAgcHVsbFJlcXVlc3Q6IHtcbiAgICAgIGhyZWY6IHB1bGxSZXF1ZXN0Lmh0bWxfdXJsLFxuICAgICAgc3RhdHVzOiBzdGF0dXMsXG4gICAgfSxcbiAgICBub3Rpb25Qcm9wZXJ0aWVzOiB7XG4gICAgICBwclByb3BlcnR5OiBwclByb3BlcnR5LFxuICAgICAgc3RhdHVzOiBzdGF0dXNQcm9wZXJ0eSxcbiAgICB9LFxuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHsgZXh0cmFjdFBhcmFtczogZXh0cmFjdEdpdGh1YlBhcmFtcyB9O1xuIiwiY29uc3QgY29yZSA9IHJlcXVpcmUoXCJAYWN0aW9ucy9jb3JlXCIpO1xuY29uc3QgZ2l0aHViID0gcmVxdWlyZShcIkBhY3Rpb25zL2dpdGh1YlwiKTtcbmNvbnN0IHsgQ2xpZW50IH0gPSByZXF1aXJlKFwiQG5vdGlvbmhxL2NsaWVudFwiKTtcbmNvbnN0IHsgZXh0cmFjdFBhcmFtcyB9ID0gcmVxdWlyZShcIi4vZ2l0aHViUGFyYW1zXCIpO1xuXG5hc3luYyBmdW5jdGlvbiBtYWluKCkge1xuICBjb25zdCBwYXJhbXMgPSBleHRyYWN0UGFyYW1zKCk7XG4gIGNvbnN0IG5vdGlvbiA9IG5ldyBDbGllbnQoe1xuICAgIGF1dGg6IHByb2Nlc3MuZW52Lk5PVElPTl9CT1RfU0VDUkVUX0tFWSxcbiAgfSk7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBwYWdlcyA9IGF3YWl0IG5vdGlvbi5kYXRhYmFzZXMucXVlcnkoe1xuICAgICAgZGF0YWJhc2VfaWQ6IHByb2Nlc3MuZW52Lk5PVElPTl9EQVRBQkFTRV9JRCxcbiAgICAgIGFyY2hpdmVkOiBmYWxzZSxcbiAgICAgIGZpbHRlcjoge1xuICAgICAgICBwcm9wZXJ0eTogcGFyYW1zLm5vdGlvblByb3BlcnRpZXMucHJQcm9wZXJ0eSxcbiAgICAgICAgdGV4dDoge1xuICAgICAgICAgIGNvbnRhaW5zOiBwYXJhbXMucHVsbFJlcXVlc3QuaHJlZixcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBbcGFnZV0gPSBwYWdlcy5yZXN1bHRzO1xuXG4gICAgYXdhaXQgbm90aW9uLnBhZ2VzLnVwZGF0ZSh7XG4gICAgICBwYWdlX2lkOiBwYWdlLmlkLFxuICAgICAgcHJvcGVydGllczogcGFyYW1zLnB1bGxSZXF1ZXN0LnN0YXR1c1xuICAgICAgICA/IHtcbiAgICAgICAgICAgIFtwYXJhbXMubm90aW9uUHJvcGVydGllcy5zdGF0dXNdOiB7XG4gICAgICAgICAgICAgIG5hbWU6IHBhcmFtcy5wdWxsUmVxdWVzdC5zdGF0dXMsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH1cbiAgICAgICAgOiB7fSxcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb3JlLnNldEZhaWxlZChlcnJvcik7XG4gIH1cblxuICBjb3JlLmluZm8oXCJOb3Rpb24gdGFzayB1cGRhdGVkIVwiKTtcbn1cblxubWFpbigpLmNhdGNoKChlcnIpID0+IGNvcmUuZXJyb3IoZXJyLnRvU3RyaW5nKCkpKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIkBhY3Rpb25zL2NvcmVcIik7IiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiQGFjdGlvbnMvZ2l0aHViXCIpOyIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIkBub3Rpb25ocS9jbGllbnRcIik7Il0sInNvdXJjZVJvb3QiOiIifQ==