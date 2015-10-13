var util = require('util');
var CompanionSocketClient = require('./CompanionSocketClient');
var routeIdGenerator = require('../routeIdGenerator');


var UIClient = function(opts) {
  CompanionSocketClient.call(this, opts);
};
util.inherits(UIClient, CompanionSocketClient);
var supr = CompanionSocketClient.prototype;


UIClient.prototype.setSocket = function(socket) {
  supr.setSocket.call(this, socket);

  // Add the socket listeners
  this.on('initBrowserRequest',   this.onInitBrowser.bind(this));
  this.on('run',                  this.onRun.bind(this));
  this.on('stop',                 this.onStop.bind(this));
  this.on('requestRunTargetList', this.onRequestRunTargetList.bind(this));
};

/**
 * @param  {Object}  message
 * @param  {String}  message.appPath
 */
UIClient.prototype.onInitBrowser = function(message) {
  if (!message.appPath) {
    this._error('missing_appPath', 'browser info response requires appPath');
    return;
  }

  this.send('initBrowserResponse', {
    routeId: routeIdGenerator.get(message.appPath),
    secret: this._server.secret
  });
};

/**
 * @param  {Object}  message
 * @param  {String}  message.runTargetUUID
 * @param  {String}  message.appPath
 */
UIClient.prototype.onRun = function(message) {
  var runTarget = this._server.getRunTarget(message.runTargetUUID);

  if (!runTarget) {
    this._error('invalid_runTargetUUID', 'No run target for: ' + message.runTargetUUID);
    return;
  }

  runTarget.run(this, message.appPath);
};

/**
 * @param  {Object}  message
 * @param  {String}  message.runTargetUUID
 */
UIClient.prototype.onStop = function(message) {
  var runTarget = this._server.getRunTarget(message.runTargetUUID);

  if (!runTarget) {
    this._error('invalid_runTargetUUID', 'No run target for: ' + message.runTargetUUID);
    return;
  }

  runTarget.stop(this);
};

/**
 * @param  {Object}  message
 */
UIClient.prototype.onRequestRunTargetList = function(message) {
  var runTargets = this._server.getRunTargets();
  var infos = [];
  runTargets.forEach(function(client) {
    infos.push(client.toInfoObject());
  });

  this.send('runTargetList', {
    runTargets: infos
  });
};

UIClient.prototype.onDisconnect = function() {
  this._logger.log('UIClient disconnected');
  this._server.removeUIClient(this);
};

module.exports = UIClient;