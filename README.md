# swagger-converter-cli
### 📖 介绍
用于将 Swagger 的 json对象转为 ts 文件定义
### 🔨 安装
``` txt
npm install swagger-converter-cli
```
### 💡 使用示例
#### 查看帮助文档命令：
``` txt
npx swagger-converter
```
``` txt
Usage:

    npx swagger-converter-init       : generate config file
    npx swagger-converter-ts         : generate ts file

```
#### 创建配置文件命令：
```
npx swagger-converter-init
```
文件默认创建在根目录，命名为 `swagger-converter.json`（**也可以不使用命令手动创建**）:
``` json
{
    "hostname": "192.168.168.231",
    "port": 443,
    "path": "/api/swagger/doc.json",
    "method": "GET",
    "serviceDepts": "import myRequest from \"@/utils/myRequest\";\nimport { RequestOptionsWithResponse } from \"umi-request\";",
    "template": "\n/**\n* {0}{1}\n* @param $data body 参数\n* @param $queryString url参数\n*/\nexport async function {2}({3}$data?:{4},$queryString?:{5}, options?: Omit<RequestOptionsWithResponse,'data'>) {\n    return myRequest.{6}<{7}>(`{8}` + '?' + stringify($queryString), {\n        data: $data,\n        ...options\n    });\n}\n",
    "createDir": "./service"
}
```
- hostname：json请求host地址（目前仅支持 https 协议，后期会扩展 http 协议）
- port：请求端口
- path：请求路由
- method：请求方式
- serviceDepts：`service` 方法定义可能使用第三方库，如 umi-request、Axios,那么在使用 `template` 时会用到他们，这里帮助 `template` 生成时，在文件顶部加入引用
- template：`service` 定义模板

  内部会执行 **stringFormat**，将 `{x}` 替换一些关键内容。
  - {0}：接口描述
  - {1}：path 参数描述
  - {2}：内部根据一些关键信息生成函数名称
  - {3}：path 参数
  - {4}：body 参数
  - {5}：url 参数
  - {6}：请求方式
  - {7}：返回值 ts 类型
  - {8}：请求 url，已注入 path 参数
- createDir：生成文件在项目中的位置（**注意：每次生成文件时会清空该文件夹，所以不要与项目其他文件共用该文件夹**）。
#### 生成文件命令
``` txt
npx swagger-converter-ts
```
