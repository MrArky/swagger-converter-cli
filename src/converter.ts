#!/usr/bin/env node

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { compile } from 'json-schema-to-typescript';
import { JSONSchema4 } from './data';
import { getStringHash, stringFormat, transParamsAndResToTs } from './utils';
import { pinyin } from 'pinyin-pro';

/**
 * 用户自定义配置的类型
 */
declare type userInitJsonType = {
    protocol?: 'https' | 'http';
    hostname?: string;
    port?: number;
    path?: string;
    method?: string;
    serviceDepts?: string;
    template?: string;
    createDir?: string;
}

/**
 * 删除文件夹
 * @param url 
 */
function deleteDir(url) {
    var files: string[] = [];
    if (fs.existsSync(url)) {  //判断给定的路径是否存在
        files = fs.readdirSync(url);   //返回文件和子目录的数组
        files.forEach(function (file, index) {
            var curPath = path.join(url, file);

            if (fs.statSync(curPath).isDirectory()) { //同步读取文件夹文件，如果是文件夹，则函数回调
                deleteDir(curPath);
            } else {
                fs.unlinkSync(curPath);    //是指定文件，则删除
            }

        });

        fs.rmdirSync(url); //清除文件夹
    }
}

// 获取配置 json
fs.readFile('./swagger-converter.json', 'utf-8', function (error, data) {
    if (error) return console.log(`\x1B[31mError trying to read file swagger-converter.json，please execute 'npx swagger-converter' for help\x1B[0m`);
    /**
     * 用户自己的配置
     */
    let configJson: userInitJsonType = {};
    /**
     * 请求选项
     */
    let options: https.RequestOptions = {};
    try {
        configJson = JSON.parse(data) as userInitJsonType;
        options = {
            hostname: configJson.hostname,
            port: configJson.port,
            path: configJson.path,
            method: configJson.method,
            headers: { 'content-type': 'text/html;charset=utf-8' }
        };
        if (!configJson.serviceDepts || !configJson.template || !configJson.createDir) throw Error();
    }
    catch (error) {
        return console.log(`\x1B[31mConfiguration is not valid json\x1B[0m`);
    }
    // 禁止证书检查
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    /**
     * 请求 Swagger 的 json
     */
    const req = (configJson.protocol === 'http' ? http : https).request(options, res => {
        try {
            let data = '';
            res.setEncoding('utf8');
            res.on('data', d => data += d);
            res.on('end', () => {
                deleteDir(configJson.createDir);
                fs.mkdir(configJson.createDir!, { recursive: true }, async (error) => {
                    if (error) console.error(`\x1B[31mFailed to create service directory${error}\x1B[0m`);
                    else {
                        const json: JSONSchema4 = JSON.parse(data);
                        // 遍历json.paths写入文件
                        for (const path of Object.keys(json.paths)) {
                            // 遍历下面的 restful
                            for (const rest of Object.keys(json.paths[path])) {
                                // 将接口写入对应的文件
                                json.paths[path][rest].tags.forEach(async tag => {
                                    let fileName = pinyin(tag, { toneType: 'none' }).split(' ').map((c, i) => {
                                        return c.length > 1 && i ? c[0].toUpperCase() + c.slice(1) : (i == 0 ? c.toLowerCase() : c)
                                    }).join('');
                                    if (!fs.existsSync(configJson.createDir + `/${fileName}.ts`)) {
                                        fs.appendFileSync(configJson.createDir + `/${fileName}.ts`, `/**------------------------------------------------------------------------------------
*
* 这个文件是通过 swagger-converter-ts 自动生成的。不要手工修改它。相反，修改源 JSONSchema 文件
* 并运行 npx swagger-converter-ts 来重新生成该文件。
* qs 是我们强依赖的一个包，如果项目中没有引用，或许在需要安装它： npm i qs --save
*
----------------------------------------------------------------------------------------*/

import { APIOBJ } from './data';
import { stringify } from "qs";
${configJson.serviceDepts}

                                    `, function (err) {
                                            // if (err) console.log(`\x1B[31mdepts write failure\x1B[0m`, err);
                                            // else console.log(`\x1B[32mdepts write successed\x1B[0m`, path, rest);
                                        } as any);
                                    }
                                    let url = path;
                                    /* 处理参数 ,参数的位置可能是在path、body、query */

                                    //#region 处理 path 参数
                                    let pathQueryObj = json.paths[path][rest].parameters?.filter(c => c.in === 'path');
                                    let pathQuery = pathQueryObj?.map(c => {
                                        url = url.replace(`{${c.name}}`, '${$' + c.name + '}');
                                        return `$${c.name}: ${c.type === 'integer' ? 'number' : 'string'}, `
                                    });
                                    let pathName = pathQueryObj?.map(c => {
                                        return c.name[0].toUpperCase() + c.name.slice(1).toLowerCase();
                                    })?.join('And') ?? '';
                                    if (pathName?.length) pathName = 'By' + pathName;
                                    //#endregion
                                    //#region 处理 path 参数
                                    let queryStringObj = json.paths[path][rest].parameters?.filter(c => c.in === 'query');
                                    let queryStringObjQuery = queryStringObj?.map(c => {
                                        return `$${c.name}: ${c.type === 'integer' ? 'number' : 'string'}; `
                                    })?.join('') ?? '';
                                    //#endregion
                                    let pathParamsDesc = pathQueryObj?.map(c => `* @param $${c.name} ${c.description ?? '参数'}`).join('\n') ?? '';
                                    fs.appendFile(configJson.createDir + `/${fileName}.ts`, stringFormat(configJson.template, // 模板
                                        json.paths[path][rest].summary, // 描述
                                        pathParamsDesc ? '\n' + pathParamsDesc : '', // path 参数描述
                                        path.replace(/\/\{([\s\S]*)\}/, '') // 去掉参数
                                            .split('/').slice(-1)[0] + pathName + getStringHash(path).toString().replace('-', '$') + rest[0].toUpperCase() + rest.slice(1).toLowerCase(), // service 函数名称
                                        pathQuery?.join('') ?? '', // path 参数
                                        await transParamsAndResToTs(json.paths[path][rest].parameters?.find(c => c.in === 'body')?.schema), // body 参数
                                        `{ ${queryStringObjQuery} }`, // url 参数
                                        rest.toLowerCase(), // 请求方式
                                        await transParamsAndResToTs(json.paths[path][rest].responses?.['200']?.schema), // 返回值 ts 类型
                                        url, // 请求 url，已注入 path 参数
                                    ), function (err) {
                                        // if (err) console.log(`${path.replace(/\/\{([\s\S]*)\}/, '').split('/').slice(-1)[0] + rest[0].toUpperCase() + rest.slice(1).toLowerCase()}写入失败`, err);
                                        // else console.log(`${path.replace(/\/\{([\s\S]*)\}/, '').split('/').slice(-1)[0] + rest[0].toUpperCase() + rest.slice(1).toLowerCase()}写入成功`, path, rest);
                                    });
                                });
                            }
                        }
                        let apiObj: JSONSchema4 = {
                            type: "object",
                            properties: json.definitions,
                            definitions: json.definitions
                        };
                        // 将 schemes 对象解析成 ts 对象
                        compile(apiObj, 'APIOBJ', {
                            // unknownAny: false,
                            bannerComment: `/**
* 这个文件是通过 swagger-converter-ts 自动生成的。不要手工修改它。相反，修改源JSONSchema文件\n* 并运行 npx swagger-converter-ts 来重新生成该文件。
*/`
                        }).then(ts => {
                            fs.appendFile(configJson.createDir + `/data.d.ts`, ts.replace(/\[k: string\]: unknown;/g, ''), function (err) {
                                if (err) console.log(`\x1B[31mAPIOBJ write failure\x1B[0m`, err);
                                else console.log(`\x1B[32mAPIOBJ write successed\x1B[0m`);
                            });
                        });
                        // }
                    }
                });
            });
        }
        catch (e) {
            console.log('\x1B[31mError：\x1B[0m', e);
        }
    });

    req.on('error', error => {
        console.error(error)
    });

    req.end();
});
