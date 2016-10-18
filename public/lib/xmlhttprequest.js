(function() {
  'use strict';
  /**
  * extend XMLHttpRequest
  * @param string method post or get request
  * @param stirng url address for request
  * @param integer timeout timeout for request
  * @param function callback for onloaded function
  * @param function callback for onprogress function
  */
  function xmlHttpRequest(method, url, timeout, callbackComplete, callbackProgress,callbackAbort,
  callbackTimeout,callbackError){
    this.method = method;
    this.url = url;
    this.timeout = timeout;
    this.startTime = null;
    this.endTime = null;
    this.bandwidth = null;
    this.latency = 0;
    this.id=null;
    this.prevTime = 0;
    this.prevLoad = 0;
    this.progressCount = 0;
    this.totalBytes = 0;
    this.callbackComplete = callbackComplete;
    this.callbackProgress = callbackProgress;
    this.callbackAbort = callbackAbort;
    this.callbackTimeout = callbackTimeout;
    this.callbackError = callbackError;
    this.requestTimeout;
  };
  /**
   * Initiate the request
   */
  xmlHttpRequest.prototype._initiateRequest = function(){
    if (this._request === null ||
       typeof this._request === 'undefined') {
       this._request = new XMLHttpRequest();
       // Handle lifecycle events on wrapped request
       this._request.onloadstart = this._handleLoadstart.bind(this);
       this._request.onload = this._handleLoad.bind(this);
       this._request.onabort = this._handleAbort.bind(this);
       this._request.timout = this._handleTimeout.bind(this);
       this.requestTimeout= setTimeout(this._request.abort.bind(this._request), this.timeout);
       this._request.onerror = this._handleError.bind(this);
       this._request.onreadystatechange = this._handleOnReadyStateChange.bind(this);
       if(this.method==='GET') {
          this._request.onprogress = this._handleOnProgressDownload.bind(this);
        }
        else{
          this._request.upload.onprogress = this._handleOnProgressUpload.bind(this);
        }
     }
  };
  /**
  * Execute the request
  */
    xmlHttpRequest.prototype.start = function(size, id) {
      this._initiateRequest();
      this.id = id;
      this.transferSize = size;
      this._request.open(this.method, this.url, true);
      this._request.timeout = this.timeout;
      if(this.method==='POST') {
        this._request.send(getRandomString(this.transferSize));
      }
      else{
        this._request.send(null);
      }
    };
  /**
  * Mark the start time of the request
  */
    xmlHttpRequest.prototype._handleLoadstart = function() {
      this.startTime = Date.now();
      this.prevTime = Date.now();
    };
  /**
  * Handle eror event
  */
  xmlHttpRequest.prototype._handleError = function() {
     var err = {
       statusText: this._request.statusText,
       status: this._request.status
     };
     this.callbackError(err);
   };
    /**
      * Handle the timeout event on the wrapped request
      */
     xmlHttpRequest.prototype._handleTimeout = function(response) {
       this.totalTime = this.endTime - this.startTime;
       var transferSizeMbs = (response.loaded * 8) / 1000000;
       var transferDurationSeconds = result.totalTime/1000;
       //package results
       var result = {};
       result.latency = this.totalTime;
       result.bandwidth = transferSizeMbs/transferDurationSeconds;
       result.id = this.id;
       this.callbackTimeout(result);
  };
    /**
      * Handle the abort event on the wrapped request
      */
     xmlHttpRequest.prototype._handleAbort = function(response) {
       clearTimeout(this.requestTimeout);
       this.totalTime = this.endTime - this.startTime;
       var transferSizeMbs = (response.loaded * 8) / 1000000;
       var transferDurationSeconds = result.totalTime/1000;
       //package results
       var result = {};
       result.latency = this.totalTime;
       result.bandwidth = transferSizeMbs/transferDurationSeconds;
       result.id = this.id;
       this.callbackAbort(result);

  };
  /**
    * Close the request explicitly
    */
  xmlHttpRequest.prototype.close = function () {
      this._request.abort();
  };

  /**
   * Handle the load event on the wrapped request
   */
  xmlHttpRequest.prototype._handleOnReadyStateChange = function () {

    if(this._request.readyState === 4 && this._request.status === 200) {
              var result = {};
              result.totalTime = Date.now() - this.startTime;
              result.id = this.id;
              if(this.method==='POST'){
                var transferSizeMbs = (this.transferSize * 8) / 1000000;
                var transferDurationSeconds = result.totalTime/1000;
                result.bandwidth = transferSizeMbs/transferDurationSeconds;
                this.callbackComplete(result);
                return;
              }

          }
    if(this._request.status > 399){
      var err = {
        statusText: this._request.statusText,
        status: this._request.status
      };
      this.callbackError(err);
      return;
    }
  };

  /**
   * Handle the load event on the wrapped request
   */
  xmlHttpRequest.prototype._handleLoad = function (response) {
      this.totalTime = Date.now() - this.startTime;
      var result = {};
      result.time = this.totalTime;
      this.totalBytes += response.loaded;
      result.bandwidth = ((response.loaded * 8 / 1000000) / (this.totalTime / 1000));
      result.id = this.id;
      if(this.method==='GET'){
        this.callbackComplete(result);
      }
  };

  /**
    * Handle onProgress
    */
   xmlHttpRequest.prototype._handleOnProgressDownload = function (response) {

     if (this.progressCount > 0) {
         if ((response.timeStamp - this.prevTime > 100)) {
           this.totalBytes += response.loaded;
           var result = {};
           result.duration = ((response.timeStamp - this.prevTime) / 1000);
           result.bandwidth = ((response.loaded - this.prevLoad) * 8 / 1000000) / result.duration;
           result.id = this.id;

           //this.callbackProgress(result);
           //this.prevTime = response.timeStamp;
           //this.prevLoad = response.loaded;
         }
     }
     //increment onProgressEvent
     this.progressCount++;

   };

   /**
     * Handle onProgress
     */
    xmlHttpRequest.prototype._handleOnProgressUpload = function (response) {

      if (this.progressCount > 0) {
            var result = {};
            this.totalTime = Date.now() - this.prevTime;
            //only report value is
            if(this.totalTime>0){
            result.totalTime = this.totalTime;
            var transferSizeMbs = (response.loaded * 8) / 1000000;
            var transferDurationSeconds = result.totalTime/1000;
            result.bandwidth = transferSizeMbs/transferDurationSeconds;
            result.id = this.id;
          }
            //this.callbackProgress(result);
            //this.prevTime = response.timeStamp;
            //this.prevLoad = response.loaded;

      }
      this.progressCount++;

    };

    function getRandomString (size) {
      var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~!@#$%^&*()_+`-=[]\{}|;:,./<>?', //random data prevents gzip effect
        result = '';
      for (var index = 0; index < size; index++) {
        var randomChars = Math.floor(Math.random() * chars.length)
        result += chars.charAt(randomChars);
      }
      return result;
    }



window.xmlHttpRequest = xmlHttpRequest;

  })();
