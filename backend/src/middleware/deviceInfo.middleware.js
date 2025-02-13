import * as UAParserModule from 'ua-parser-js';

const UAParser = UAParserModule.default || UAParserModule;

export const parseDeviceInfo = (req, res, next) => {
    try {
        const userAgent = req.headers['user-agent'] || '';
        
        // Simple user agent parsing without external library
        const deviceInfo = {
            browser: 'Unknown',
            os: 'Unknown',
            device: 'Unknown',
            userAgent: userAgent
        };

        // Basic browser detection
        if (userAgent) {
            if (userAgent.includes('Chrome')) {
                deviceInfo.browser = 'Chrome';
            } else if (userAgent.includes('Firefox')) {
                deviceInfo.browser = 'Firefox';
            } else if (userAgent.includes('Safari')) {
                deviceInfo.browser = 'Safari';
            } else if (userAgent.includes('Edge')) {
                deviceInfo.browser = 'Edge';
            } else if (userAgent.includes('MSIE') || userAgent.includes('Trident/')) {
                deviceInfo.browser = 'Internet Explorer';
            }

            // Basic OS detection
            if (userAgent.includes('Windows')) {
                deviceInfo.os = 'Windows';
            } else if (userAgent.includes('Mac OS X')) {
                deviceInfo.os = 'macOS';
            } else if (userAgent.includes('Linux')) {
                deviceInfo.os = 'Linux';
            } else if (userAgent.includes('Android')) {
                deviceInfo.os = 'Android';
            } else if (userAgent.includes('iOS')) {
                deviceInfo.os = 'iOS';
            }

            // Basic device type detection
            if (userAgent.includes('Mobile')) {
                deviceInfo.device = 'Mobile';
            } else if (userAgent.includes('Tablet')) {
                deviceInfo.device = 'Tablet';
            } else {
                deviceInfo.device = 'Desktop';
            }
        }

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
