import { JSONSchema4 } from "./data";

/**
 * 字符串格式化
 */
export const stringFormat = function (str, ...arg) {
    const e = arg;
    return !!str && str.replace(/\{(\d+)\}/g, function (t, r) {
        return e[r] ?? t;
    });
};

/**
 * 将参数返回值转换成TS字符串
 */
export const transParamsAndResToTs = (json: JSONSchema4) => {
    if (!json) return `{}`;
    if (Object.keys(json).includes('$ref')) {
        // console.log(json['$ref'],json['$ref']?.split('/').slice(-1)[0]);
        return `APIOBJ['${json['$ref']?.split('/').slice(-1)[0]}']`;
    }
    else if (Object.keys(json).includes('allOf')) {
        return json['allOf']?.map(c => transParamsAndResToTs(c)).join(' & ') ?? '';
    }
    else if (json.type === 'object') {
        // 如果是 object、array 类型可能有嵌套 $ref
        if (json.type === 'object') {
            let properties = json.properties ?? {};
            return `{ ${Object.keys(properties).map(key => `${key}: ${transParamsAndResToTs(properties[key])}`).join('; ')} }`;
        }
    }
    else if (json.type === 'array') {
        // 是数组
        if (json.items?.length) {
            return `[ ${json.items?.map(c => transParamsAndResToTs(c)).join()} ]`;
        }
        else return transParamsAndResToTs(json.items!) + '[]'
    }
    else if (json.type === 'integer') return 'number'
    else return json.type ?? 'unknown';
}

/**
 * 创建字符串HASH值
 * @returns 
 */
export const getStringHash = function (s: string) {
    var hash = 0, i, chr;
    if (s.length === 0) return hash;
    for (i = 0; i < s.length; i++) {
        chr = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}