{
  "provider": {
    "name": "@example/sample-cafe",
    "tools": [
      {
        "name": "place_order",
        "description": "Place a drink order.",
        "effect": "state-changing",
        "inputSchema": {
          "type": "object",
          "properties": {
            "item": {
              "type": "string",
              "description": "Drink name"
            },
            "size": {
              "type": "string",
              "enum": [
                "S",
                "M",
                "L"
              ]
            }
          },
          "required": [
            "item",
            "size"
          ],
          "additionalProperties": false
        }
      },
      {
        "name": "find_item",
        "description": "Look up a menu item.",
        "effect": "read",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": {
              "type": "string"
            }
          },
          "required": [
            "query"
          ],
          "additionalProperties": false
        }
      }
    ]
  },
  "tasks": [
    {
      "taskId": "order-latte-M/1",
      "text": "Order a medium latte.",
      "allowableOutcomes": [
        "executed:place_order"
      ]
    },
    {
      "taskId": "order-coffee-underspecified/1",
      "text": "Order a coffee.",
      "allowableOutcomes": [
        "clarification",
        "no_tool_selected"
      ]
    }
  ]
}
