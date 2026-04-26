# Salla Partner API MCP

An MCP server that lets Salla app developers ask questions about the Partner API and perform real API actions — all from within any MCP-compatible AI client (Claude Desktop, Claude Code, etc.).

**23 tools in two layers:**
- **Knowledge layer** — answers questions, returns guides, event schemas, and code examples from bundled docs (no credentials needed)
- **Action layer** — makes real API calls: manage apps, OAuth tokens, webhooks, subscriptions, and run health checks

---

## Installation

```bash
git clone https://github.com/bakrsabeeh/salla-partner-mcp.git
cd salla-partner-mcp
npm install
npm run build
```

---

## Configuration

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "salla-partner": {
      "command": "node",
      "args": ["/absolute/path/to/salla-partner-mcp/dist/index.js"],
      "env": {
        "SALLA_CLIENT_ID": "your_client_id",
        "SALLA_CLIENT_SECRET": "your_client_secret",
        "SALLA_ACCESS_TOKEN": "your_access_token",
        "SALLA_REFRESH_TOKEN": "your_refresh_token"
      }
    }
  }
}
```

Restart Claude Desktop — all 23 tools will be available.

### Claude Code

```bash
claude mcp add salla-partner node /absolute/path/to/salla-partner-mcp/dist/index.js \
  --env SALLA_CLIENT_ID=your_client_id \
  --env SALLA_CLIENT_SECRET=your_client_secret \
  --env SALLA_ACCESS_TOKEN=your_access_token
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SALLA_CLIENT_ID` | Yes | From Partners Portal → App Details → App Keys |
| `SALLA_CLIENT_SECRET` | Yes | From Partners Portal → App Details → App Keys |
| `SALLA_ACCESS_TOKEN` | Optional | Skip OAuth if you already have a token |
| `SALLA_REFRESH_TOKEN` | Optional | Enables automatic token refresh |

---

## Tool Reference

### Knowledge Layer — no credentials needed

| Tool | Description |
|---|---|
| `ask_question` | Free-form Q&A about the Partner API |
| `get_guide` | Step-by-step guide for a topic |
| `list_webhook_events` | All available webhook event types, filterable by category |
| `get_event_schema` | Full payload schema for a specific event |
| `get_code_example` | Ready-to-use TypeScript code snippet |
| `get_oauth_guide` | OAuth 2.0 guide for Easy Mode or Custom Mode |
| `get_publishing_checklist` | 6-step app publishing requirements |
| `get_subscription_plan_types` | All 6 plan type definitions |

**`get_guide` topics:** `create_app` · `setup_oauth` · `configure_webhooks` · `submit_app` · `manage_subscriptions` · `trusted_ips` · `snippets` · `custom_plans` · `dns` · `testing` · `publishing` · `app_requirements`

**`get_code_example` features:** `oauth_easy_mode` · `oauth_custom_mode` · `verify_webhook` · `refresh_token` · `api_request`

### Action Layer — requires credentials

**OAuth & Auth**

| Tool | Description |
|---|---|
| `get_oauth_url` | Generate the merchant authorization URL |
| `exchange_token` | Exchange auth code for access + refresh tokens |
| `refresh_access_token` | Refresh the access token (mutex-protected) |
| `get_current_merchant` | Get authenticated merchant info |

**App Management**

| Tool | Description |
|---|---|
| `list_apps` | List all apps in the partner account |
| `get_app` | Get full app details |
| `get_app_settings` | Get custom settings configured by merchants |
| `regenerate_secret` | Regenerate client secret or webhook secret |

**Webhook Management**

| Tool | Description |
|---|---|
| `list_webhooks` | List registered webhooks for an app |
| `register_webhook` | Register a new webhook endpoint |
| `delete_webhook` | Remove a webhook registration |
| `get_webhook_logs` | Fetch delivery logs for debugging |

**Subscriptions & Events**

| Tool | Description |
|---|---|
| `get_subscription_details` | Full subscription data: plan, pricing, features, balance |
| `list_app_events` | Recent app lifecycle events (installs, feedback, etc.) |

**Diagnostics**

| Tool | Description |
|---|---|
| `diagnose_app` | Health check: token, app config, webhooks, subscription |

---

## Example Usage

Once connected to Claude Desktop or Claude Code, just ask naturally:

> *"How do I create my first Salla app?"*
> → Calls `get_guide("create_app")`

> *"Show me the payload for app.store.authorize"*
> → Calls `get_event_schema("app.store.authorize")`

> *"Give me a code example for verifying webhooks"*
> → Calls `get_code_example("verify_webhook")`

> *"Run a health check on app 513499943"*
> → Calls `diagnose_app(513499943)`

> *"What's the subscription status for my app?"*
> → Calls `get_subscription_details(app_id)`

---

## Token Lifecycle

- Access tokens expire after **2 weeks** — the server auto-refreshes using the stored refresh token
- Refresh tokens expire after **~1 month** and are **single-use**
- All refresh calls are serialized via a mutex — concurrent refresh requests cause Salla to revoke all tokens and force a merchant reinstall
- Include `offline_access` in your OAuth scopes to receive a refresh token

---

## Development

```bash
npm test           # run unit + integration tests (42 tests)
npm run test:watch # watch mode

# E2E tests against the real API (requires a demo store)
SALLA_ACCESS_TOKEN=<tok> SALLA_APP_ID=<id> \
SALLA_CLIENT_ID=<cid> SALLA_CLIENT_SECRET=<secret> \
TEST_E2E=true npm run test:e2e
```

### Project Structure

```
src/
├── types.ts              # ToolResult<T>, ErrorCode, shared interfaces
├── token-manager.ts      # Token state machine + mutex
├── api-client.ts         # Axios wrapper + error normalization
├── knowledge/
│   ├── content.ts        # Bundled guides, event schemas, code examples
│   └── tools.ts          # 8 knowledge tool handlers
├── actions/
│   ├── oauth.ts          # OAuth tools
│   ├── apps.ts           # App management tools
│   ├── webhooks.ts       # Webhook tools
│   ├── subscriptions.ts  # Subscription + events tools
│   └── diagnostics.ts    # diagnose_app composite tool
├── server.ts             # MCP server + tool registration
└── index.ts              # Entry point (stdio transport)
```

---

## Resources

- [Salla Partner API Docs](https://docs.salla.dev/421412m0)
- [App Events Reference](https://docs.salla.dev/421413m0)
- [OAuth 2.0 Guide](https://docs.salla.dev/421118m0)
- [Webhooks Guide](https://docs.salla.dev/421119m0)
- [Partners Portal](https://portal.salla.partners)
