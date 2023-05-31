import React, { useEffect, useState } from 'react';

const TIME_FRAMES = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  'all': 400 * 24 * 60 * 60 * 1000,
};

// This component fetches and displays your data
function MyTable() {
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('24h');
  const [data, setData] = useState([]);

  const fetchQuery = (marketName) => {
    let timeframeCondition = '';
    if (TIME_FRAMES[timeframe]) {
      timeframeCondition = `}, block_time: {_gt: "${new Date(Date.now() - TIME_FRAMES[timeframe]).toISOString()}"}`;
    }

    const query = `
      query {
        sui {
          actions_aggregate(where: {type: {_eq: "buy"}, market_name: {_eq: "${marketName}"${timeframeCondition}}) {
            aggregate {
              sum {
                usd_price
              }
            }
          }
        }
      }
    `;

    return fetch('https://api.indexer.xyz/graphql', {
      method: 'POST',
      headers: {
        "x-api-user": "YOUR-USERNAME",
        "x-api-key": "YOUR-API-KEY",
        "apikey_type": "prod",
        "role": "prod-user",
        "host_name": "api.indexer.xyz",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    })
    .then(response => response.json())
    .then(response => response.data);
  }

  useEffect(() => {
    setLoading(true);

    const marketNames = ['souffl3', 'bluemove', 'clutchy', 'tocen', 'keepsake'];

    Promise.all(marketNames.map(marketName => fetchQuery(marketName)))
      .then(responses => {
        setData(
          responses.map((response, index) => {
            return {
              market: marketNames[index],
              sum: response.sui.actions_aggregate.aggregate.sum.usd_price,
            };
          })
        );
        setLoading(false);
      })
      .catch(error => {
        setError(error);
        setLoading(false);
      });
  }, [timeframe]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error :(</p>;

  const sortedData = [...data].sort((a, b) => b.sum - a.sum);

  return (
    <div>
      <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
        {Object.keys(TIME_FRAMES).map((key) => (
          <option key={key} value={key}>{key}</option>
        ))}
      </select>

      <table>
        <thead>
          <tr>
            <th>Market Name</th>
            <th>Volume</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item, index) => (
            <tr key={index}>
              <td>{item.market}</td>
              <td>{Number(item.sum).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
            </tr>
          ))}
          <tr>
            <td><strong>Total</strong></td>
            <td><strong>{sortedData.reduce((total, item) => total + item.sum, 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong></td>
          </tr>
        </tbody>
      </table>
      <p>Powered by   <a href="https://indexer.xyz"> <img src="https://indexer.xyz/indexer-logo.svg"></img></a></p>
    </div>
  );
}

function App() {
  return (
    <div>
      <h2>Sui Marketplace Scoreboard</h2>
      <MyTable />
    </div>
  );
}

export default App;
