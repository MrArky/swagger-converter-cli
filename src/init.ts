#!/usr/bin/env node
"use strict";

import fs from 'fs';


// 创建一个配置文件
fs.writeFile(`./swagger-converter.json`, `{
    "hostname": "192.168.0.1",
    "port": 443,
    "path": "/XXX/XXX/XX.json",
    "method": "GET",
    "serviceDepts":"",
    "template":"",
    "createDir":"./service"
}`, function (err) {
    if (err) console.log(`\x1B[31mgenerate config file failed:\x1B[0m`, err);
    else console.log(`\x1B[32mgenerate config file successed\x1B[0m`);
});
