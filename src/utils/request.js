"use strict";

require("core-js/modules/web.dom-collections.iterator");

require("core-js/modules/web.url");

var crypto = require('crypto-js');

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = void 0;

var _core = require("./core");

var _path = _interopRequireDefault(require("./path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function request(url, type, withCredentials, headers) {
	var supportsURL = typeof window != "undefined" ? window.URL : false; // TODO: fallback for url if window isn't defined

	var BLOB_RESPONSE = supportsURL ? "blob" : "arraybuffer";
	var deferred = new _core.defer();
	var xhr = new XMLHttpRequest(); //-- Check from PDF.js:
	//   https://github.com/mozilla/pdf.js/blob/master/web/compatibility.js

	var xhrPrototype = XMLHttpRequest.prototype;
	var header;

	if (!("overrideMimeType" in xhrPrototype)) {
		// IE10 might have response, but not overrideMimeType
		Object.defineProperty(xhrPrototype, "overrideMimeType", {
			value: function xmlHttpRequestOverrideMimeType() {}
		});
	}

	if (withCredentials) {
		xhr.withCredentials = true;
	}

	xhr.onreadystatechange = handler;
	xhr.onerror = err;
	xhr.open("GET", url, true);

	for (header in headers) {
		xhr.setRequestHeader(header, headers[header]);
	}

	if (type == "json") {
		xhr.setRequestHeader("Accept", "application/json");
	} // If type isn"t set, determine it from the file extension


	if (!type) {
		type = new _path.default(url).extension;
	}

	if (type == "blob") {
		xhr.responseType = BLOB_RESPONSE;
	}

  	xhr.setRequestHeader('x-authorization', localStorage.getItem('local_jwt'));

	if ((0, _core.isXml)(type)) {
		// xhr.responseType = "document";
		xhr.overrideMimeType("text/xml"); // for OPF parsing
	}

	if (type == "xhtml") {// xhr.responseType = "document";
	}

	if (type == "html" || type == "htm") {// xhr.responseType = "document";
	}

	if (type == "binary") {
		xhr.responseType = "arraybuffer";
	}

	xhr.send();

	function err(e) {
		deferred.reject(e);
	}

	function handler() {
		var algorithm = 'aes-256-ctr';
		var password = 'd6F3Efeq';
		if (this.readyState === XMLHttpRequest.DONE) {
			var responseXML = false;

			if (this.responseType === "" || this.responseType === "document") {
				responseXML = this.responseXML;
			}

			if (this.status === 200 || this.status === 0 || responseXML) {
				//-- Firefox is reporting 0 for blob urls
				var r;

				if (!this.response && !responseXML) {
					deferred.reject({
						status: this.status,
						message: "Empty Response",
						stack: new Error().stack
					});
					return deferred.promise;
				}
					
				//const response = Buffer.from(this.response, 'base64').toString();
				
				var bytes  = crypto.AES.decrypt(this.response, 'RWxDaG9yaXpvRW5MYUN1ZXZhMTIz');
				var desencriptado = bytes.toString(crypto.enc.Utf8);

				if (this.status === 403) {
					deferred.reject({
						status: this.status,
						response: desencriptado,
						message: "Forbidden",
						stack: new Error().stack
					});
					return deferred.promise;
				}

				if (responseXML) {
					r = this.responseXML;
				} else if ((0, _core.isXml)(type)) {
					// xhr.overrideMimeType("text/xml"); // for OPF parsing
					// If this.responseXML wasn't set, try to parse using a DOMParser from text
					r = (0, _core.parse)(desencriptado, "text/xml");
				} else if (type == "xhtml") {
					r = (0, _core.parse)(desencriptado, "application/xhtml+xml");
				} else if (type == "html" || type == "htm") {
					r = (0, _core.parse)(desencriptado, "text/html");
				} else if (type == "json") {
					r = JSON.parse(desencriptado);
				} else if (type == "blob") {
					if (supportsURL) {
						r = desencriptado;
					} else {
						//-- Safari doesn't support responseType blob, so create a blob from arraybuffer
						r = new Blob([desencriptado]);
					}
				} else {
					r = desencriptado;
				}

				deferred.resolve(r);
			} else {
				deferred.reject({
					status: this.status,
					message: desencriptado,
					stack: new Error().stack
				});
			}
		}
	}

	return deferred.promise;
}

var _default = request;
exports.default = _default;
