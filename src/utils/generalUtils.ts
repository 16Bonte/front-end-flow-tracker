import * as t from "@babel/types";
import { ADD_LOG_ROUTE } from "../constants";
import { getServerPort } from "../server";

export const generateUniqueId = (): string =>
  Math.random().toString(36).substring(2, 10);

export const insertLogStatement = (functionName: string) => {
  const uniqueId = generateUniqueId();
  const logMessage = `${uniqueId}: ${functionName}`;
  const serverPort = getServerPort();

  const port = serverPort || 0;

  return t.expressionStatement(
    t.callExpression(t.identifier("\nfetch"), [
      t.stringLiteral(`http://localhost:${port}${ADD_LOG_ROUTE}`),
      t.objectExpression([
        t.objectProperty(t.identifier("method"), t.stringLiteral("POST")),
        t.objectProperty(
          t.identifier("headers"),
          t.objectExpression([
            t.objectProperty(
              t.stringLiteral("Content-Type"),
              t.stringLiteral("application/json")
            ),
          ])
        ),
        t.objectProperty(
          t.identifier("body"),
          t.callExpression(
            t.memberExpression(t.identifier("JSON"), t.identifier("stringify")),
            [
              t.objectExpression([
                t.objectProperty(
                  t.identifier("message"),
                  t.stringLiteral(logMessage)
                ),
              ]),
              t.identifier("\n"),
            ]
          )
        ),
      ]),
    ])
  );
};
