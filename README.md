# 内容管理

```shell
# 需要 node 版本为 14.x
node --version

# 安装依赖，需要保障 better-sqlite 的 addon 成功下载
yarn install

# 启动开发流程 打开 https://127.0.0.1:8128
yarn start

# 单元测试
yarn test

# 构建
yarn build

# 启动面向生产环境的包，日志会滚动记入 res/log 目录
yarn start:dist
npx pm2 start
```

备注
- 开发环境使用的是 http2 需要的证书见 `res/crt` 目录
  - 可以选择安装和信任 `ca.crt`
  - 也可以使用自己的证书替换 `yio.crt` 和 `yio.key`
- 浏览器中建议开启 `https://127.0.0.1:8128`
  - 使用 `https://localhost:8128` 容易导致浏览器在后续打开 `http://localhost` 时自动转向 `https`


## 架构简介

- 前端代码见 `src/pub` 目录
  - 其中 `script/ane` 为自定义框架的实现
  - 在 `script/index.js` 中提供了 CSR 和 SSR 的入口
- 服务代码
  - 目录 `svc` 容纳服务的实现
  - 目录 `data` 容纳数据访问功能
  - 目录 `web` 容纳 http 服务器的管理和路由
  - 目录 `rpc` 容纳 grpc 服务端 (目前未实现)
  - 目录 `err` 容纳自定义错误类型
