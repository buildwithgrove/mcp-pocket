# Grove Endpoints: Public by Default, Portal-Ready

## What This MCP Server Does

This MCP server provides access to **Grove's RPC endpoints**:
- **Default**: Uses free, public endpoints available at [grove.city/public-endpoints](https://grove.city/public-endpoints)
- **Optional**: Supports Grove Portal via GROVE_APP_ID for higher rate limits and enhanced features

## Endpoint Modes

### Public Endpoints (Default)
- ✅ No configuration required
- ✅ Works out of the box
- ✅ Free to use
- ⚠️ Subject to fair-use rate limits
- ⚠️ Shared infrastructure (may be throttled)
- ⚠️ No SLA guarantees

### Portal Endpoints (Optional)
Enable by setting the `GROVE_APP_ID` environment variable:
- ✅ Higher rate limits
- ✅ Dedicated infrastructure
- ✅ SLA guarantees
- ✅ Analytics and insights dashboard
- ✅ Custom security rules
- ✅ Production-grade reliability
- ✅ Technical support

## How to Enable Portal Endpoints

### Set Environment Variable (Recommended)
Set `GROVE_APP_ID` once; it applies to all chains:

```bash
export GROVE_APP_ID=your_app_id_from_portal
```

Then configure Claude Desktop as usual. The MCP server will automatically use your GROVE_APP_ID.

### Get Your GROVE_APP_ID
1. Visit [portal.grove.city](https://portal.grove.city)
2. Create an account (free)
3. Create a new application
4. Copy your application ID (this is your GROVE_APP_ID)

## Public Endpoint ID

The default public endpoint identifier is: `01fdb492`

This ID is used in the configuration and refers to Grove's public, shared infrastructure. When you set GROVE_APP_ID, it replaces this default.

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

**Public Endpoints (Default)**:
- No authentication credentials required
- No user data accessed
- No Portal account needed
- Safe to share and distribute

**Portal Endpoints (when GROVE_APP_ID is set)**:
- Your GROVE_APP_ID is used to authenticate requests
- Keep your GROVE_APP_ID secure (like an API key)
- Do not share your GROVE_APP_ID publicly
- Recommended to use environment variable rather than hardcoding

## Endpoint URL Patterns

**Public endpoints** (default):
```
https://{blockchain}.rpc.grove.city/v1/01fdb492
```

**Portal endpoints** (with GROVE_APP_ID):
```
https://{blockchain}.rpc.grove.city/v1/{your_app_id}
```

Where:
- `{blockchain}` = Network identifier (eth, polygon, arbitrum, etc.)
- `01fdb492` = Public endpoint identifier (default)
- `{your_app_id}` = The value you set in GROVE_APP_ID
