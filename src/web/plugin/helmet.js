/**
 * 安全头
 * 
 * 如 hidePoweredBy、refererPolicy
 */
import fastifyHelmet from 'fastify-helmet';

export default function(app) {
  app.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "http:", "https:", "data:"]
      }
    }
  });
}