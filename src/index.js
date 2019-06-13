import express from "express";
import router from "./router";
import { swagger } from "./router";
import defaults from "./router/defaults";
import _ from "lodash";

const defaultOptions = {
  path: "/api",
  swagger: {
    enabled: true,
    title: "fapi",
    description: "",
    version: "1.0",
    path: "/api-docs"
  }
};

const server = (templates, options) => {
  const ops = _.merge({}, defaultOptions, options);
  const app = express();
  app.use(defaults());

  if (templates) {
    app.use(ops.path, router(templates));
    if (ops.swagger.enabled) {
      app.use(ops.swagger.path, swagger(templates, ops));
    }
  }
  return app;
};

export default server;

export { server, router };
