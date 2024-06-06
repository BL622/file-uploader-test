const moment = require('moment')

const ANSI_RESET = "\x1b[0m";

const ANSI_COLORS = {
    purple: ["\x1b[35m", ANSI_RESET],
    cyan: ["\x1b[36m", ANSI_RESET],
    yellow: ["\x1b[33m", ANSI_RESET],
    brightBlack: ["\x1b[90m", ANSI_RESET],
    brightMagenta: ["\x1b[95m", ANSI_RESET],
    brightGreen: ["\x1b[92m", ANSI_RESET],
    brightYellow: ["\x1b[93m", ANSI_RESET],
    brightCyan: ["\x1b[96m", ANSI_RESET],
    brightBlue: ["\x1b[94m", ANSI_RESET],
    red: ["\x1b[31m", ANSI_RESET],
    green: ["\x1b[32m", ANSI_RESET],
    blue: ["\x1b[34m", ANSI_RESET],
    white: ["\x1b[37m", ANSI_RESET],
    black: ["\x1b[30m", ANSI_RESET],
    brightWhite: ["\x1b[97m", ANSI_RESET],
    whiteBGblackFG: ["\x1b[47m\x1b[30m", ANSI_RESET]
};

function log(level, message){
    if (level > 4) return
    if (process.env.DEBUG_LEVEL < level) return

    const log_colors = [ANSI_COLORS.red, ANSI_COLORS.brightBlack, ANSI_COLORS.cyan, ANSI_COLORS.yellow, ANSI_COLORS.green, ANSI_COLORS.whiteBGblackFG]
    process.stdout.write(log_colors.at(level)[0] + "[" + moment().format('YYYY-MM-DD hh:mm:ss') + "]: " + ANSI_RESET)

    const formatted = formatMessage(message, 0)
    console.log(formatted)
}

function formatMessage(message, depth) {
    if (Array.isArray(message)) {
        return formatArray(message, depth);
    } else if (typeof message === 'object' && message !== null) {
        return formatObject(message, depth);
    } else {
        return message;
    }
}

function formatArray(arr, depth) {
    if (arr.length === 0) return '[]';

    const colorIndex = depth % Object.keys(ANSI_COLORS).length;
    const [startColor, endColor] = ANSI_COLORS[Object.keys(ANSI_COLORS)[colorIndex]];

    const formattedItems = arr.map((item, index) => `${depthTabs(depth + 1)}${startColor}"${index}":${endColor} ${formatMessage(item, depth + 1)}`);

    return `${startColor}[${endColor}\n${formattedItems.join(',\n')}\n${depthTabs(depth)}${startColor}]${endColor}`;
}

function formatObject(obj, depth) {
    if (Object.keys(obj).length === 0) return '{}';

    const colorIndex = depth % Object.keys(ANSI_COLORS).length;
    const [startColor, endColor] = ANSI_COLORS[Object.keys(ANSI_COLORS)[colorIndex]];

    const entries = Object.entries(obj).map(([key, value]) => {
        const coloredKey = `${startColor}"${key}"${endColor}`;
        const formattedValue = formatMessage(value, depth + 1);
        return `${depthTabs(depth + 1)}${coloredKey}: ${formattedValue}`;
    });

    return `${startColor}{${endColor}\n${entries.join(',\n')}\n${depthTabs(depth)}${startColor}}${endColor}`;
}

function depthTabs(depth) {
    return '\t'.repeat(depth);
}

module.exports ={
    log
}