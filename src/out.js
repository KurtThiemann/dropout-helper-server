export default function (prefix = null) {
    let log = console.log;
    let error = console.error;

    /**
     * Get string representation of current date
     *
     * @param {Date|null} date
     * @returns {string}
     */
    function dateString(date = null) {
        return '[' + (date || new Date()).toLocaleString() + ']';
    }

    /**
     * Log something
     *
     * @param {Function} logFn - Console log function to use
     * @param args
     */
    function out(logFn, ...args) {
        let data = [dateString()];
        if(prefix) {
            data.push(`[${prefix}]`);
        }
        data.push(...args);

        logFn.apply(console, data);
    }

    console.log = function (...args) {
        out(log, ...args);
    };

    console.error = function (...args) {
        out(error, ...args);
    };

    console.debug = function (...args) {
        if (process.env.DEBUG) {
            out(log, ...args);
        }
    };
};
