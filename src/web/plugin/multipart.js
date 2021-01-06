/**
 * 支持 multipart/form-data 类型请求
 * 
 * 提供 req.file() 和 req.files() 接口用于接收上传图片
 * 一但流读取被如 file 和 files 之类的接口触发，就必须消费完
 * 否则请求流会永远等待消费，导致返回超时而失败
 */
import fastifyMultipart from 'fastify-multipart';

export default function(app) {
  app.register(fastifyMultipart, {
    limits: {
      fieldNameSize: 100, // 数据字段所有字段名最多 100Byte
      fieldSize: 1048576, // 数据字段所有数据最多 1MB
      fields: 10,         // 数据字段总数不超过 10
      fileSize: 2097152,  // 文件最大 2MB
      files: 9,           // 同时最多上传 9 个文件
      headerPairs: 2000   // 请求头内最多容纳的键值对数量
    },
    attachFieldsToBody: false
  });
}