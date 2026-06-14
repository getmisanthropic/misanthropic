const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: CORS,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Try pump.fun API first
    let response = await fetch('https://frontend-api-v2.pump.fun/coins/trending', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
    });

    // If v2 fails, try v1
    if (!response.ok) {
      response = await fetch('https://frontend-api.pump.fun/coins/trending', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
      });
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch trending coins: ${response.status}`);
    }

    const data = await response.json();
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify(data),
    };
  } catch (err) {
    // Fallback to mock data if both APIs fail
    const mockData = [
      {
        name: 'Misanthropic',
        symbol: 'MIS',
        mint: 'AWQSXRxiNUGLj9moJMFhq2axqwu6Dqerp16ftj4FjLyG',
        image_uri: 'https://pbs.twimg.com/media/Gc0X0M7aQAAXZ29.jpg',
        usd_market_cap: 2340000,
      },
      {
        name: 'Drooling Cat',
        symbol: 'DRCAT',
        mint: '79H4C1V3L1C8T5P8Y9M3Z2K1Q4W7E8R9T0Y',
        image_uri: 'https://placehold.co/240x140/orange/white?text=🐱',
        usd_market_cap: 1280000,
      },
      {
        name: 'Kintara',
        symbol: 'KINT',
        mint: 'K1NT4R4C01N4DDR3SS1234567890',
        image_uri: 'https://placehold.co/240x140/teal/white?text=🃏',
        usd_market_cap: 15200000,
      },
      {
        name: 'Bountywork',
        symbol: 'BOUNTY',
        mint: 'B0UNTYW0RKC01N4DDR3SS12345',
        image_uri: 'https://placehold.co/240x140/green/white?text=💼',
        usd_market_cap: 593000,
      },
      {
        name: 'Jotchua',
        symbol: 'JOT',
        mint: 'J0TCHU4C01N4DDR3SS12345678',
        image_uri: 'https://placehold.co/240x140/pink/white?text=🐕',
        usd_market_cap: 5850000,
      },
      {
        name: 'Three',
        symbol: 'THREE',
        mint: 'THR33C01N4DDR3SS1234567890',
        image_uri: 'https://placehold.co/240x140/purple/white?text=3️⃣',
        usd_market_cap: 3490000,
      },
    ];

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify(mockData),
    };
  }
};
