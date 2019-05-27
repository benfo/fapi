import express from "express";
import _ from "lodash";
import { evaluate, isEqual } from "../utils";
import * as tc from "../utils/typechecking";
import delay from "./delay";

/**
 * @param {Object} template
 * @param {express.Request} req
 */
function getStatus(resTemplate, req) {
  if (resTemplate.status) {
    return resTemplate.status;
  }
  let status = resTemplate.status || 200;

  if (req.method === "POST") {
    status = 201;
  }

  if (req.method === "GET" && !resTemplate.body) {
    status = 404;
  }

  return status;
}

function evaluateTemplate(template) {
  /**
   * @param {express.Request} req
   * @param {express.Response} res
   * @param {express.NextFunction} next
   */
  const fn = function(req, res, next) {
    
    //we don't check if req.matched is false here, as
    //we want to evaulate every template when this handler is called more than once

    req.template = {
      req: evaluate(template.req, { template, req }),
      res: evaluate(template.res, { template, req })
    };

    //set req.matched to true here to make sure we always do the checks
    req.matched = true;

    next();
  };
  return fn;
}

function queryMatcher() {
  /**
   * @param {express.Request} req
   * @param {express.Response} res
   * @param {express.NextFunction} next
   */
  return function(req, res, next) {
    if (req.matched === false) {
      next();
      return;
    }

    let template = req.template;

    // match query if specified
    let queryTemplate = template.req.query;
    if (queryTemplate) {
      req.matched = isEqual(queryTemplate, req.query);
    }
    next();
  };
}
function bodyMatcher() {
  /**
   * @param {express.Request} req
   * @param {express.Response} res
   * @param {express.NextFunction} next
   */
  return function(req, res, next) {
    if (req.matched === false) {
      next();
      return;
    }

    // match body if specified
    let template = req.template;
    if (template.req.body) {
      req.matched = isEqual(template.req.body, req.body);
    }
    next();
  };
}
function headerMatcher() {
  /**
   * @param {express.Request} req
   * @param {express.Response} res
   * @param {express.NextFunction} next
   */
  return function(req, res, next) {
    if (req.matched === false) {
      next();
      return;
    }

    let headersTemplate = req.template.req.headers;
    if (headersTemplate) {
      req.matched = Object.keys(headersTemplate).every(header => {
        return isEqual(headersTemplate[header], req.get(header));
      });
    }
    next();
  };
}

function prepareResponse() {
  /**
   * @param {express.Request} req
   * @param {express.Response} res
   * @param {express.NextFunction} next
   */
  const fn = function(req, res, next) {
    if (req.matched === false) {
      next();
      return;
    }

    res.set(req.template.res.headers);

    if (tc.isPrimitive(req.template.res) || tc.isArray(req.template.res)) {
      res.send(req.template.res);
      return;
    }

    res.status(getStatus(req.template.res, req));
    res.send(req.template.res.body);
  };
  return fn;
}

function defaultReqHandler(requestDefaults) {
  return function(req, res, next) {
    if (!requestDefaults) {
      next();
      return;
    }

    let evalReq = evaluate(requestDefaults, { req });
    if (evalReq.headers) {
      if (
        !isEqual(evalReq.headers["authorization"], req.get("authorization"))
      ) {
        res.status(401);
        res.send(evalReq.body401);
        return;
      }

      req.matched = Object.keys(evalReq.headers).every(header => {
        return isEqual(evalReq.headers[header], req.get(header));
      });
    }

    next();
  };
}

function defaultResHandler(responseDefaults) {
  return function(req, res, next) {
    if (!responseDefaults) {
      res.status(404);
      res.send();
      return;
    }

    let evalRes = evaluate(responseDefaults, { req });
    if (evalRes.status) {
      res.status(evalRes.status);

      let body = evalRes[`body${evalRes.status}`] || evalRes.body;
      console.log(body);
      res.send(body);
    }
  };
}

export default function(templates) {
  const defaultTemplate = {
    req: { method: "get", path: "/" },
    res: {}
  };

  const router = express.Router();

  for (const key of Object.keys(templates)) {
    let userTemplates = templates[key];
    let userDefaults;

    if (!_.isArray(userTemplates)) {
      userDefaults = userTemplates.defaults;
      userTemplates = userTemplates.templates;
    }
    userDefaults = _.merge({}, userDefaults);

    const subRouter = express.Router();

    //set the handlers here so we do not reset them when we have multiple templates
    let handlers = [];

    for (const userTemplate of userTemplates) {
      let template = _.merge({}, defaultTemplate, userTemplate);
      const requestTemplate = evaluate(template.req);
      const options = template.options;
      if (options) {
        if (options.delay) {
          handlers.push(delay(options.delay));
        }
      }

      handlers.push(
        evaluateTemplate({
          req: requestTemplate,
          res: template.res
        }),
        headerMatcher(),
        queryMatcher(),
        bodyMatcher(),
        prepareResponse()
      );
      subRouter[requestTemplate.method](requestTemplate.path, handlers);
    }

    //move this here as we only want to set the handlers once we have added them all
    subRouter[requestTemplate.method](requestTemplate.path, handlers);

    router.all(`/${key}`, defaultReqHandler(userDefaults.req));
    router.use(`/${key}`, subRouter);
    router.all(`/${key}`, defaultResHandler(userDefaults.res));
  }

  return router;
}
