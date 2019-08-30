import server from "../src";

let templates = {
  ping: [
    {
      req: {
        method: "post",
        query: {
          count: ".*"
        },
        headers: {
          authorization: "Bearer abc"
        }
      },
      res: { body: { result: "pong1" } },
      _swagger: {
        req: {
          body: {
            required: true,
            schema: {
              type: "object",
              properties: {
                id: {
                  type: "integer",
                  format: "int64"
                },
                petId: {
                  type: "integer",
                  format: "int64"
                },
                quantity: {
                  type: "integer",
                  format: "int32"
                },
                shipDate: {
                  type: "string",
                  format: "date-time"
                },
                status: {
                  type: "string",
                  description: "Order Status",
                  enum: ["placed", "approved", "delivered"]
                },
                complete: {
                  type: "boolean",
                  default: false
                }
              }
            }
          },
          query: {
            count: {
              description: "amount",
              type: "integer"
            }
          },
          headers: {
            authorization: {
              description: "Auth header",
              required: true,
              type: "string"
            }
          }
        }
      }
    }
  ]
};

const app = server(templates, {
  swagger: {
    title: "test api"
  }
});
const port = 3001;
app.listen(port, () => {
  console.log(`Running on port ${port}.`);
});
