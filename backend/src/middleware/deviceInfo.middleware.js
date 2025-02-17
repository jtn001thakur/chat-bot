import * as UAParserModule from 'ua-parser-js';

const UAParser = UAParserModule.default || UAParserModule;

export const parseDeviceInfo = (req, res, next) => {
  try {
    const userAgent = req.headers['user-agent'] || '';
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
        
    const deviceInfo = {
      browser: result.browser.name || 'Unknown',
      browserVersion: result.browser.version || 'Unknown',
      os: result.os.name || 'Unknown',
      osVersion: result.os.version || 'Unknown',
      device: result.device.type || 'Unknown',
      vendor: result.device.vendor || 'Unknown',
      model: result.device.model || 'Unknown',
      userAgent: userAgent
    };

    req.deviceInfo = deviceInfo;
    next();
  } catch (error) {
    console.error('Device info parsing error:', error);
    req.deviceInfo = {
      browser: 'Unknown',
      os: 'Unknown',
      device: 'Unknown',
      userAgent: req.headers['user-agent'] || ''
    };
    next();
  }
};

export default parseDeviceInfo;
