import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ToggleButtonGroup, ToggleButton } from "react-aria-components";
import { ParentSize } from "@visx/responsive";
import { csv, group, utcFormat } from "d3";
import { useQuery } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { Viz } from "./components/Viz";
import "./chart.css";

const timeFormatter = utcFormat("%H:%M");
const priceTickFormatter = (d) => Number(d).toFixed(2);
const percentTickFormatter = (d) => Number(d).toFixed(1);
const timeAccessor = (d) => +d.timestamp;
const priceAccessor = (d) => +d.price;
const percentChangeAccessor = (d) => d.percentChange;

export const Chart = () => {
  let queryClient = useQueryClient();

  let { isPending, isError, data, error } = useQuery({
    queryKey: ["marketData"],
    queryFn: async () => await csv("http://localhost:3000/market-history"),
  });

  let [selectedCharts, setSelectedCharts] = useState(["GOOGL"]);

  useEffect(() => {
    let socket;

    if (selectedCharts.length > 0) {
      socket = io("http://localhost:3000");
      socket.on("market events", () => {
        queryClient.invalidateQueries();
      });
      socket.on("start new day", () => {
        queryClient.invalidateQueries();
      });
    }

    return () => {
      if (socket) {
        socket.off();
        socket.close();
      }
    };
  }, [selectedCharts]);

  if (isPending) {
    return <p>Loading chart</p>;
  }

  if (isError) {
    console.error(error);
    return <p>There was an error retreiving the data</p>;
  }

  let grouped = group(data, (d) => d.ticker);

  grouped.forEach((values) => {
    values.forEach((value, index, arr) => {
      value.priceChange =
        arr.length > 1 ? (+arr[0].price - +value.price) * -1 : 0;
      value.percentChange =
        arr.length > 1
          ? ((+value.price - +arr[0].price) / +arr[0].price) * 100
          : 0;
    });
  });

  return (
    <>
      <ToggleButtonGroup
        selectionMode="multiple"
        className="buttons"
        selectedKeys={selectedCharts}
        onSelectionChange={(set) => {
          setSelectedCharts(Array.from(set.values()));
        }}
      >
        {[...grouped.keys()].map((key, index) => (
          <ToggleButton className={key} id={key} key={key}>
            {key}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      {selectedCharts.length > 0 && (
        <div className="chart-container">
          <svg xmlns="http://www.w3.org/2000/svg" height="0" width="0">
            <filter id="shadow" colorInterpolationFilters="sRGB">
              <feDropShadow
                dx="1"
                dy="1"
                stdDeviation="0"
                floodOpacity="1"
                floodColor="#fff"
              />
              <feDropShadow
                dx="-1"
                dy="-1"
                stdDeviation="0"
                floodOpacity="1"
                floodColor="#fff"
              />
            </filter>
          </svg>
          <ParentSize>
            {({ width, height }) => {
              if (width < 400) return null;
              return (
                <Viz
                  width={width}
                  height={height}
                  timeFormatter={timeFormatter}
                  priceTickFormatter={priceTickFormatter}
                  percentTickFormatter={percentTickFormatter}
                  timeAccessor={timeAccessor}
                  priceAccessor={priceAccessor}
                  percentChangeAccessor={percentChangeAccessor}
                  selectedCharts={selectedCharts}
                  data={grouped}
                />
              );
            }}
          </ParentSize>
        </div>
      )}
    </>
  );
};
