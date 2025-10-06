# Referendum Signal API

API endpoint for retrieving prediction market signals for Polkadot/Kusama OpenGov referenda, including combinatorial/futarchy markets.

## Endpoint

```
GET /api/referendum/[refId]/signal
```

## Parameters

- `refId` (required): The referendum ID number

## Response Format

```typescript
{
  referendumId: number;
  chain: "polkadot" | "kusama";
  base_markets: Array<{
    marketId: number;
    question: string;
    status: string;
    volume: string;
    market_url: string;
  }>;
  combinatorial_market?: {
    poolId: number;
    market_1: { marketId: number; question: string };
    market_2: { marketId: number; question: string };
    outcomes: Array<{
      combination: string;           // e.g., "Pass & 100K+ Users"
      probability: number;           // 0-1
      description: string;
    }>;
    volume: string;
    liquidity: string;
    pool_url: string;
  };
  futarchy_signal?: {
    welfare_metric: string;          // Question from market 2
    recommendation: "approve" | "reject" | "uncertain";
    confidence: number;              // 0-100, based on liquidity
    reasoning: string;               // Human-readable explanation
  };
}
```

## Example Response

```json
{
  "referendumId": 123,
  "chain": "polkadot",
  "base_markets": [
    {
      "marketId": 1035,
      "question": "Will referendum #123 pass?",
      "status": "Active",
      "volume": "125.50",
      "market_url": "https://app.zeitgeist.pm/markets/1035"
    },
    {
      "marketId": 1037,
      "question": "Will Polkadot achieve 100K+ new users in 6 months?",
      "status": "Active",
      "volume": "89.20",
      "market_url": "https://app.zeitgeist.pm/markets/1037"
    }
  ],
  "combinatorial_market": {
    "poolId": 1051,
    "market_1": {
      "marketId": 1035,
      "question": "Will referendum #123 pass?"
    },
    "market_2": {
      "marketId": 1037,
      "question": "Will Polkadot achieve 100K+ new users in 6 months?"
    },
    "outcomes": [
      {
        "combination": "Pass & 100K+ Users",
        "probability": 0.58,
        "description": "Referendum passes AND achieves user adoption goal"
      },
      {
        "combination": "Pass & <100K Users",
        "probability": 0.12,
        "description": "Referendum passes BUT fails to achieve adoption"
      },
      {
        "combination": "Reject & 100K+ Users",
        "probability": 0.08,
        "description": "Referendum rejected BUT adoption happens anyway"
      },
      {
        "combination": "Reject & <100K Users",
        "probability": 0.22,
        "description": "Referendum rejected AND low adoption continues"
      }
    ],
    "volume": "45.30",
    "liquidity": "200.00",
    "pool_url": "https://app.zeitgeist.pm/multi-market/1051"
  },
  "futarchy_signal": {
    "welfare_metric": "Will Polkadot achieve 100K+ new users in 6 months?",
    "recommendation": "approve",
    "confidence": 85,
    "reasoning": "Market predicts 58% chance of positive outcome if approved vs 8% if rejected (7.3x ratio)"
  }
}
```

## Example Usage

### cURL
```bash
curl https://app.zeitgeist.pm/api/referendum/123/signal
```

### JavaScript/TypeScript
```javascript
const response = await fetch('https://app.zeitgeist.pm/api/referendum/123/signal');
const data = await response.json();

// Check if futarchy signal exists
if (data.futarchy_signal) {
  console.log(`Recommendation: ${data.futarchy_signal.recommendation}`);
  console.log(`Reasoning: ${data.futarchy_signal.reasoning}`);
  console.log(`Confidence: ${data.futarchy_signal.confidence}%`);
}

// Access combinatorial outcomes
if (data.combinatorial_market) {
  data.combinatorial_market.outcomes.forEach(outcome => {
    console.log(`${outcome.combination}: ${Math.round(outcome.probability * 100)}%`);
  });
}
```

### Polkassembly Integration Example
```javascript
// In referendum detail page
async function loadMarketSignal(referendumId) {
  try {
    const res = await fetch(`https://app.zeitgeist.pm/api/referendum/${referendumId}/signal`);
    const signal = await res.json();

    // Display futarchy recommendation if available
    if (signal.futarchy_signal) {
      displayFutarchySignal({
        recommendation: signal.futarchy_signal.recommendation,
        metric: signal.futarchy_signal.welfare_metric,
        reasoning: signal.futarchy_signal.reasoning,
        confidence: signal.futarchy_signal.confidence,
        poolUrl: signal.combinatorial_market?.pool_url
      });
    } else if (signal.base_markets.length > 0) {
      // Fallback to basic market display
      displayBasicMarkets(signal.base_markets);
    }
  } catch (err) {
    console.log('No prediction markets found for this referendum');
  }
}
```

## How Markets are Tagged

Markets are linked to referenda through tags:

1. **Standard Tags**:
   - `OpenGov` - General OpenGov market
   - `referendum:123` - Specific referendum ID
   - `opengov:123` - Alternative format
   - `ref-123` - Short format

2. **Combinatorial Markets**:
   - Created as `neoPools` with `isMultiMarket: true`
   - Link multiple markets via `marketIds` array
   - Example: Pool 1051 combines markets 1035 and 1037

3. **CMS Metadata** (optional):
   ```json
   {
     "referendumRef": {
       "chain": "polkadot",
       "referendumIndex": 123
     }
   }
   ```

## Futarchy Logic

When a combinatorial market exists with 2 binary markets:

1. **Market 1** = Proposal outcome (Pass/Reject)
2. **Market 2** = Welfare metric (Good/Bad outcome)

The API calculates the futarchy signal by comparing:
- Probability(Pass AND Good) vs Probability(Reject AND Good)

**Recommendation Logic:**
- `approve`: Pass+Good is >1.5x more likely than Reject+Good
- `reject`: Pass+Good is <0.67x as likely as Reject+Good
- `uncertain`: Ratio between 0.67x and 1.5x

## Caching

- Edge cache: 60 seconds
- Stale-while-revalidate: 120 seconds
- CORS enabled for cross-origin requests

## Error Responses

### 400 Bad Request
```json
{ "error": "Invalid referendum ID" }
```

### 404 Not Found
```json
{ "error": "No prediction markets found for this referendum" }
```

### 500 Internal Server Error
```json
{ "error": "Failed to fetch referendum market data" }
```

## Future Enhancements

- [ ] Real-time spot price integration for accurate outcome probabilities
- [ ] Support for N-market combinatorial pools (currently supports 2)
- [ ] Historical prediction accuracy tracking
- [ ] WebSocket support for live updates
- [ ] Aggregate multiple combinatorial pools per referendum
