import { utcFormat } from "d3";
import "./stocks.css";

const timeFormat = utcFormat("%B %d %Y %H:%M");

export const Stocks = ({ stockData, tooltipData }) => {
  let stocksData = tooltipData ? tooltipData : stockData;

  return (
    <div className="stocks-container">
      {stocksData.map((stock) => (
        <div key={stock.ticker} className="stock-date-container">
          {tooltipData && (
            <p className="date">{timeFormat(new Date(+stock.timestamp))}</p>
          )}
          <div className={`${stock.ticker} stock-group`}>
            <div>
              <p className="stock">{stock.ticker}</p>
              <p className="price">${Number(stock.price).toFixed(2)}</p>
            </div>
            <div>
              <p
                className={`${stock.percentChange > 0 ? "up" : "down"} percent`}
              >
                {stock.percentChange > 0 ? "+" : ""}
                {stock.percentChange.toFixed(1)}
                <span>%</span>
              </p>
              <p
                className={`${stock.priceChange > 0 ? "up" : "down"} absolute`}
              >
                {stock.priceChange > 0 ? "+" : ""}$
                {stock.priceChange.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
