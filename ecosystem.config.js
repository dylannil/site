/**
 * PM2 配置文件
 * 
 * - env 和 env_development 环境变量
 *   - 默认 production
 *   - pm2 start --env development
 * - cron_restart 服务器时间每周六的 16:00 重启一次
 * - instances 使用 2 个进程运行服务
 */
module.exports = {
  apps : [
    {
      name: 'site',
      script: 'dist/index.js',
      cwd: '.',
      env: {
        NODE_ENV: 'production'
      },
      env_development: {
        NODE_ENV: 'development'
      },
      watch: false,
      instances: 1,
      exec_mode: "cluster",
      max_memory_restart: '200M',
      cron_restart: '0 0 16 * * 6',
      source_map_support: false
    }
  ]
};