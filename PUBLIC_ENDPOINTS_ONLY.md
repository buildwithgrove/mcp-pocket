# Public Endpoints Only

## What This MCP Server Does

This MCP server provides access to **Grove's free, public RPC endpoints** available at [grove.city/public-endpoints](https://grove.city/public-endpoints).

## What This MCP Server Does NOT Do

This server does **NOT**:
- ❌ Support Grove Portal authenticated endpoints
- ❌ Require or accept API keys
- ❌ Access user accounts or Portal applications
- ❌ Provide SLA guarantees or dedicated infrastructure
- ❌ Include analytics, usage tracking, or insights
- ❌ Support custom rate limits or enterprise features

## Public Endpoint ID

All blockchain services use the public endpoint identifier: `01fdb492`

This ID is hardcoded in the configuration and refers to Grove's public, shared infrastructure.

## Rate Limits

Public endpoints are subject to fair-use rate limits:
- Shared among all users
- May experience throttling during high load
- No guaranteed uptime or SLA
- Best effort basis

## When to Use Grove Portal Instead

Use [Grove Portal](https://portal.grove.city) if you need:
- ✅ Higher rate limits
- ✅ Dedicated infrastructure
- ✅ SLA guarantees
- ✅ Analytics and insights dashboard
- ✅ Custom security rules
- ✅ Production-grade reliability
- ✅ Technical support

## Use Cases

### ✅ Good Use Cases for Public Endpoints
- Learning and education
- Development and testing
- Prototyping applications
- Low-frequency queries
- Personal projects
- Demo applications

### ❌ Bad Use Cases for Public Endpoints
- Production applications
- High-frequency trading bots
- Critical infrastructure
- Business applications requiring SLAs
- Applications serving many users
- Time-sensitive operations

## Security Note

Since this MCP server only uses public endpoints:
- No authentication credentials are stored or transmitted
- No user data is accessed
- No Portal account information is required
- Safe to share and distribute publicly

## Configuration

The public endpoint URLs follow this pattern:
```
https://{blockchain}.rpc.grove.city/v1/01fdb492
```

Where:
- `{blockchain}` = Network identifier (eth, polygon, arbitrum, etc.)
- `01fdb492` = Public endpoint identifier (same for all users)

## Upgrading to Portal

To upgrade from public endpoints to Grove Portal:
1. Visit [portal.grove.city](https://portal.grove.city)
2. Create an account
3. Create a new application
4. Copy your custom application ID
5. Replace `01fdb492` with your application ID in the configuration
6. Note: This would require modifying the MCP server code, as it's currently designed for public-only use

For a Portal-enabled version of this MCP server, you would need to fork this repository and add authentication support.
